import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import PlayerInventory from '@/models/PlayerInventory';

export async function POST(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();

    // Récupérer le contrat
    const contract = await Contract.findById(params.id);
    if (!contract) {
      return new NextResponse("Contrat non trouvé", { status: 404 });
    }

    // Récupérer l'inventaire du joueur
    const playerInventory = await PlayerInventory.findOne({ clerkId: userId });
    if (!playerInventory) {
      return new NextResponse("Inventaire non trouvé", { status: 404 });
    }

    // Vérifier possession d'un Mouchard
    const mouchard = playerInventory.oneShotPrograms.find(item => item.program?.name === "Logiciel 'Mouchard'" && item.quantity > 0);
    if (!mouchard) {
      return new NextResponse("Vous ne possédez pas de Mouchard", { status: 400 });
    }

    // Déterminer les compétences testées et leur valeur
    const skillValues = contract.requiredSkills || {};
    const skills = Object.entries(skillValues)
      .filter(([skill, value]) => value > 0)
      .map(([skill, value]) => ({ skill, value }));
    if (skills.length === 0) {
      return new NextResponse("Aucune compétence testée sur ce contrat", { status: 400 });
    }

    // Récupérer les compétences déjà révélées pour ce joueur
    let revealedEntry = contract.revealedSkillsByPlayer.find(e => e.clerkId === userId);
    if (!revealedEntry) {
      revealedEntry = { clerkId: userId, skills: [] };
      contract.revealedSkillsByPlayer.push(revealedEntry);
    }

    // Filtrer les compétences non encore révélées
    const unrevealed = skills.filter(s => !revealedEntry.skills.includes(s.skill));
    if (unrevealed.length === 0) {
      return new NextResponse("Toutes les compétences ont déjà été révélées", { status: 400 });
    }

    // Trouver la compétence avec la valeur la plus basse
    const minSkill = unrevealed.reduce((min, curr) => curr.value < min.value ? curr : min, unrevealed[0]);

    // Ajouter la compétence révélée
    revealedEntry.skills.push(minSkill.skill);

    // Consommer un Mouchard
    mouchard.quantity -= 1;
    if (mouchard.quantity === 0) {
      playerInventory.oneShotPrograms = playerInventory.oneShotPrograms.filter(item => item !== mouchard);
    }

    await Promise.all([
      contract.save(),
      playerInventory.save()
    ]);

    return NextResponse.json({
      revealedSkill: minSkill.skill,
      revealedSkills: revealedEntry.skills
    });
  } catch (error) {
    console.error("[REVEAL SKILL] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 