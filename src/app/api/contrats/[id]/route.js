// src/app/api/contrats/[id]/route.js
import { NextResponse } from 'next/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import Netrunner from '@/models/Netrunner';
import { auth } from '@clerk/nextjs/server';


export async function GET(request) {
  try {
    await connectDb();
    
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    // Récupérer l'utilisateur connecté pour filtrer les compétences révélées
    const { userId } = await auth();
    
    const contract = await Contract.findById(id).lean();

    if (!contract) {
      return NextResponse.json({ message: "Contrat non trouvé avec cet ID." }, { status: 404 });
    }
    
    console.log(`[CONTRACT API DEBUG] Contrat ${id} récupéré pour l'utilisateur ${userId}`);
    console.log(`[CONTRACT API DEBUG] activeProgramEffects:`, contract.activeProgramEffects);
    
    // Si l'utilisateur est connecté, filtrer les compétences révélées pour lui
    if (userId && contract.revealedSkillsByPlayer) {
      const userRevealed = contract.revealedSkillsByPlayer.find(e => e.clerkId === userId);
      if (userRevealed) {
        contract.userRevealedSkills = userRevealed.skills;
        console.log(`[CONTRACT API DEBUG] Compétences révélées pour l'utilisateur:`, userRevealed.skills);
      } else {
        contract.userRevealedSkills = [];
        console.log(`[CONTRACT API DEBUG] Aucune compétence révélée pour l'utilisateur`);
      }
      
      // Log des effets actifs pour cet utilisateur
      if (contract.activeProgramEffects) {
        const userEffects = contract.activeProgramEffects.find(e => e.clerkId === userId);
        console.log(`[CONTRACT API DEBUG] Effets actifs pour l'utilisateur:`, userEffects?.effects);
        console.log(`[CONTRACT API DEBUG] skillBonuses pour l'utilisateur:`, userEffects?.effects?.skillBonuses);
      }
    }
    
    return NextResponse.json(contract);

  } catch (error) {
    console.error(`[API GET /id] Erreur serveur:`, error);
    return NextResponse.json({ message: "Erreur interne du serveur lors de la recherche du contrat" }, { status: 500 });
  }
}

// === NOUVELLE FONCTION PUT POUR L'ASSIGNATION ===
export async function PUT(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const { id: contractId } = await params;
    const { assignments } = await request.json(); // [{ skill, runnerId }]

    // Validation du format
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return new NextResponse("Vous devez assigner au moins un runner.", { status: 400 });
    }

    await connectDb();

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return new NextResponse("Contrat non trouvé.", { status: 404 });
    }
    // Récupérer les skills requises
    const requiredSkills = Object.entries(contract.requiredSkills || {}).filter(([_, v]) => v > 0).map(([k]) => k);
    if (assignments.length !== requiredSkills.length) {
      return new NextResponse(`Ce contrat requiert exactement ${requiredSkills.length} compétences/runners.`, { status: 400 });
    }
    // Vérifier unicité des skills et runners
    const assignedSkills = assignments.map(a => a.skill);
    const assignedRunnerIds = assignments.map(a => a.runnerId);
    if (new Set(assignedSkills).size !== assignedSkills.length) {
      return new NextResponse("Chaque compétence doit être assignée à un runner unique.", { status: 400 });
    }
    if (new Set(assignedRunnerIds).size !== assignedRunnerIds.length) {
      return new NextResponse("Vous ne pouvez pas assigner deux fois le même runner.", { status: 400 });
    }
    // Vérifier que les skills assignées correspondent exactement aux skills requises
    if (!requiredSkills.every(skill => assignedSkills.includes(skill))) {
      return new NextResponse("Toutes les compétences requises doivent être assignées.", { status: 400 });
    }
    // Vérifier que tous les runners sont valides et disponibles
    const runners = await Netrunner.find({ _id: { $in: assignedRunnerIds }, ownerId: userId, status: 'Disponible' });
    if (runners.length !== assignedRunnerIds.length) {
      return new NextResponse("Un ou plusieurs runners sont invalides ou non disponibles.", { status: 404 });
    }
    // Assigner les runners par skill
    contract.assignedRunners = assignments.map(a => ({ skill: a.skill, runner: a.runnerId }));
    contract.status = 'Assigné';
    contract.ownerId = userId;
    contract.initial_completion_duration_trp = 15; // 15 secondes pour tests
    contract.completion_timer_started_at = new Date();
    await contract.save();
    // Mettre à jour le statut de chaque runner
    for (const runner of runners) {
      runner.status = 'En mission';
      runner.assignedContract = contractId;
      await runner.save();
    }
    return NextResponse.json({ contract, runners });

  } catch (error) {
    console.error("[API PUT /contrats/id] Erreur d'assignation:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}