// src/app/api/contrats/[id]/resolve/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import Netrunner from '@/models/Netrunner';
import PlayerProfile from '@/models/PlayerProfile';

export async function POST(request, { params }) { // On utilise la signature standard de Next.js
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();

    const contractId = await params.id;
    const contract = await Contract.findById(contractId).populate('assignedRunner');

    // CORRECTION 1 : On vérifie que le contrat est bien assigné au bon joueur
    if (!contract || contract.assignedPlayer !== userId) {
      return new NextResponse("Contrat invalide ou n'appartient pas au joueur.", { status: 404 });
    }

    // CORRECTION 2 : On déclare la variable 'runner' en l'extrayant du contrat peuplé
    const runner = contract.assignedRunner;

    // On ajoute une sécurité si le runner n'a pas été trouvé
    if (!runner) {
      return new NextResponse("Runner assigné introuvable.", { status: 404 });
    }

    const runnerSkills = runner.skills || {};
    const contractSkills = contract.requiredSkills || {};

    console.log("Compétences du Runner:", runnerSkills);
    console.log("Compétences Requises:", contractSkills);

    let successScore = 0;
    if ((runnerSkills.hacking || 0) >= (contractSkills.hacking || 1)) successScore++;
    if ((runnerSkills.stealth || 0) >= (contractSkills.stealth || 1)) successScore++;
    if ((runnerSkills.combat || 0) >= (contractSkills.combat || 1)) successScore++;

    const isSuccess = successScore >= 2;

    console.log(`[RESOLVE] Runner: ${runner.name}, Succès: <span class="math-inline">\{isSuccess\} \(</span>{successScore}/3)`);

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