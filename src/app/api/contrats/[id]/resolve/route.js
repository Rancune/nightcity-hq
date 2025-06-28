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
    const contractData = {
      description: contract.description,
      requiredSkills: contract.requiredSkills,
      reward: contract.reward
    };
    const debriefingText = await generateResolutionLore(contract.title, contract.assignedRunner.name, isSuccess, contractData);
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

        // --- SYSTÈME DE RÉPUTATION BASÉ SUR LE LORE ---
        const player = await PlayerProfile.findOne({ clerkId: userId });
        if (player) {
          console.log(`[DEBUG] Profil joueur trouvé: ${player.handle} - ${player.eddies} €$ - ${player.reputationPoints} PR`);
          
          // Calculer la réputation de base selon la difficulté
          const difficulty = determineDifficulty(contract.requiredSkills);
          const baseReputation = calculateReputationGain(difficulty);
          
          // Calculer la réputation basée sur le lore généré
          const loreReputation = calculateReputationFromLore(debriefingText, true, baseReputation);
          
          console.log(`[LORE] Analyse du lore:`, {
            factions: loreReputation.factions,
            context: loreReputation.context,
            baseReputation,
            finalReputation: loreReputation.totalReputation,
            factionImpacts: loreReputation.factionImpacts
          });
          
          // Mettre à jour la réputation et les eddies en une seule opération
          player.addReputation(loreReputation.totalReputation, `Mission réussie: ${contract.title}`);
          player.missionsCompleted += 1;
          
          // Le joueur ne reçoit que 15% de la récompense totale (le reste va aux frais, taxes, etc.)
          const playerReward = Math.floor(contract.reward.eddies * 0.15);
          player.eddies += playerReward;
          
          const oldLevel = player.reputationLevel;
          const newLevelInfo = getReputationLevelInfo(player.reputationPoints);
          
          await player.save();
          
          console.log(`[REPUTATION] ${player.handle} gagne ${loreReputation.totalReputation} PR (base: ${baseReputation}, modifié par le lore) et ${playerReward} €$ (15% de ${contract.reward.eddies} €$). Nouveau total: ${player.eddies} €$ - ${player.reputationPoints} PR. Niveau: ${player.reputationTitle}`);
          
          // --- SYSTÈME DE RELATIONS DE FACTION BASÉ SUR LE LORE ---
          let factionRelations = await FactionRelations.findOne({ clerkId: userId });
          if (!factionRelations) {
            factionRelations = new FactionRelations({ clerkId: userId });
          }
          
          // Calculer l'activité récente (derniers 7 jours)
          const recentActivity = {};
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          factionRelations.history
            .filter(event => event.timestamp > sevenDaysAgo)
            .forEach(event => {
              if (!recentActivity[event.faction]) {
                recentActivity[event.faction] = { count: 0, lastActivity: event.timestamp };
              }
              recentActivity[event.faction].count++;
            });
          
          // Utiliser les impacts de faction calculés à partir du lore
          Object.entries(loreReputation.factionImpacts).forEach(([faction, impact]) => {
            factionRelations.modifyRelation(faction, impact, `Mission réussie: ${contract.title}`, contract._id);
          });
          
          // Calculer les impacts de menace basés sur le contexte du lore
          const threatImpacts = {};
          if (loreReputation.context.isHighProfile) {
            loreReputation.factions.forEach(faction => {
              threatImpacts[faction] = 1; // Augmentation de menace pour les grosses corpos
            });
          }
          if (loreReputation.context.isPublic) {
            loreReputation.factions.forEach(faction => {
              threatImpacts[faction] = (threatImpacts[faction] || 0) + 2; // Gros impact si public
            });
          }
          
          // Appliquer les impacts de menace
          Object.entries(threatImpacts).forEach(([faction, impact]) => {
            factionRelations.threatLevels[faction] = Math.max(0, Math.min(10, (factionRelations.threatLevels[faction] || 0) + impact));
          });
          
          await factionRelations.save();
          console.log(`[FACTION] Relations mises à jour pour ${player.handle} (basées sur le lore):`, loreReputation.factionImpacts);
          console.log(`[FACTION] Menaces mises à jour pour ${player.handle} (basées sur le lore):`, threatImpacts);
          
          const reputationInfo = {
            gained: loreReputation.totalReputation,
            newTotal: player.reputationPoints,
            newTitle: player.reputationTitle,
            levelUp: oldLevel < newLevelInfo.level,
            newLevel: newLevelInfo,
            factionImpacts: loreReputation.factionImpacts,
            loreAnalysis: {
              factions: loreReputation.factions,
              context: loreReputation.context
            }
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
      
        // --- SYSTÈME DE RÉPUTATION BASÉ SUR LE LORE (ÉCHEC) ---
        const player = await PlayerProfile.findOne({ clerkId: userId });
        if (player) {
          const difficulty = determineDifficulty(contract.requiredSkills);
          const baseReputation = calculateReputationLoss(difficulty, skillTest.successRate < 0.3);
          
          // Calculer la réputation basée sur le lore généré (échec)
          const loreReputation = calculateReputationFromLore(debriefingText, false, Math.abs(baseReputation));
          const reputationLost = loreReputation.totalReputation;
          
          console.log(`[LORE] Analyse du lore (échec):`, {
            factions: loreReputation.factions,
            context: loreReputation.context,
            baseReputation: Math.abs(baseReputation),
            finalReputation: reputationLost,
            factionImpacts: loreReputation.factionImpacts
          });
          
          // Mettre à jour la réputation en une seule opération
          player.loseReputation(reputationLost, `Mission échouée: ${contract.title}`);
          player.missionsFailed += 1;
          
          await player.save();
          
          console.log(`[REPUTATION] ${player.handle} perd ${reputationLost} PR (base: ${Math.abs(baseReputation)}, modifié par le lore). Nouveau total: ${player.reputationPoints} PR. Niveau: ${player.reputationTitle}`);
          
          // --- SYSTÈME DE RELATIONS DE FACTION BASÉ SUR LE LORE (ÉCHEC) ---
          let factionRelations = await FactionRelations.findOne({ clerkId: userId });
          if (!factionRelations) {
            factionRelations = new FactionRelations({ clerkId: userId });
          }
          
          // Calculer l'activité récente (derniers 7 jours)
          const recentActivity = {};
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          factionRelations.history
            .filter(event => event.timestamp > sevenDaysAgo)
            .forEach(event => {
              if (!recentActivity[event.faction]) {
                recentActivity[event.faction] = { count: 0, lastActivity: event.timestamp };
              }
              recentActivity[event.faction].count++;
            });
          
          // Utiliser les impacts de faction calculés à partir du lore (échec = impacts négatifs)
          Object.entries(loreReputation.factionImpacts).forEach(([faction, impact]) => {
            factionRelations.modifyRelation(faction, -Math.abs(impact), `Mission échouée: ${contract.title}`, contract._id);
          });
          
          // Calculer les impacts de menace basés sur le contexte du lore (échec)
          const threatImpacts = {};
          if (loreReputation.context.isHighProfile) {
            loreReputation.factions.forEach(faction => {
              threatImpacts[faction] = 2; // Plus de menace en cas d'échec contre les grosses corpos
            });
          }
          if (loreReputation.context.isPublic) {
            loreReputation.factions.forEach(faction => {
              threatImpacts[faction] = (threatImpacts[faction] || 0) + 3; // Très gros impact si public et échec
            });
          }
          
          // Appliquer les impacts de menace
          Object.entries(threatImpacts).forEach(([faction, impact]) => {
            factionRelations.threatLevels[faction] = Math.max(0, Math.min(10, (factionRelations.threatLevels[faction] || 0) + impact));
          });
          
          await factionRelations.save();
          console.log(`[FACTION] Relations mises à jour pour ${player.handle} (échec, basées sur le lore):`, loreReputation.factionImpacts);
          console.log(`[FACTION] Menaces mises à jour pour ${player.handle} (échec, basées sur le lore):`, threatImpacts);
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