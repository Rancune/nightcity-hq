import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import PlayerInventory from '@/models/PlayerInventory';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();
    let playerInventory = await PlayerInventory.findOne({ clerkId: userId });

    // Créer un inventaire si aucun n'existe
    if (!playerInventory) {
      playerInventory = new PlayerInventory({
        clerkId: userId,
        oneShotPrograms: [],
        installedImplants: [],
        purchasedInformation: [],
        purchaseHistory: [],
        totalSpent: 0,
        signatureItemsPurchased: 0
      });
      await playerInventory.save();
    }

    return NextResponse.json(playerInventory);

  } catch (error) {
    console.error("[API INVENTORY] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 