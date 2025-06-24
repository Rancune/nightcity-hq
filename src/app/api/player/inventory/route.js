import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import PlayerInventory from '@/models/PlayerInventory';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();

    // Récupérer l'inventaire du joueur avec population des programmes
    let playerInventory = await PlayerInventory.findOne({ clerkId: userId })
      .populate('oneShotPrograms.programId')
      .populate('installedImplants.programId')
      .populate('purchasedInformation.programId');

    if (!playerInventory) {
      playerInventory = new PlayerInventory({ clerkId: userId });
      await playerInventory.save();
    }

    // Transformer les données pour correspondre à l'interface attendue
    const transformedInventory = {
      oneShotPrograms: playerInventory.oneShotPrograms.map(item => ({
        program: item.programId,
        quantity: item.quantity
      })),
      installedImplants: playerInventory.installedImplants.map(item => ({
        program: item.programId
      })),
      information: playerInventory.purchasedInformation.map(item => ({
        program: item.programId
      })),
      totalSpent: playerInventory.totalSpent,
      signatureItemsPurchased: playerInventory.signatureItemsPurchased
    };

    return NextResponse.json(transformedInventory);

  } catch (error) {
    console.error("[API INVENTORY] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 