import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import PlayerProfile from '@/models/PlayerProfile';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();
    
    // Récupérer le profil du joueur
    const player = await PlayerProfile.findOne({ clerkId: userId });
    if (!player) {
      return NextResponse.json({ error: "Profil joueur non trouvé" }, { status: 404 });
    }

    // Récupérer les contrats en attente de rapport
    const contracts = await Contract.find({ 
      ownerId: userId, 
      status: 'En attente de rapport' 
    }).populate('assignedRunner');

    return NextResponse.json({
      player: {
        eddies: player.eddies,
        reputationPoints: player.reputationPoints,
        reputationTitle: player.reputationTitle
      },
      contracts: contracts.map(contract => ({
        id: contract._id,
        title: contract.title,
        status: contract.status,
        reward: contract.reward,
        requiredSkills: contract.requiredSkills,
        resolution_outcome: contract.resolution_outcome
      }))
    });

  } catch (error) {
    console.error("[API TEST-REWARDS] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 