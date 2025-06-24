import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Program from '@/models/Program';
import PlayerProfile from '@/models/PlayerProfile';
import { generateMarketStock } from '@/Lib/market';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();
    
    // Récupérer le profil du joueur
    const playerProfile = await PlayerProfile.findOne({ clerkId: userId });
    if (!playerProfile) {
      return new NextResponse("Profil joueur non trouvé", { status: 404 });
    }

    // Vérifier l'état actuel du stock
    const allPrograms = await Program.find({});
    const activePrograms = await Program.find({ isActive: true });
    const availablePrograms = await Program.find({
      isActive: true,
      stock: { $gt: 0 },
      reputationRequired: { $lte: playerProfile.reputationPoints }
    });

    console.log(`[DEBUG MARKET] Total programmes: ${allPrograms.length}`);
    console.log(`[DEBUG MARKET] Programmes actifs: ${activePrograms.length}`);
    console.log(`[DEBUG MARKET] Programmes disponibles: ${availablePrograms.length}`);

    // Si aucun programme actif, forcer la génération
    if (activePrograms.length === 0) {
      console.log('[DEBUG MARKET] Aucun programme actif, génération forcée...');
      
      // Désactiver tous les programmes existants
      await Program.updateMany({}, { isActive: false });
      
      // Générer du nouveau stock
      await generateMarketStock();
      
      // Récupérer le nouveau stock
      const newActivePrograms = await Program.find({ isActive: true });
      const newAvailablePrograms = await Program.find({
        isActive: true,
        stock: { $gt: 0 },
        reputationRequired: { $lte: playerProfile.reputationPoints }
      });

      return NextResponse.json({
        success: true,
        message: "Stock généré avec succès",
        debug: {
          totalPrograms: allPrograms.length,
          oldActivePrograms: activePrograms.length,
          oldAvailablePrograms: availablePrograms.length,
          newActivePrograms: newActivePrograms.length,
          newAvailablePrograms: newAvailablePrograms.length,
          playerReputation: playerProfile.reputationPoints
        },
        newPrograms: newAvailablePrograms.map(p => ({
          name: p.name,
          category: p.category,
          rarity: p.rarity,
          price: p.price,
          stock: p.stock,
          reputationRequired: p.reputationRequired
        }))
      });
    }

    return NextResponse.json({
      success: true,
      message: "Diagnostic du marché",
      debug: {
        totalPrograms: allPrograms.length,
        activePrograms: activePrograms.length,
        availablePrograms: availablePrograms.length,
        playerReputation: playerProfile.reputationPoints
      },
      availablePrograms: availablePrograms.map(p => ({
        name: p.name,
        category: p.category,
        rarity: p.rarity,
        price: p.price,
        stock: p.stock,
        reputationRequired: p.reputationRequired
      }))
    });

  } catch (error) {
    console.error("[API MARKET DEBUG] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 