import { NextResponse } from 'next/server';
// import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import PlayerProfile from '@/models/PlayerProfile';
import { generateReputationReport } from '@/Lib/reputation';

export async function GET() {
  try {
    // Temporairement désactivé pour les tests en production
    // const { userId } = await auth();
    // if (!userId) return new NextResponse("Non autorisé", { status: 401 });
    
    // Utiliser un userId par défaut pour les tests
    const userId = "test_user_id";

    await connectDb();
    let playerProfile = await PlayerProfile.findOne({ clerkId: userId });
    
    // Créer un profil de test si aucun n'existe
    if (!playerProfile) {
      playerProfile = new PlayerProfile({
        clerkId: userId,
        handle: "TestUser",
        eddies: 1000,
        reputationPoints: 50,
        reputationTitle: "Débutant",
        missionsCompleted: 0,
        missionsFailed: 0,
        totalReputationGained: 0,
        totalReputationLost: 0,
        reputationBonuses: {
          stealthBonus: false,
          speedBonus: false,
          secondaryObjectiveBonus: false
        },
        unlockedAccess: {
          equipmentTier: "common",
          vendorDiscount: 0,
          specialMissions: false,
          exclusiveContacts: false
        },
        lastSeen: new Date()
      });
      await playerProfile.save();
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