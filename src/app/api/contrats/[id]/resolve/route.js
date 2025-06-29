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
    const contract = await Contract.findById(contractId).populate('assignedRunner');

    if (!contract || contract.ownerId !== userId || contract.status !== 'En attente de rapport') {
      return new NextResponse("Contrat non valide pour cette action.", { status: 404 });
    }

    // --- SYSTÈME D'ÉQUIPE D'INFILTRATION ---
    // Pour l'instant, on garde la compatibilité avec un seul runner
    // TODO: Implémenter le système multi-runners dans une future version
    
    // Récupérer les effets actifs du joueur
    const playerEffects = contract.activeProgramEffects?.find(e => e.clerkId === userId)?.effects || {};
    
    // Test des compétences du runner assigné
    const skillTest = testRunnerSkills(contract.assignedRunner, contract.requiredSkills, playerEffects);
    const isSuccess = skillTest.isSuccess;
    
    // Log de débogage pour vérifier les récompenses
    console.log(`[DEBUG] Récompenses du contrat:`, {
      eddies: contract.reward?.eddies,
      reputation: contract.reward?.reputation,
      requiredSkills: contract.requiredSkills,
      threatLevel: contract.threatLevel
    });
    
    // Log détaillé des résultats de test avec effets
    console.log(`[RESOLVE] Test de compétences pour ${contract.assignedRunner.name}:`);
    Object.entries(skillTest.skillResults).forEach(([skill, result]) => {
      const effectsInfo = [];
      if (result.effects.bonusApplied > 0) effectsInfo.push(`+${result.effects.bonusApplied} bonus`);
      if (result.effects.difficultyReduced > 0) effectsInfo.push(`-${result.effects.difficultyReduced} difficulté`);
      if (result.effects.autoSuccess) effectsInfo.push('succès forcé');
      
      console.log(`  ${skill}: ${result.actual}/${result.required} (${Math.round(result.chance * 100)}% chance) → ${result.success ? 'SUCCÈS' : 'ÉCHEC'} ${effectsInfo.length > 0 ? `[${effectsInfo.join(', ')}]` : ''}`);
    });
    console.log(`[RESOLVE] Taux de réussite: ${Math.round(skillTest.successRate * 100)}% → ${isSuccess ? 'SUCCÈS' : 'ÉCHEC'}`);
    console.log(`[RESOLVE] Niveau de menace: ${contract.threatLevel}`);
    
    // Mettre à jour le résultat du contrat
    contract.resolution_outcome = isSuccess ? 'Succès' : 'Échec';
    contract.skill_test_results = skillTest.skillResults;
    contract.success_rate = skillTest.successRate;

    // --- On génère le lore et on applique les conséquences ---
    const contractData = {
      description: contract.description,
      requiredSkills: contract.requiredSkills,
      reward: contract.reward,
      threatLevel: contract.threatLevel
    };
    const debriefingText = await generateResolutionLore(contract.title, contract.assignedRunner.name, isSuccess, contractData);
    contract.debriefing_log = debriefingText;

    // --- MISE À JOUR DU PROFIL JOUEUR ---
    const playerProfile = await PlayerProfile.findOne({ clerkId: userId });
    if (playerProfile) {
      if (isSuccess) {
        // Succès - PARTAGE DES GAINS SELON LA COMMISSION DU RUNNER (GDD)
        const commission = contract.assignedRunner.fixerCommission || 25;
        const eddiesPourFixer = Math.round(contract.reward.eddies * (commission / 100));
        const eddiesPourRunner = contract.reward.eddies - eddiesPourFixer;
        const oldEddies = playerProfile.eddies;
        const oldReputation = playerProfile.reputationPoints;
        
        playerProfile.eddies += eddiesPourFixer;
        playerProfile.reputationPoints += contract.reward.reputation;
        playerProfile.missionsCompleted += 1;
        playerProfile.totalReputationGained += contract.reward.reputation;
        
        // Mettre à jour le statut du runner et lui donner de l'XP
        contract.assignedRunner.status = 'Disponible';
        
        // Calculer l'XP gagnée basée sur la difficulté et le niveau de menace
        const baseXP = 50; // XP de base
        const difficultyMultiplier = {
          'facile': 1,
          'moyen': 1.5,
          'difficile': 2,
          'expert': 3
        };
        const difficulty = contract.loreDifficulty || 'moyen';
        const threatMultiplier = contract.threatLevel || 1;
        const xpGained = Math.floor(baseXP * difficultyMultiplier[difficulty] * threatMultiplier);
        
        // Ajouter l'XP au runner
        contract.assignedRunner.xp += xpGained;
        
        // Level up : la commission du Fixer augmente de +1% (max 50%)
        while (contract.assignedRunner.xp >= contract.assignedRunner.xpToNextLevel) {
          contract.assignedRunner.xp -= contract.assignedRunner.xpToNextLevel;
          contract.assignedRunner.level += 1;
          contract.assignedRunner.xpToNextLevel = Math.floor(contract.assignedRunner.xpToNextLevel * 1.5);
          contract.assignedRunner.fixerCommission = Math.min(50, (contract.assignedRunner.fixerCommission || 25) + 1);
        }
        await contract.assignedRunner.save();
        
        console.log(`[RESOLVE] Mission réussie! +${eddiesPourFixer} €$ (Fixer) / +${eddiesPourRunner} €$ (Runner) et +${contract.reward.reputation} PR`);
        console.log(`[RESOLVE] Runner ${contract.assignedRunner.name} gagne ${xpGained} XP (Niveau ${contract.assignedRunner.level}, Commission Fixer: ${contract.assignedRunner.fixerCommission}%)`);
        console.log(`[RESOLVE] Profil joueur: ${oldEddies} → ${playerProfile.eddies} €$, ${oldReputation} → ${playerProfile.reputationPoints} PR`);
      } else {
        // Échec
        const reputationLoss = calculateReputationLoss(determineDifficulty(contract.requiredSkills), skillTest.successRate < 0.3);
        const oldReputation = playerProfile.reputationPoints;
        
        playerProfile.reputationPoints = Math.max(0, playerProfile.reputationPoints - reputationLoss);
        playerProfile.missionsFailed += 1;
        playerProfile.totalReputationLost += reputationLoss;
        
        // Conséquences sur le runner selon le taux de réussite
        if (skillTest.successRate < 0.3) {
          // Échec critique - runner mort
          contract.assignedRunner.status = 'Mort';
          contract.assignedRunner.deathCause = generateDeathCause(contract, skillTest);
          contract.assignedRunner.deathDate = new Date();
          contract.assignedRunner.epitaph = generateEpitaph(contract.assignedRunner.name, contract.assignedRunner.deathCause, contract);
          
          console.log(`[RESOLVE] Échec critique! ${contract.assignedRunner.name} est mort. Cause: ${contract.assignedRunner.deathCause}`);
        } else {
          // Échec normal - runner grillé
          contract.assignedRunner.status = 'Grillé';
          contract.assignedRunner.recoveryUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
          console.log(`[RESOLVE] Échec! ${contract.assignedRunner.name} est grillé pour 24h.`);
        }
        await contract.assignedRunner.save();
        
        console.log(`[RESOLVE] Mission échouée! -${reputationLoss} PR (${oldReputation} → ${playerProfile.reputationPoints})`);
      }
      
      await playerProfile.save();
    }

    // --- IMPACTS SUR LES RELATIONS DE FACTION ---
    if (contract.targetFaction && contract.employerFaction) {
      const factionRelations = await FactionRelations.findOne({ clerkId: userId });
      if (factionRelations) {
        const impacts = calculateFactionImpacts(contract.targetFaction, contract.employerFaction, isSuccess);
        
        // Appliquer les impacts
        if (impacts.targetFaction) {
          factionRelations.factions[contract.targetFaction] = Math.max(-100, Math.min(100, 
            (factionRelations.factions[contract.targetFaction] || 0) + impacts.targetFaction
          ));
        }
        if (impacts.employerFaction) {
          factionRelations.factions[contract.employerFaction] = Math.max(-100, Math.min(100, 
            (factionRelations.factions[contract.employerFaction] || 0) + impacts.employerFaction
          ));
        }
        
        await factionRelations.save();
        console.log(`[RESOLVE] Impacts faction: ${contract.targetFaction} ${impacts.targetFaction > 0 ? '+' : ''}${impacts.targetFaction}, ${contract.employerFaction} ${impacts.employerFaction > 0 ? '+' : ''}${impacts.employerFaction}`);
      }
    }

    // Marquer le contrat comme terminé
    contract.status = 'Terminé';
    await contract.save();

    // Préparer les informations de réputation pour la modal
    const reputationInfo = {
      gained: isSuccess ? contract.reward.reputation : 0,
      lost: !isSuccess ? calculateReputationLoss(determineDifficulty(contract.requiredSkills), skillTest.successRate < 0.3) : 0
    };

    // Préparer les informations sur les programmes utilisés
    const usedPrograms = [];
    if (contract.activeProgramEffects) {
      const playerEffects = contract.activeProgramEffects.find(e => e.clerkId === userId);
      if (playerEffects && playerEffects.effects) {
        // Récupérer les détails des programmes utilisés
        const { default: Program } = await import('@/models/Program');
        for (const [programId, effects] of Object.entries(playerEffects.effects)) {
          try {
            const program = await Program.findById(programId).lean();
            if (program) {
              usedPrograms.push({
                name: program.name,
                cost: program.price || 1000, // Coût par défaut si pas défini
                effects: effects
              });
            }
          } catch (error) {
            console.log(`[RESOLVE] Erreur lors de la récupération du programme ${programId}:`, error);
          }
        }
      }
    }

    // Calculer les gains nets
    const commission = contract.assignedRunner?.fixerCommission || 20;
    const totalReward = contract.reward?.eddies || 0;
    const fixerShare = Math.round(totalReward * (commission / 100));
    const totalProgramCost = usedPrograms.reduce((sum, prog) => sum + prog.cost, 0);
    const netGains = isSuccess ? fixerShare - totalProgramCost : -totalProgramCost;

    return NextResponse.json({
      success: true,
      outcome: isSuccess ? 'Succès' : 'Échec',
      reward: isSuccess ? contract.reward : null,
      debriefing: debriefingText,
      skillTest: skillTest,
      updatedContract: contract,
      reputationInfo: reputationInfo,
      usedPrograms: usedPrograms,
      financialSummary: {
        totalReward,
        fixerShare,
        runnerShare: totalReward - fixerShare,
        commission,
        totalProgramCost,
        netGains
      }
    });

  } catch (error) {
    console.error("Erreur lors de la résolution du contrat:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}