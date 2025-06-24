import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import Program from '@/models/Program';
import PlayerInventory from '@/models/PlayerInventory';

export async function POST(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const { programId, category } = await request.json();
    if (!programId) {
      return new NextResponse("ID du programme manquant", { status: 400 });
    }

    await connectDb();

    // Récupérer le contrat
    const contract = await Contract.findById(params.id);
    if (!contract) {
      return new NextResponse("Contrat non trouvé", { status: 404 });
    }

    // Vérifier que le contrat est assigné
    if (contract.status !== 'Assigné') {
      return new NextResponse("Le contrat doit être assigné pour utiliser des programmes", { status: 400 });
    }

    // Récupérer le programme
    const program = await Program.findById(programId);
    if (!program) {
      return new NextResponse("Programme non trouvé", { status: 404 });
    }

    // Récupérer l'inventaire du joueur
    const playerInventory = await PlayerInventory.findOne({ clerkId: userId });
    if (!playerInventory) {
      return new NextResponse("Inventaire non trouvé", { status: 404 });
    }

    // Vérifier que le joueur possède le programme
    let hasProgram = false;
    if (category === 'one_shot') {
      hasProgram = playerInventory.oneShotPrograms.some(item => 
        item.programId.equals(programId) && item.quantity > 0
      );
    } else if (category === 'information') {
      hasProgram = playerInventory.purchasedInformation.some(item => 
        item.programId.equals(programId)
      );
    }

    if (!hasProgram) {
      return new NextResponse("Vous ne possédez pas ce programme", { status: 400 });
    }

    // Appliquer les effets du programme
    const effects = program.effects;
    let revealedSkill = null;
    let skill = null;

    if (effects.reveal_skill && category === 'information') {
      // Révéler une compétence aléatoire du contrat
      const contractSkills = contract.requiredSkills || [];
      if (contractSkills.length > 0) {
        const randomSkill = contractSkills[Math.floor(Math.random() * contractSkills.length)];
        revealedSkill = {
          name: randomSkill.name,
          value: randomSkill.value,
          difficulty: randomSkill.difficulty
        };
      }
    }

    if (effects.add_bonus_roll && category === 'one_shot') {
      // Ajouter un bonus à une compétence
      const contractSkills = contract.requiredSkills || [];
      if (contractSkills.length > 0) {
        skill = contractSkills[Math.floor(Math.random() * contractSkills.length)].name;
      }
    }

    // Consommer le programme
    if (category === 'one_shot') {
      const success = playerInventory.useOneShotProgram(programId);
      if (!success) {
        return new NextResponse("Erreur lors de la consommation du programme", { status: 500 });
      }
    } else if (category === 'information') {
      // Les informations sont consommées après utilisation
      playerInventory.purchasedInformation = playerInventory.purchasedInformation.filter(
        item => !item.programId.equals(programId)
      );
    }

    // Sauvegarder l'inventaire
    await playerInventory.save();

    return NextResponse.json({
      success: true,
      message: `Programme ${program.name} utilisé avec succès`,
      effects: effects,
      revealedSkill: revealedSkill,
      skill: skill
    });

  } catch (error) {
    console.error("[API USE PROGRAM] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 