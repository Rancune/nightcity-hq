import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import PlayerProfile from '@/models/PlayerProfile';

export async function POST(request, props) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();
    const contractId = params.id;
    
    // Récupérer le contrat
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return new NextResponse("Contrat non trouvé", { status: 404 });
    }
    
    // Vérifier que le contrat appartient au joueur
    if (contract.ownerId !== userId) {
      return new NextResponse("Contrat non autorisé", { status: 403 });
    }
    
    // Vérifier que le contrat est encore proposé
    if (contract.status !== 'Proposé') {
      return new NextResponse("Contrat déjà accepté", { status: 400 });
    }
    
    // Récupérer le profil du joueur
    const player = await PlayerProfile.findOne({ clerkId: userId });
    if (!player) {
      return new NextResponse("Profil joueur non trouvé", { status: 404 });
    }
    
    // Vérifier si le joueur possède un Analyseur de Contrat
    const analyzerItem = player.inventory?.find(item => 
      item.name === "Analyseur de Contrat" && item.quantity > 0
    );
    
    if (!analyzerItem) {
      return new NextResponse("Analyseur de Contrat requis", { status: 400 });
    }
    
    // Consommer l'Analyseur de Contrat
    analyzerItem.quantity -= 1;
    if (analyzerItem.quantity <= 0) {
      // Supprimer l'item s'il n'y en a plus
      player.inventory = player.inventory.filter(item => 
        !(item.name === "Analyseur de Contrat" && item.quantity <= 0)
      );
    }
    
    // Marquer le contrat comme analysé
    contract.skillsRevealed = true;
    
    // Sauvegarder les changements
    await Promise.all([player.save(), contract.save()]);
    
    console.log(`[ANALYZE] Contrat ${contract.title} analysé par ${player.handle}`);
    
    return NextResponse.json({
      success: true,
      contract: contract,
      message: "Compétences révélées avec succès"
    });
    
  } catch (error) {
    console.error("[ANALYZE] Erreur lors de l'analyse:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 