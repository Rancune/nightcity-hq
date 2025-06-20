// src/app/api/contrats/[id]/resolve/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import Netrunner from '@/models/Netrunner';
import PlayerProfile from '@/models/PlayerProfile';

export async function POST(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();

    const contractId = params.id;
    // On récupère le contrat ET les données du runner assigné en une seule requête !
    const contract = await Contract.findById(contractId).populate('assignedRunner');

    if (!contract || contract.ownerId !== userId) {
      return new NextResponse("Contrat invalide ou n'appartient pas au joueur.", { status: 404 });
    }

    const runner = contract.assignedRunner;

    // --- LA LOGIQUE DU JET DE DÉS ---
    let successScore = 0;
    if (runner.skills.hacking >= contract.requiredSkills.hacking) successScore++;
    if (runner.skills.stealth >= contract.requiredSkills.stealth) successScore++;
    if (runner.skills.combat >= contract.requiredSkills.combat) successScore++;

    // On définit le succès si au moins 2 des 3 compétences sont suffisantes
    const isSuccess = successScore >= 2;

    console.log(`[RESOLVE] Runner: ${runner.name}, Succès: ${isSuccess} (${successScore}/3)`);

    if (isSuccess) {
      // --- CONSÉQUENCES DU SUCCÈS ---
      contract.status = 'Terminé';
      runner.status = 'Disponible';
      runner.assignedContract = null;
      await PlayerProfile.updateOne({ clerkId: userId }, { 
        $inc: { eddies: contract.reward.eddies, reputation: contract.reward.reputation }
      });
    } else {
      // --- CONSÉQUENCES DE L'ÉCHEC ---
      contract.status = 'Échoué';
      runner.status = 'Grillé'; // Le runner est indisponible
      const recoveryTime = new Date();
      recoveryTime.setHours(recoveryTime.getHours() + 2); // Indisponible pour 2h réelles
      runner.recoveryUntil = recoveryTime;
      runner.assignedContract = null;
      await PlayerProfile.updateOne({ clerkId: userId }, { $inc: { reputation: -50 } }); // Pénalité de réputation
    }

    await contract.save();
    await runner.save();

    return NextResponse.json({ success: isSuccess, outcome: contract.status });

  } catch (error) {
    console.error("[API RESOLVE] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}