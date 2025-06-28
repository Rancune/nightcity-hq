import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import PlayerInventory from '@/models/PlayerInventory';
import Program from '@/models/Program';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();

    // Récupérer ou créer l'inventaire du joueur
    let playerInventory = await PlayerInventory.findOne({ clerkId: userId });
    if (!playerInventory) {
      playerInventory = new PlayerInventory({ clerkId: userId });
    }

    // Trouver des programmes de test (implants et one-shot)
    const implantPrograms = await Program.find({ category: 'implant' }).limit(2);
    const oneShotPrograms = await Program.find({ category: 'one_shot' }).limit(2);

    // Ajouter des implants
    for (const program of implantPrograms) {
      const existing = playerInventory.oneShotPrograms.find(item => 
        item.programId.toString() === program._id.toString()
      );
      if (!existing) {
        playerInventory.oneShotPrograms.push({
          programId: program._id,
          quantity: 1,
          purchasedAt: new Date()
        });
      }
    }

    // Ajouter des programmes one-shot
    for (const program of oneShotPrograms) {
      const existing = playerInventory.oneShotPrograms.find(item => 
        item.programId.toString() === program._id.toString()
      );
      if (!existing) {
        playerInventory.oneShotPrograms.push({
          programId: program._id,
          quantity: 2,
          purchasedAt: new Date()
        });
      }
    }

    await playerInventory.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Items de test ajoutés',
      addedImplants: implantPrograms.length,
      addedOneShots: oneShotPrograms.length
    });

  } catch (error) {
    console.error("[TEST ADD INVENTORY] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 