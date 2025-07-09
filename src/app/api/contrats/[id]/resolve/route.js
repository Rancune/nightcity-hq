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

    // Mettre à jour le statut du contrat à 'Terminé' lors du claim du rapport
    contract.status = 'Terminé';
    await contract.save();
    console.log(`[RESOLVE] Contrat ${contract._id} mis à jour, nouveau statut: ${contract.status}`);

    // --- SYSTÈME D'ÉQUIPE D'INFILTRATION ---
  
    // Multi-runner : on mappe chaque skill requise à son runner
    // (On ne refait plus les tests ni le calcul des parts ici)

    // On retourne simplement les infos stockées
    return NextResponse.json({
      success: contract.resolution_outcome === 'Succès',
      outcome: contract.resolution_outcome,
      reward: contract.reward,
      runnerReports: contract.runnerReports,
      playerShare: contract.playerShare,
      totalRunnerNet: contract.totalRunnerNet,
      debriefing_log: contract.debriefing_log,
      updatedContract: contract
    });

  } catch (error) {
    console.error("Erreur lors de la résolution du contrat:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}