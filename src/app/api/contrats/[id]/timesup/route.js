// src/app/api/contrats/[id]/timesup/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import Netrunner from '@/models/Netrunner';
import { testRunnerSkills } from '@/Lib/skillTest';

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

    // --- UTILISER LE SYSTÈME DE TEST ROBUSTE ---
    const skillTest = testRunnerSkills(runner, contract.requiredSkills);
    const isSuccess = skillTest.isSuccess;
    
    // Log détaillé des résultats de test
    console.log(`[TIMESUP] Test de compétences pour ${runner.name}:`);
    Object.entries(skillTest.skillResults).forEach(([skill, result]) => {
      console.log(`  ${skill}: ${result.actual}/${result.required} (${Math.round(result.chance * 100)}% chance) → ${result.success ? 'SUCCÈS' : 'ÉCHEC'}`);
    });
    console.log(`[TIMESUP] Taux de réussite: ${Math.round(skillTest.successRate * 100)}% → ${isSuccess ? 'SUCCÈS' : 'ÉCHEC'}`);

    // On met à jour le contrat avec le résultat
    contract.status = 'En attente de rapport';
    contract.resolution_outcome = isSuccess ? 'Succès' : 'Échec';
    contract.skill_test_results = skillTest.skillResults;
    contract.success_rate = skillTest.successRate;

    // On met à jour le statut du runner en fonction du résultat
    runner.status = skillTest.runnerStatus;
    runner.assignedContract = null;

    // Si le runner est grillé, définir le temps de récupération
    if (skillTest.runnerStatus === 'Grillé') {
      const recoveryTime = new Date();
      recoveryTime.setHours(recoveryTime.getHours() + 2); 
      runner.recoveryUntil = recoveryTime;
    }

    await contract.save();
    await runner.save();

    return NextResponse.json({ 
      message: "Statut de mission mis à jour.",
      skillTest: skillTest,
      isSuccess: isSuccess
    });
  } catch (error) {
    console.error("[API TIMESUP] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}