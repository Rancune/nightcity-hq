// src/app/api/contrats/[id]/timesup/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';

export async function POST(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();

    const contract = await Contract.findById(await params.id).populate('assignedRunner');

    if (!contract || contract.ownerId !== userId || contract.status !== 'Assigné') {
      return new NextResponse("Contrat invalide", { status: 404 });
    }

    const runner = contract.assignedRunner;

    // --- LOGIQUE DU JET DE DÉS ---
    const runnerSkills = runner?.skills || {};
    const contractSkills = contract?.requiredSkills || {};
    let successScore = 0;
    if ((runnerSkills.hacking || 0) >= (contractSkills.hacking || 1)) successScore++;
    if ((runnerSkills.stealth || 0) >= (contractSkills.stealth || 1)) successScore++;
    if ((runnerSkills.combat || 0) >= (contractSkills.combat || 1)) successScore++;
    const isSuccess = successScore >= 2;
    // -----------------------------

    contract.status = 'En attente de rapport';
    contract.resolution_outcome = isSuccess ? 'Succès' : 'Échec';
    await contract.save();

    return NextResponse.json({ outcome: contract.resolution_outcome });
  } catch (error) {
    console.error("[API TIMESUP] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}