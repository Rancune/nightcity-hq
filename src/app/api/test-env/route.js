// src/app/api/test-env/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDb from '@/Lib/database';
import { auth } from '@clerk/nextjs/server';
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

    // Générer du stock pour le marché noir
    await generateMarketStock();

    return NextResponse.json({
      success: true,
      message: "Environnement de test initialisé",
      playerProfile: {
        eddies: playerProfile.eddies,
        reputationPoints: playerProfile.reputationPoints,
        reputationTitle: playerProfile.reputationTitle
      }
    });

  } catch (error) {
    console.error("[API TEST-ENV] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}