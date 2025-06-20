// src/app/api/contrats/[id]/resolve/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import PlayerProfile from '@/models/PlayerProfile';
import { generateResolutionLore } from '@/Lib/ai';

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

    const isSuccess = contract.resolution_outcome === 'Succès';

    // --- On génère le lore et on applique les conséquences financières/réputation ---
    const debriefingText = await generateResolutionLore(contract.title, contract.assignedRunner.name, isSuccess);
    contract.debriefing_log = debriefingText;

    if (isSuccess) {
      contract.status = 'Terminé';
      await PlayerProfile.updateOne({ clerkId: userId }, { 
        $inc: { eddies: contract.reward.eddies, reputation: contract.reward.reputation }
      });
    } else {
      contract.status = 'Échoué';
      await PlayerProfile.updateOne({ clerkId: userId }, { $inc: { reputation: -50 } });
    }

    await contract.save();

    // On renvoie le contrat complet pour l'afficher dans la modale
    return NextResponse.json({ success: isSuccess, updatedContract: contract });

  } catch (error) {
    console.error("[API RESOLVE] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}