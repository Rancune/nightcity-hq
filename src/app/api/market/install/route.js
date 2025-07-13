import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Program from '@/models/Program';
import PlayerInventory from '@/models/PlayerInventory';
import Netrunner from '@/models/Netrunner';

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const { programId, runnerId } = await request.json();
    if (!programId || !runnerId) {
      return new NextResponse("Programme et runner requis", { status: 400 });
    }

    await connectDb();

    // Récupérer le programme
    const program = await Program.findById(programId);
    if (!program || program.type !== 'implant') {
      return new NextResponse("Programme d'implant invalide", { status: 404 });
    }

    // Récupérer le runner
    const runner = await Netrunner.findOne({ _id: runnerId, ownerId: userId });
    if (!runner) {
      return new NextResponse("Runner non trouvé", { status: 404 });
    }

    // Récupérer l'inventaire du joueur
    const playerInventory = await PlayerInventory.findOne({ clerkId: userId });
    if (!playerInventory) {
      return new NextResponse("Inventaire non trouvé", { status: 404 });
    }

    // Vérifier si le joueur possède l'implant
    const hasImplant = playerInventory.oneShotPrograms.some(
      item => item.programId.equals(programId)
    );

    if (!hasImplant) {
      return new NextResponse("Vous ne possédez pas cet implant", { status: 400 });
    }

    // Installer l'implant
    if (playerInventory.installImplant(runnerId, programId)) {
      // Appliquer l'effet permanent
      const skillBoost = program.permanent_skill_boost;
      if (skillBoost && skillBoost.skill) {
        runner.skills[skillBoost.skill] = Math.min(10, runner.skills[skillBoost.skill] + skillBoost.value);
        console.log(`[MARKET INSTALL] ${program.name} appliqué: +${skillBoost.value} à ${skillBoost.skill} sur ${runner.name}`);
      }

      // Retirer l'implant de l'inventaire
      playerInventory.useOneShotProgram(programId);

      // Sauvegarder
      await Promise.all([
        runner.save(),
        playerInventory.save()
      ]);

      return NextResponse.json({
        success: true,
        message: `${program.name} installé sur ${runner.name}`,
        runner: runner,
        skillBoost: skillBoost
      });
    } else {
      return new NextResponse("Implant déjà installé sur ce runner", { status: 400 });
    }

  } catch (error) {
    console.error("[API MARKET INSTALL] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 