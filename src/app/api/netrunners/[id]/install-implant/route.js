import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Netrunner from '@/models/Netrunner';
import Program from '@/models/Program';
import PlayerInventory from '@/models/PlayerInventory';
import PlayerProfile from '@/models/PlayerProfile';

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

    // Vérifier que le runner appartient au joueur
    if (runner.ownerId !== userId) {
      return new NextResponse("Runner non autorisé", { status: 403 });
    }

    // Récupérer le programme
    const program = await Program.findById(programId);
    if (!program || program.type !== 'implant') {
      return new NextResponse("Programme d'implant non trouvé", { status: 404 });
    }

    // Récupérer l'inventaire du joueur
    const playerInventory = await PlayerInventory.findOne({ clerkId: userId });
    if (!playerInventory) {
      return new NextResponse("Inventaire non trouvé", { status: 404 });
    }

    // Récupérer le profil du joueur pour vérifier les fonds
    const playerProfile = await PlayerProfile.findOne({ clerkId: userId });
    if (!playerProfile) {
      return new NextResponse("Profil joueur non trouvé", { status: 404 });
    }

    // Vérifier que le joueur possède l'implant
    const hasImplant = playerInventory.implants.some(item => 
      item.programId.equals(programId) && item.quantity > 0
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

    // Coût de pose CharcuDoc (en plus du prix de l'implant déjà payé)
    const INSTALLATION_COST = 2000; // 2000 €$ pour la pose

    // Vérifier les fonds pour la pose
    if (playerProfile.eddies < INSTALLATION_COST) {
      return new NextResponse(`Fonds insuffisants pour la pose d'implant. Coût: ${INSTALLATION_COST} €$`, { status: 400 });
    }

    // Déduire le coût de pose
    playerProfile.eddies -= INSTALLATION_COST;

    // Installer l'implant sur le runner
    if (!runner.installedImplants) {
      runner.installedImplants = [];
    }
    
    runner.installedImplants.push({
      programId: programId,
      installedAt: new Date()
    });
    
    // Ajouter l'implant installé à l'inventaire du joueur
    if (!playerInventory.installedImplants) {
      playerInventory.installedImplants = [];
    }
    
    playerInventory.installedImplants.push({
      runnerId: runner._id,
      programId: programId,
      installedAt: new Date()
    });

    // Appliquer les effets de l'implant
    const permanentBoost = program.permanent_skill_boost;
    if (
      permanentBoost &&
      typeof permanentBoost.skill === 'string' &&
      permanentBoost.skill
    ) {
      const skill = permanentBoost.skill.toLowerCase();
      const boost = permanentBoost.value;
      if (runner.skills[skill] !== undefined) {
        runner.skills[skill] = Math.min(10, runner.skills[skill] + boost);
        console.log(`[INSTALL IMPLANT] ${program.name} appliqué: +${boost} à ${skill} sur ${runner.name}`);
      }
    }

    // Retirer l'implant de l'inventaire du joueur
    const implantIndex = playerInventory.implants.findIndex(item => 
      item.programId.equals(programId) && item.quantity > 0
    );
    
    if (implantIndex === -1) {
      return new NextResponse("Erreur lors de la suppression de l'implant de l'inventaire", { status: 500 });
    }
    
    // Réduire la quantité ou supprimer l'item
    const implantItem = playerInventory.implants[implantIndex];
    implantItem.quantity -= 1;
    
    if (implantItem.quantity <= 0) {
      playerInventory.implants.splice(implantIndex, 1);
    }

    // Sauvegarder les modifications
    await Promise.all([
      runner.save(),
      playerInventory.save(),
      playerProfile.save()
    ]);

    return NextResponse.json({
      success: true,
      message: `Implant ${program.name} installé avec succès sur ${runner.name}`,
      runnerName: runner.name,
      effects: program.effects,
      installationCost: INSTALLATION_COST,
      remainingEddies: playerProfile.eddies,
      implant: {
        name: program.name,
        description: program.description,
        rarity: program.rarity,
        permanent_skill_boost: program.permanent_skill_boost
      }
    });

  } catch (error) {
    console.error("[API INSTALL IMPLANT] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 