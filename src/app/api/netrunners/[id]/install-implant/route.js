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

    // Récupérer le runner
    const runner = await Netrunner.findById(params.id);
    if (!runner) {
      return new NextResponse("Runner non trouvé", { status: 404 });
    }

    // Récupérer le programme
    const program = await Program.findById(programId);
    if (!program || program.category !== 'implant') {
      return new NextResponse("Programme d'implant non trouvé", { status: 404 });
    }

    // Récupérer l'inventaire du joueur
    const playerInventory = await PlayerInventory.findOne({ clerkId: userId });
    if (!playerInventory) {
      return new NextResponse("Inventaire non trouvé", { status: 404 });
    }

    // Vérifier que le joueur possède l'implant
    const hasImplant = playerInventory.installedImplants.some(item => 
      item.programId.equals(programId)
    );

    if (!hasImplant) {
      return new NextResponse("Vous ne possédez pas cet implant", { status: 400 });
    }

    // Vérifier que le runner n'a pas déjà cet implant
    const hasAlreadyImplant = (runner.installedImplants || []).some(implant => 
      implant.programId.equals(programId)
    );

    if (hasAlreadyImplant) {
      return new NextResponse("Le runner possède déjà cet implant", { status: 400 });
    }

    // Installer l'implant sur le runner
    if (!runner.installedImplants) {
      runner.installedImplants = [];
    }
    
    runner.installedImplants.push({
      programId: programId,
      installedAt: new Date()
    });

    // Appliquer les effets de l'implant
    const effects = program.effects;
    if (effects.permanent_skill_boost) {
      const skill = effects.permanent_skill_boost.skill.toLowerCase();
      const boost = effects.permanent_skill_boost.value;
      
      if (runner.skills[skill] !== undefined) {
        runner.skills[skill] = Math.min(10, runner.skills[skill] + boost);
      }
    }

    // Retirer l'implant de l'inventaire du joueur
    playerInventory.installedImplants = playerInventory.installedImplants.filter(
      item => !item.programId.equals(programId)
    );

    // Sauvegarder les modifications
    await Promise.all([
      runner.save(),
      playerInventory.save()
    ]);

    return NextResponse.json({
      success: true,
      message: `Implant ${program.name} installé avec succès`,
      runnerName: runner.name,
      effects: effects
    });

  } catch (error) {
    console.error("[API INSTALL IMPLANT] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 