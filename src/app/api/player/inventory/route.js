import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import PlayerProfile from '@/models/PlayerProfile';
import PlayerInventory from '@/models/PlayerInventory';
import Program from '@/models/Program';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();
    
    const player = await PlayerProfile.findOne({ clerkId: userId });
    if (!player) {
      return new NextResponse("Profil joueur non trouvé", { status: 404 });
    }

    // Récupérer l'inventaire détaillé
    let playerInventory = await PlayerInventory.findOne({ clerkId: userId });
    if (!playerInventory) {
      playerInventory = new PlayerInventory({ clerkId: userId });
      await playerInventory.save();
    }

    // Récupérer les détails des programmes one-shot
    const oneShotPrograms = await Promise.all(
      playerInventory.oneShotPrograms.map(async (item) => {
        const program = await Program.findById(item.programId);
        return {
          ...item.toObject(),
          program: program ? {
            _id: program._id,
            name: program.name,
            description: program.description,
            rarity: program.rarity,
            type: program.type,
            effects: program.effects,
            permanent_skill_boost: program.permanent_skill_boost
          } : null
        };
      })
    );

    // Récupérer les détails des implants achetés
    const implants = await Promise.all(
      playerInventory.implants.map(async (item) => {
        const program = await Program.findById(item.programId);
        return {
          ...item.toObject(),
          program: program ? {
            _id: program._id,
            name: program.name,
            description: program.description,
            rarity: program.rarity,
            type: program.type,
            effects: program.effects,
            permanent_skill_boost: program.permanent_skill_boost
          } : null
        };
      })
    );

    console.log('[INVENTORY] Debug - One-shot programmes:', oneShotPrograms.length);
    console.log('[INVENTORY] Debug - Implants achetés:', implants.length);

    // Récupérer les détails des implants installés sur les runners
    const installedImplants = await Promise.all(
      playerInventory.installedImplants.map(async (item) => {
        const program = await Program.findById(item.programId);
        return {
          ...item.toObject(),
          program: program ? {
            _id: program._id,
            name: program.name,
            description: program.description,
            rarity: program.rarity,
            type: program.type,
            effects: program.effects,
            permanent_skill_boost: program.permanent_skill_boost
          } : null
        };
      })
    );

    // Récupérer les détails des informations achetées
    const purchasedInformation = await Promise.all(
      playerInventory.purchasedInformation.map(async (item) => {
        const program = await Program.findById(item.programId);
        return {
          ...item.toObject(),
          program: program ? {
            _id: program._id,
            name: program.name,
            description: program.description,
            rarity: program.rarity,
            type: program.type,
            effects: program.effects,
            permanent_skill_boost: program.permanent_skill_boost
          } : null
        };
      })
    );

    return NextResponse.json({
      // Inventaire simple pour compatibilité
      inventory: player.inventory || [],
      // Inventaire détaillé
      detailedInventory: {
        oneShotPrograms: oneShotPrograms,
        implants: implants,
        installedImplants,
        purchasedInformation,
        purchaseHistory: playerInventory.purchaseHistory,
        totalSpent: playerInventory.totalSpent,
        signatureItemsPurchased: playerInventory.signatureItemsPurchased
      }
    });
    
  } catch (error) {
    console.error("[INVENTORY] Erreur lors de la récupération de l'inventaire:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 