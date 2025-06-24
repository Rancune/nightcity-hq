import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Program from '@/models/Program';
import PlayerInventory from '@/models/PlayerInventory';

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const { programId, contractId } = await request.json();
    if (!programId) {
      return new NextResponse("ID du programme requis", { status: 400 });
    }

    await connectDb();

    // Récupérer le programme
    const program = await Program.findById(programId);
    if (!program || program.category !== 'one_shot') {
      return new NextResponse("Programme one-shot invalide", { status: 404 });
    }

    // Récupérer l'inventaire du joueur
    const playerInventory = await PlayerInventory.findOne({ clerkId: userId });
    if (!playerInventory) {
      return new NextResponse("Inventaire non trouvé", { status: 404 });
    }

    // Vérifier si le joueur possède le programme
    const hasProgram = playerInventory.oneShotPrograms.some(
      item => item.programId.equals(programId) && item.quantity > 0
    );

    if (!hasProgram) {
      return new NextResponse("Vous ne possédez pas ce programme", { status: 400 });
    }

    // Utiliser le programme
    if (playerInventory.useOneShotProgram(programId)) {
      await playerInventory.save();

      return NextResponse.json({
        success: true,
        message: `${program.name} utilisé`,
        effects: program.effects,
        remainingQuantity: playerInventory.oneShotPrograms.find(
          item => item.programId.equals(programId)
        )?.quantity || 0
      });
    } else {
      return new NextResponse("Erreur lors de l'utilisation du programme", { status: 400 });
    }

  } catch (error) {
    console.error("[API MARKET USE-PROGRAM] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 