// src/app/api/contrats/[id]/resolve/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import PlayerProfile from '@/models/PlayerProfile';
import { generateResolutionLore } from '@/Lib/ai';
import Netrunner from '@/models/Netrunner';
import { 
  determineDifficulty, 
  calculateReputationGain, 
  calculateReputationLoss,
  getReputationLevelInfo 
} from '@/Lib/reputation';

// Fonction pour tester les compétences du runner
function testRunnerSkills(runner, requiredSkills) {
  const results = {};
  let totalSuccess = 0;
  let totalTests = 0;

  // Tester chaque compétence requise
  Object.keys(requiredSkills).forEach(skill => {
    if (requiredSkills[skill] > 0) {
      const runnerSkill = runner.skills[skill] || 0;
      const requiredSkill = requiredSkills[skill];
      
      // Calculer la probabilité de succès (compétence du runner vs exigence)
      const successChance = Math.min(0.95, Math.max(0.05, runnerSkill / requiredSkill));
      const isSuccess = Math.random() < successChance;
      
      results[skill] = {
        required: requiredSkill,
        actual: runnerSkill,
        success: isSuccess,
        chance: successChance
      };
      
      if (isSuccess) totalSuccess++;
      totalTests++;
    }
  });

  // Déterminer le résultat global
  const successRate = totalTests > 0 ? totalSuccess / totalTests : 0;
  const isOverallSuccess = successRate >= 0.6; // 60% de réussite minimum

  // Déterminer le statut du runner
  let runnerStatus = 'Disponible';
  if (successRate < 0.3) {
    // Échec critique : le runner meurt
    runnerStatus = 'Mort';
  } else if (successRate < 0.6) {
    // Échec partiel : le runner est grillé
    runnerStatus = 'Grillé';
  }

  return {
    isSuccess: isOverallSuccess,
    successRate,
    skillResults: results,
    runnerStatus
  };
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

    // --- TEST DES COMPÉTENCES DU RUNNER ---
    const skillTest = testRunnerSkills(contract.assignedRunner, contract.requiredSkills);
    const isSuccess = skillTest.isSuccess;
    
    // Log de débogage pour vérifier les récompenses
    console.log(`[DEBUG] Récompenses du contrat:`, {
      eddies: contract.reward?.eddies,
      reputation: contract.reward?.reputation,
      requiredSkills: contract.requiredSkills
    });
    
    // Mettre à jour le résultat du contrat
    contract.resolution_outcome = isSuccess ? 'Succès' : 'Échec';
    contract.skill_test_results = skillTest.skillResults;
    contract.success_rate = skillTest.successRate;

    // --- On génère le lore et on applique les conséquences ---
    const debriefingText = await generateResolutionLore(contract.title, contract.assignedRunner.name, isSuccess);
    contract.debriefing_log = debriefingText;

    if (isSuccess) {
        // --- CONSÉQUENCES DU SUCCÈS ---
        console.log("[RESOLVE] La mission est un SUCCÈS.");
        contract.status = 'Terminé';
        
        // Mettre à jour le statut du runner
        contract.assignedRunner.status = skillTest.runnerStatus;
        contract.assignedRunner.assignedContract = null;

        // --- LOGIQUE D'EXPÉRIENCE ---
        const xpGained = 50 + (contract.reward.reputation || 0);
        contract.assignedRunner.xp += xpGained;
        console.log(`[XP] Le runner ${contract.assignedRunner.name} gagne ${xpGained} XP.`);

        // Vérification de la montée en niveau
        if (contract.assignedRunner.xp >= contract.assignedRunner.xpToNextLevel) {
          contract.assignedRunner.level += 1;
          contract.assignedRunner.xp -= contract.assignedRunner.xpToNextLevel;
          contract.assignedRunner.xpToNextLevel = Math.floor(contract.assignedRunner.xpToNextLevel * 1.5);

          // Le runner gagne +1 dans une compétence aléatoire !
          const skills = ['hacking', 'stealth', 'combat'];
          const randomSkillUp = skills[Math.floor(Math.random() * skills.length)];
          contract.assignedRunner.skills[randomSkillUp] += 1;

          const levelUpInfo = { 
            newLevel: contract.assignedRunner.level, 
            skillUp: randomSkillUp, 
            runnerName: contract.assignedRunner.name 
          };
          console.log(`[LEVEL UP] ${levelUpInfo.runnerName} passe au niveau ${levelUpInfo.newLevel} ! +1 en ${levelUpInfo.skillUp}.`);
        }

        // --- SYSTÈME DE RÉPUTATION ---
        const player = await PlayerProfile.findOne({ clerkId: userId });
        if (player) {
          console.log(`[DEBUG] Profil joueur trouvé: ${player.handle} - ${player.eddies} €$ - ${player.reputationPoints} PR`);
          
          const difficulty = determineDifficulty(contract.requiredSkills);
          const reputationGained = calculateReputationGain(difficulty);
          
          // Mettre à jour la réputation et les eddies en une seule opération
          player.addReputation(reputationGained, `Mission réussie: ${contract.title}`);
          player.missionsCompleted += 1;
          player.eddies += contract.reward.eddies; // Ajouter les eddies directement
          
          const oldLevel = player.reputationLevel;
          const newLevelInfo = getReputationLevelInfo(player.reputationPoints);
          
          await player.save();
          
          console.log(`[REPUTATION] ${player.handle} gagne ${reputationGained} PR et ${contract.reward.eddies} €$. Nouveau total: ${player.eddies} €$ - ${player.reputationPoints} PR. Niveau: ${player.reputationTitle}`);
          
          const reputationInfo = {
            gained: reputationGained,
            newTotal: player.reputationPoints,
            newTitle: player.reputationTitle,
            levelUp: oldLevel < newLevelInfo.level,
            newLevel: newLevelInfo
          };
        } else {
          console.log(`[ERROR] Profil joueur non trouvé pour userId: ${userId}`);
        }

    } else {
        // --- CONSÉQUENCES DE L'ÉCHEC ---
        console.log("[RESOLVE] La mission est un ÉCHEC.");
        contract.status = 'Échoué';
        
        // Mettre à jour le statut du runner
        contract.assignedRunner.status = skillTest.runnerStatus;
        contract.assignedRunner.assignedContract = null;
        
        // Si le runner est mort, on le supprime
        if (skillTest.runnerStatus === 'Mort') {
          console.log(`[RUNNER] ${contract.assignedRunner.name} est mort dans la mission.`);
        } else if (skillTest.runnerStatus === 'Grillé') {
          console.log(`[RUNNER] ${contract.assignedRunner.name} est grillé et ne peut plus travailler.`);
        }
      
        // --- SYSTÈME DE RÉPUTATION (ÉCHEC) ---
        const player = await PlayerProfile.findOne({ clerkId: userId });
        if (player) {
          const difficulty = determineDifficulty(contract.requiredSkills);
          const reputationLost = calculateReputationLoss(difficulty, skillTest.successRate < 0.3);
          
          // Mettre à jour la réputation en une seule opération
          player.loseReputation(reputationLost, `Mission échouée: ${contract.title}`);
          player.missionsFailed += 1;
          
          await player.save();
          
          console.log(`[REPUTATION] ${player.handle} perd ${reputationLost} PR. Nouveau total: ${player.reputationPoints} PR. Niveau: ${player.reputationTitle}`);
        }
    }

    // Sauvegarder le contrat
    await contract.save();
    
    // Sauvegarder ou supprimer le runner selon son statut
    if (skillTest.runnerStatus === 'Mort') {
      await Netrunner.deleteOne({ _id: contract.assignedRunner._id });
    } else {
      await contract.assignedRunner.save();
    }

    // Préparer la réponse avec toutes les informations
    const response = {
      success: isSuccess,
      updatedContract: contract,
      skillTest: skillTest,
      reputationInfo: {
        gained: isSuccess ? calculateReputationGain(determineDifficulty(contract.requiredSkills)) : 0,
        lost: !isSuccess ? calculateReputationLoss(determineDifficulty(contract.requiredSkills), skillTest.successRate < 0.3) : 0
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("[API RESOLVE] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}