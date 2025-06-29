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

    console.log(`[TIMESUP] Début de traitement pour le contrat ${params.id}`);

    await connectDb();

    const contract = await Contract.findById(params.id).populate('assignedRunner');

    console.log(`[TIMESUP] Contrat trouvé:`, {
      id: contract?._id,
      status: contract?.status,
      ownerId: contract?.ownerId,
      userId: userId,
      hasRunner: !!contract?.assignedRunner
    });

    if (!contract) {
      console.log(`[TIMESUP] Contrat non trouvé`);
      return new NextResponse("Contrat non trouvé.", { status: 404 });
    }

    if (contract.ownerId !== userId) {
      console.log(`[TIMESUP] Propriétaire incorrect: ${contract.ownerId} vs ${userId}`);
      return new NextResponse("Contrat non valide pour cette action.", { status: 404 });
    }

    if (contract.status !== 'Assigné' && contract.status !== 'Actif' && contract.status !== 'En cours') {
      console.log(`[TIMESUP] Statut incorrect: ${contract.status} (attendu: Assigné, Actif ou En cours)`);
      return new NextResponse("Contrat non valide pour cette action.", { status: 404 });
    }

    const runner = contract.assignedRunner;
    if (!runner) {
      console.log(`[TIMESUP] Runner assigné introuvable`);
      return new NextResponse("Runner assigné introuvable.", { status: 404 });
    }

    console.log(`[TIMESUP] Validation passée, début du test de compétences`);

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

    console.log(`[TIMESUP] Mise à jour terminée avec succès`);

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