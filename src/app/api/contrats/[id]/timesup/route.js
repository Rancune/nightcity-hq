// src/app/api/contrats/[id]/timesup/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import Netrunner from '@/models/Netrunner';

export async function POST(request, props) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();

    const contract = await Contract.findById(params.id).populate('assignedRunner');

    if (!contract || contract.ownerId !== userId || contract.status !== 'Assigné') {
      return new NextResponse("Contrat non valide pour cette action.", { status: 404 });
    }

    const runner = contract.assignedRunner;
    if (!runner) return new NextResponse("Runner assigné introuvable.", { status: 404 });

    // --- LE JET DE DÉS A LIEU ICI ---
    const runnerSkills = runner.skills || {};
    const contractSkills = contract.requiredSkills || {};

    const calculateSuccessChance = (runnerSkill, contractSkill) => {
        const baseChance = 50;
        const skillDifference = (runnerSkill || 0) - (contractSkill || 1);
        const finalChance = baseChance + (skillDifference * 10);
        return Math.max(5, Math.min(95, finalChance));
    };

    const checkSkill = (skillName) => {
        const chance = calculateSuccessChance(runnerSkills[skillName], contractSkills[skillName]);
        const roll = Math.random() * 100;
        console.log(`Test de ${skillName}: Chance de ${chance}%, Jet = ${Math.floor(roll)}. Résultat: ${roll < chance ? 'SUCCÈS' : 'ÉCHEC'}`);
        return roll < chance;
    };

    let successScore = 0;
    if (checkSkill('hacking')) successScore++;
    if (checkSkill('stealth')) successScore++;
    if (checkSkill('combat')) successScore++;

    const isSuccess = successScore >= 2;
    // ------------------------------------

    // On met à jour le contrat avec le résultat
    contract.status = 'En attente de rapport';
    contract.resolution_outcome = isSuccess ? 'Succès' : 'Échec';

    // On met à jour le statut du runner en fonction du résultat
    if (isSuccess) {
      runner.status = 'Disponible';
    } else {
      runner.status = 'Grillé';
      const recoveryTime = new Date();
      recoveryTime.setHours(recoveryTime.getHours() + 2); 
      runner.recoveryUntil = recoveryTime;
    }
    runner.assignedContract = null;

    await contract.save();
    await runner.save();

    return NextResponse.json({ message: "Statut de mission mis à jour." });
  } catch (error) {
    console.error("[API TIMESUP] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}