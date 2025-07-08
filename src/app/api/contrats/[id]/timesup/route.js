// src/app/api/contrats/[id]/timesup/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import Netrunner from '@/models/Netrunner';
import { testRunnerSkills } from '@/Lib/skillTest';
import { generateResolutionLore } from '@/Lib/ai';

export async function POST(request, props) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    console.log(`[TIMESUP] Début de traitement pour le contrat ${params.id}`);

    await connectDb();

    const contract = await Contract.findById(params.id).populate('assignedRunners');

    console.log(`[TIMESUP] Contrat trouvé:`, {
      id: contract?._id,
      status: contract?.status,
      ownerId: contract?.ownerId,
      userId: userId,
      hasRunner: !!contract?.assignedRunners.length
    });

    if (!contract) {
      console.log(`[TIMESUP] Contrat non trouvé`);
      return new NextResponse("Contrat non trouvé.", { status: 404 });
    }

    if (contract.ownerId !== userId) {
      console.log(`[TIMESUP] Propriétaire incorrect: ${contract.ownerId} vs ${userId}`);
      return new NextResponse("Contrat non valide pour cette action.", { status: 404 });
    }

    if (contract.status !== 'Assigné' && contract.status !== 'Actif') {
      console.log(`[TIMESUP] Statut incorrect: ${contract.status} (attendu: Assigné ou Actif)`);
      return new NextResponse("Contrat non valide pour cette action.", { status: 404 });
    }

    // Multi-runner : on mappe chaque skill requise à son runner
    const assigned = Array.isArray(contract.assignedRunners) ? contract.assignedRunners : [];
    const requiredSkills = Object.entries(contract.requiredSkills || {}).filter(([_, v]) => v > 0).map(([k]) => k);
    let globalSuccess = true;
    let skillTestResults = {};
    let runnerReports = [];
    let totalReward = contract.reward?.eddies || 0;
    let runnerShares = [];
    // Pour chaque skill requise, tester le runner assigné
    for (const skill of requiredSkills) {
      const assign = assigned.find(a => a.skill === skill);
      if (!assign) continue;
      const runner = await Netrunner.findById(assign.runner);
      if (!runner) continue;
      // Test de compétence individuel
      const skillObj = { [skill]: contract.requiredSkills[skill] };
      const skillTest = testRunnerSkills(runner, skillObj);
      skillTestResults[skill] = skillTest.skillResults[skill];
      let isSuccess = skillTest.isSuccess;
      globalSuccess = globalSuccess && isSuccess;
      // XP calculée selon difficulté
      let xpGained = 0;
      if (isSuccess) {
        const baseXP = 50;
        const difficultyMultiplier = { 'facile': 1, 'moyen': 1.5, 'difficile': 2, 'expert': 3 };
        const difficulty = contract.loreDifficulty || 'moyen';
        const threatMultiplier = contract.threatLevel || 1;
        xpGained = Math.floor(baseXP * (difficultyMultiplier[difficulty] || 1.5) * threatMultiplier);
        runner.xp = (runner.xp || 0) + xpGained;
        runner.status = 'Disponible';
        await runner.save();
      } else {
        runner.status = 'Grillé';
        runner.recoveryUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await runner.save();
      }
      runnerReports.push({
        skill,
        runner: runner.name,
        isSuccess,
        result: skillTest.skillResults[skill],
        status: runner.status,
        xpGained,
        fixerCommission: runner.fixerCommission || 25
      });
    }
    // Répartition de la récompense si succès
    let playerShare = 0;
    let totalRunnerNet = 0;
    if (globalSuccess && runnerReports.length > 0) {
      const sharePerRunner = Math.floor(totalReward / runnerReports.length);
      for (const report of runnerReports) {
        if (report.status === 'Disponible') {
          const commission = report.fixerCommission;
          const commissionAmount = Math.round(sharePerRunner * (commission / 100));
          const runnerNet = sharePerRunner - commissionAmount;
          report.eddies = runnerNet;
          report.commissionAmount = commissionAmount;
          playerShare += commissionAmount;
          totalRunnerNet += runnerNet;
        } else {
          report.eddies = 0;
          report.commissionAmount = 0;
        }
      }
    }
    contract.status = 'En attente de rapport';
    contract.resolution_outcome = globalSuccess ? 'Succès' : 'Échec';
    contract.skill_test_results = skillTestResults;
    contract.success_rate = globalSuccess ? 1 : 0;
    contract.runnerReports = runnerReports;
    contract.playerShare = playerShare;
    contract.totalRunnerNet = totalRunnerNet;
    // Génération du lore de résolution (debriefing_log)
    let debriefing_log = '';
    try {
      debriefing_log = await generateResolutionLore(
        contract.title,
        runnerReports.map(r => r.runner).join(', '),
        globalSuccess,
        {
          description: contract.description,
          requiredSkills: contract.requiredSkills,
          reward: contract.reward
        }
      );
    } catch (e) {
      debriefing_log = globalSuccess
        ? `Mission réussie : ${runnerReports.map(r => r.runner + ' (' + r.skill + ') : Disponible').join(' ')}.`
        : `Mission échouée : ${runnerReports.map(r => r.runner + ' (' + r.skill + ') : ' + r.status).join(' ')}.`;
    }
    contract.debriefing_log = debriefing_log;
    await contract.save();
    return NextResponse.json({
      message: 'Statut de mission mis à jour.',
      runnerReports,
      playerShare,
      isSuccess: globalSuccess,
      debriefing_log
    });
  } catch (error) {
    console.error("[API TIMESUP] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}