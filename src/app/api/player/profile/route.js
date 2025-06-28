import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import PlayerProfile from '@/models/PlayerProfile';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    await connectDb();

    // Récupérer ou créer le profil du joueur
    let playerProfile = await PlayerProfile.findOne({ clerkId: userId });
    if (!playerProfile) {
      // Créer un nouveau profil avec des valeurs par défaut
      playerProfile = new PlayerProfile({
        clerkId: userId,
        eddies: 1000, // Montant de départ
        reputationPoints: 0,
        handle: `runner_${userId.slice(-6)}`,
        missionsCompleted: 0,
        missionsFailed: 0,
        totalReputationGained: 0,
        totalReputationLost: 0
      });
      await playerProfile.save();
    }

    return NextResponse.json(playerProfile);

  } catch (error) {
    console.error("[API PLAYER PROFILE] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 