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
        // Succès
        playerProfile.eddies += contract.reward.eddies;
        playerProfile.reputationPoints += contract.reward.reputation;
        playerProfile.missionsCompleted += 1;
        playerProfile.totalReputationGained += contract.reward.reputation;
        
        // Mettre à jour le statut du runner
        contract.assignedRunner.status = 'Disponible';
        await contract.assignedRunner.save();
        
        console.log(`[RESOLVE] Mission réussie! +${contract.reward.eddies} €$ et +${contract.reward.reputation} PR`);
      } else {
        // Échec
        const reputationLoss = calculateReputationLoss(determineDifficulty(contract.requiredSkills), skillTest.successRate < 0.3);
        playerProfile.reputationPoints = Math.max(0, playerProfile.reputationPoints - reputationLoss);
        playerProfile.missionsFailed += 1;
        playerProfile.totalReputationLost += reputationLoss;
        
        // Conséquences sur le runner selon le taux de réussite
        if (skillTest.successRate < 0.3) {
          // Échec critique - runner mort
          contract.assignedRunner.status = 'Mort';
          console.log(`[RESOLVE] Échec critique! ${contract.assignedRunner.name} est mort.`);
        } else {
          // Échec normal - runner grillé
          contract.assignedRunner.status = 'Grillé';
          contract.assignedRunner.recoveryUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
          console.log(`[RESOLVE] Échec! ${contract.assignedRunner.name} est grillé pour 24h.`);
        }
        await contract.assignedRunner.save();
        
        console.log(`[RESOLVE] Mission échouée! -${reputationLoss} PR`);
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

    return NextResponse.json({
      success: true,
      outcome: isSuccess ? 'Succès' : 'Échec',
      reward: isSuccess ? contract.reward : null,
      debriefing: debriefingText,
      skillTest: skillTest
    });

  } catch (error) {
    console.error("Erreur lors de la résolution du contrat:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}