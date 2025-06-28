import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import MarketState from '@/models/MarketState';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    await connectDb();

    // Récupérer ou créer l'état du marché
    let marketState = await MarketState.findOne({ marketId: 'global' });
    if (!marketState) {
      marketState = new MarketState({
        marketId: 'global',
        lastStockRotation: new Date(),
        nextStockRotation: new Date().setHours(3, 0, 0, 0) + 24 * 60 * 60 * 1000 // Demain à 3h00
      });
      await marketState.save();
    }

    // Vérifier si une rotation est nécessaire
    const needsRotation = marketState.needsRotation();
    
    // Effectuer la rotation si nécessaire
    if (needsRotation) {
      await marketState.performRotation();
      console.log('[MARKET] Rotation automatique du stock effectuée');
    }

    return NextResponse.json({
      success: true,
      marketState: {
        lastRotation: marketState.lastStockRotation,
        nextRotation: marketState.nextStockRotation,
        needsRotation: needsRotation,
        config: marketState.config
      }
    });

  } catch (error) {
    console.error("[API MARKET ROTATE] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    await connectDb();

    // Récupérer l'état du marché
    let marketState = await MarketState.findOne({ marketId: 'global' });
    if (!marketState) {
      marketState = new MarketState({ marketId: 'global' });
    }

    // Effectuer une rotation manuelle
    await marketState.performRotation();
    
    console.log('[MARKET] Rotation manuelle du stock effectuée par:', userId);

    return NextResponse.json({
      success: true,
      message: "Rotation du stock effectuée avec succès",
      marketState: {
        lastRotation: marketState.lastStockRotation,
        nextRotation: marketState.nextStockRotation,
        config: marketState.config
      }
    });

  } catch (error) {
    console.error("[API MARKET ROTATE] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 