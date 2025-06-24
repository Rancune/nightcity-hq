import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import PlayerProfile from '@/models/PlayerProfile';
import { generateReputationReport } from '@/Lib/reputation';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();
    const playerProfile = await PlayerProfile.findOne({ clerkId: userId });
    
    if (!playerProfile) {
      return new NextResponse("Profil non trouvé", { status: 404 });
    }

    // Générer le rapport de réputation
    const reputationReport = generateReputationReport(playerProfile);

    return NextResponse.json({
      playerProfile,
      reputationReport
    });

  } catch (error) {
    console.error("[API REPUTATION] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 