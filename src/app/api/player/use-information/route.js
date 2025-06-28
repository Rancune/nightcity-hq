import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import PlayerInventory from '@/models/PlayerInventory';
import Program from '@/models/Program';
import Contract from '@/models/Contract';

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const { programId } = await request.json();
    if (!programId) {
      return new NextResponse("ID du datashard manquant", { status: 400 });
    }

    await connectDb();

    // Récupérer l'inventaire du joueur
    const playerInventory = await PlayerInventory.findOne({ clerkId: userId });
    if (!playerInventory) {
      return new NextResponse("Inventaire non trouvé", { status: 404 });
    }

    // Vérifier possession du datashard
    const infoIndex = playerInventory.purchasedInformation.findIndex(item => item.programId.equals(programId));
    if (infoIndex === -1) {
      return new NextResponse("Vous ne possédez pas ce datashard", { status: 400 });
    }

    // Récupérer le programme datashard
    const program = await Program.findById(programId);
    if (!program || program.category !== 'information') {
      return new NextResponse("Datashard invalide", { status: 404 });
    }

    // Générer le contrat exclusif selon le template du datashard
    let contractData = null;
    if (program.name.includes('Corpo')) {
      contractData = {
        title: "Contrat Corpo Exclusif",
        description: "Un contrat secret obtenu grâce à des informations sur les corpos. Récompense exceptionnelle.",
        employerFaction: "arasaka",
        targetFaction: "militech",
        missionType: "infiltration",
        loreDifficulty: "difficile",
        requiredSkills: { hacking: 8, stealth: 7, combat: 5 },
        reward: { eddies: 30000, reputation: 100 },
        involvedFactions: ["arasaka", "militech"]
      };
    } else if (program.name.includes('Underground')) {
      contractData = {
        title: "Contrat Gang Exclusif",
        description: "Un contrat spécial obtenu via le réseau souterrain. Opportunité rare.",
        employerFaction: "voodooBoys",
        targetFaction: "maelstrom",
        missionType: "sabotage",
        loreDifficulty: "difficile",
        requiredSkills: { hacking: 6, stealth: 8, combat: 7 },
        reward: { eddies: 20000, reputation: 80 },
        involvedFactions: ["voodooBoys", "maelstrom"]
      };
    } else {
      return new NextResponse("Type de datashard inconnu", { status: 400 });
    }

    // Créer le contrat
    const contract = new Contract({
      ...contractData,
      ownerId: userId,
      status: 'Proposé',
      revealedSkillsByPlayer: [],
      activeProgramEffects: []
    });
    await contract.save();

    // Consommer le datashard
    playerInventory.purchasedInformation.splice(infoIndex, 1);
    await playerInventory.save();

    return NextResponse.json({
      success: true,
      message: `Contrat exclusif généré !`,
      contract: contract
    });
  } catch (error) {
    console.error("[USE INFORMATION] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 