import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Netrunner from '@/models/Netrunner';
import Program from '@/models/Program';
import PlayerInventory from '@/models/PlayerInventory';

export async function POST(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const { programId } = await request.json();
    if (!programId) {
      return new NextResponse("ID du programme manquant", { status: 400 });
    }

    await connectDb();

    const awaitedParams = await params;

    // Récupérer le runner
    const runner = await Netrunner.findById(awaitedParams.id);
    if (!runner) {
      return new NextResponse("Runner non trouvé", { status: 404 });
    }

    // Récupérer le programme
    const program = await Program.findById(programId);
    if (!program || program.type !== 'one_shot') {
      return new NextResponse("Programme one-shot non trouvé", { status: 404 });
    }

    // Récupérer l'inventaire du joueur
    const playerInventory = await PlayerInventory.findOne({ clerkId: userId });
    if (!playerInventory) {
      return new NextResponse("Inventaire non trouvé", { status: 404 });
    }

    // Vérifier que le joueur possède le programme one-shot
    const hasOneShot = playerInventory.oneShotPrograms.some(item => item.programId.equals(programId) && item.quantity > 0);
    if (!hasOneShot) {
      return new NextResponse("Vous ne possédez pas ce programme one-shot", { status: 400 });
    }

    // Appliquer l'effet du programme (exemple : soin, bonus, etc.)
    // Ici, on applique un effet générique : soin si le runner est grillé, sinon bonus hacking temporaire
    let effet = null;
    if (program.effects.skip_skill_check) {
      // Exemple : soigner le runner
      if (runner.status === 'Grillé') {
        runner.status = 'Disponible';
        effet = 'soin';
      }
    } else if (program.effects.add_bonus_roll > 0) {
      // Exemple : bonus hacking temporaire
      runner.skills.hacking = Math.min(10, runner.skills.hacking + program.effects.add_bonus_roll);
      effet = 'bonus_hacking';
    }
    // (À adapter selon la logique de vos programmes)

    // Retirer le programme one-shot de l'inventaire
    playerInventory.useOneShotProgram(programId);

    // Sauvegarder les modifications
    await Promise.all([
      runner.save(),
      playerInventory.save()
    ]);

    return NextResponse.json({
      success: true,
      message: `Programme ${program.name} appliqué avec succès`,
      runnerName: runner.name,
      effet
    });
  } catch (error) {
    console.error("[API USE ONE SHOT] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 