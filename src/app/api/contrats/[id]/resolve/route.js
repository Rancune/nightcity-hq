// src/app/api/contrats/[id]/resolve/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import PlayerProfile from '@/models/PlayerProfile';
import { generateResolutionLore, calculateReputationFromLore } from '@/Lib/ai';
import Netrunner from '@/models/Netrunner';
import { 
  determineDifficulty, 
  calculateReputationGain, 
  calculateReputationLoss,
  getReputationLevelInfo 
} from '@/Lib/reputation';
import { testRunnerSkills } from '@/Lib/skillTest';
import FactionRelations from '@/models/FactionRelations';
import { calculateFactionImpacts } from '@/Lib/factionRelations';

// Fonction pour générer une cause de mort basée sur le contexte
function generateDeathCause(contract, skillTest) {
  const causes = [
    "Grillé par ICE",
    "Tué en combat",
    "Overdose de cyberpsychose",
    "Défaillance d'implant critique",
    "Trahison d'un contact",
    "Accident de navigation",
    "Empoisonnement",
    "Décharge électrique fatale",
    "Implosion de système",
    "Suicide par déconnexion"
  ];
  
  // Choisir une cause basée sur les compétences qui ont le plus échoué
  const failedSkills = Object.entries(skillTest.skillResults)
    .filter(([skill, result]) => !result.success)
    .sort((a, b) => b[1].required - a[1].required);
  
  if (failedSkills.length > 0) {
    const [worstSkill] = failedSkills[0];
    if (worstSkill === 'hacking') {
      return causes[0]; // "Grillé par ICE"
    } else if (worstSkill === 'combat') {
      return causes[1]; // "Tué en combat"
    } else if (worstSkill === 'stealth') {
      return causes[4]; // "Trahison d'un contact"
    }
  }
  
  // Cause aléatoire si aucune correspondance
  return causes[Math.floor(Math.random() * causes.length)];
}

// Fonction pour générer une épitaphe
function generateEpitaph(runnerName, deathCause, contract) {
  const epitaphs = [
    `"${runnerName} a choisi la voie du code éternel."`,
    `"Dans la matrice, ${runnerName} vit encore."`,
    `"Un runner de plus dans les archives de Night City."`,
    `"${runnerName} a trouvé la paix dans le silence numérique."`,
    `"Le code ne meurt jamais, ${runnerName} non plus."`,
    `"Une légende de plus dans les rues de Night City."`,
    `"${runnerName} a payé le prix ultime pour la liberté."`,
    `"Dans l'ombre, ${runnerName} veille encore."`,
    `"Un fantôme de plus dans le réseau."`,
    `"${runnerName} a rejoint les archives des disparus."`
  ];
  
  return epitaphs[Math.floor(Math.random() * epitaphs.length)];
}

export async function POST(request, props) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();
    const contractId = params.id;
    const contract = await Contract.findById(contractId).populate('assignedRunners');

    if (!contract || contract.ownerId !== userId || contract.status !== 'En attente de rapport') {
      return new NextResponse("Contrat non valide pour cette action.", { status: 404 });
    }

    // --- SYSTÈME D'ÉQUIPE D'INFILTRATION ---
    // Pour l'instant, on garde la compatibilité avec un seul runner
    // TODO: Implémenter le système multi-runners dans une future version
    // Multi-runner : on mappe chaque skill requise à son runner
    const assigned = Array.isArray(contract.assignedRunners) ? contract.assignedRunners : [];
    // Récupérer les effets actifs du joueur
    const playerEffects = contract.activeProgramEffects?.find(e => e.clerkId === userId)?.effects || {};
    const requiredSkills = Object.entries(contract.requiredSkills || {}).filter(([_, v]) => v > 0).map(([k, v]) => k);
    // Préparer le rapport de résolution
    let globalSuccess = true;
    let skillTestResults = {};
    let runnerReports = [];
    let totalReward = contract.reward?.eddies || 0;
    let totalReputation = contract.reward?.reputation || 0;
    let totalCommission = 0;
    let usedRunners = [];
    // Pour chaque skill requise, tester le runner assigné
    for (const skill of requiredSkills) {
      const assign = assigned.find(a => a.skill === skill);
      if (!assign) continue;
      const runner = await Netrunner.findById(assign.runner);
      if (!runner) continue;
      usedRunners.push(runner);
      // Test de compétence individuel
      const skillObj = { [skill]: contract.requiredSkills[skill] };
      const skillTest = testRunnerSkills(runner, skillObj, playerEffects);
      skillTestResults[skill] = skillTest.skillResults[skill];
      let isSuccess = skillTest.isSuccess;
      globalSuccess = globalSuccess && isSuccess;
      // Appliquer conséquences et XP
      let runnerReport = { skill, runner: runner.name, isSuccess, result: skillTest.skillResults[skill] };
      if (isSuccess) {
        // XP et commission
        const baseXP = 50;
        const difficultyMultiplier = { 'facile': 1, 'moyen': 1.5, 'difficile': 2, 'expert': 3 };
        const difficulty = contract.loreDifficulty || 'moyen';
        const threatMultiplier = contract.threatLevel || 1;
        const xpGained = Math.floor(baseXP * difficultyMultiplier[difficulty] * threatMultiplier);
        runner.xp += xpGained;
        // Level up
        while (runner.xp >= runner.xpToNextLevel) {
          runner.xp -= runner.xpToNextLevel;
          runner.level += 1;
          runner.xpToNextLevel = Math.floor(runner.xpToNextLevel * 1.5);
          runner.fixerCommission = Math.min(50, (runner.fixerCommission || 25) + 1);
        }
        runner.status = 'Disponible';
        await runner.save();
        runnerReport.xpGained = xpGained;
        runnerReport.status = 'Disponible';
        runnerReport.level = runner.level;
        runnerReport.commission = runner.fixerCommission || 25;
        totalCommission += runner.fixerCommission || 25;
      } else {
        // Échec : mort ou grillé
        const reputationLoss = calculateReputationLoss(determineDifficulty(skillObj), skillTest.successRate < 0.3);
        if (skillTest.successRate < 0.3) {
          runner.status = 'Mort';
          runner.deathCause = generateDeathCause(contract, skillTest);
          runner.deathDate = new Date();
          runner.epitaph = generateEpitaph(runner.name, runner.deathCause, contract);
          runnerReport.status = 'Mort';
          runnerReport.deathCause = runner.deathCause;
        } else {
          runner.status = 'Grillé';
          runner.recoveryUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
          runnerReport.status = 'Grillé';
        }
        await runner.save();
        runnerReport.reputationLoss = reputationLoss;
        globalSuccess = false;
      }
      runnerReports.push(runnerReport);
    }
    // Répartition des récompenses : chaque runner prend sa commission, le reste va au joueur
    let totalFixerShare = 0;
    let totalRunnerShare = 0;
    for (const report of runnerReports) {
      if (report.status === 'Disponible') {
        const commission = report.commission || 25;
        const fixerShare = Math.round(totalReward * (commission / 100) / runnerReports.length);
        const runnerShare = Math.round(totalReward / runnerReports.length) - fixerShare;
        report.fixerShare = fixerShare;
        report.runnerShare = runnerShare;
        totalFixerShare += fixerShare;
        totalRunnerShare += runnerShare;
      }
    }
    // Mise à jour du profil joueur
    const playerProfile = await PlayerProfile.findOne({ clerkId: userId });
    if (playerProfile) {
      if (globalSuccess) {
        playerProfile.eddies += totalFixerShare;
        playerProfile.reputationPoints += totalReputation;
        playerProfile.missionsCompleted += 1;
        playerProfile.totalReputationGained += totalReputation;
      } else {
        // Échec : perte de réputation
        const reputationLoss = runnerReports.reduce((sum, r) => sum + (r.reputationLoss || 0), 0);
        playerProfile.reputationPoints = Math.max(0, playerProfile.reputationPoints - reputationLoss);
        playerProfile.missionsFailed += 1;
        playerProfile.totalReputationLost += reputationLoss;
      }
      await playerProfile.save();
    }
    // Statut du contrat
    contract.resolution_outcome = globalSuccess ? 'Succès' : 'Échec';
    contract.skill_test_results = skillTestResults;
    contract.success_rate = globalSuccess ? 1 : 0;
    contract.status = 'Terminé';
    contract.debriefing_log = `Mission ${globalSuccess ? 'réussie' : 'échouée'} :\n` + runnerReports.map(r => `${r.runner} (${r.skill}) : ${r.status}`).join('\n');
    await contract.save();
    // Retourner le rapport détaillé
    return NextResponse.json({
      success: globalSuccess,
      outcome: globalSuccess ? 'Succès' : 'Échec',
      reward: globalSuccess ? contract.reward : null,
      runnerReports,
      updatedContract: contract
    });

  } catch (error) {
    console.error("Erreur lors de la résolution du contrat:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}