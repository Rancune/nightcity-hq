import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Program from '@/models/Program';
import PlayerProfile from '@/models/PlayerProfile';
import PlayerInventory from '@/models/PlayerInventory';
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

    // Vérifier et générer le stock si nécessaire
    await generateMarketStock();

    // Récupérer le stock disponible selon la réputation du joueur
    let availablePrograms = await Program.find({
      isActive: true,
      stock: { $gt: 0 },
      reputationRequired: { $lte: playerProfile.reputationPoints },
      $or: [
        { rotationExpiry: { $gt: new Date() } },
        { rotationExpiry: null }
      ]
    }).sort({ rarity: -1, price: 1 });

    // Si aucun programme disponible, forcer la génération
    if (availablePrograms.length === 0) {
      console.log('[MARKET] Aucun programme disponible, génération forcée...');
      
      // Désactiver tous les programmes existants
      await Program.updateMany({}, { isActive: false });
      
      // Générer du nouveau stock
      await generateMarketStock();
      
      // Récupérer le nouveau stock
      availablePrograms = await Program.find({
        isActive: true,
        stock: { $gt: 0 },
        reputationRequired: { $lte: playerProfile.reputationPoints },
        $or: [
          { rotationExpiry: { $gt: new Date() } },
          { rotationExpiry: null }
        ]
      }).sort({ rarity: -1, price: 1 });
      
      console.log(`[MARKET] Nouveau stock généré: ${availablePrograms.length} programmes`);
    }

    // Messages de l'Intermédiaire
    const vendorMessages = [
      "Nouvel arrivage. Premier arrivé, premier servi.",
      "Un corpo a 'perdu' une caisse de matos. Profites-en avant que les flics ne s'en mêlent.",
      "Stock limité. Les bonnes affaires ne durent jamais.",
      "Matériel de qualité. Prix de la discrétion.",
      "Prototypes instables. Utilisation à tes risques et périls."
    ];

    const randomMessage = vendorMessages[Math.floor(Math.random() * vendorMessages.length)];

    return NextResponse.json({
      programs: availablePrograms,
      vendorMessage: randomMessage,
      playerReputation: playerProfile.reputationPoints
    });

  } catch (error) {
    console.error("[API MARKET] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const { programId } = await request.json();
    if (!programId) {
      return new NextResponse("ID du programme manquant", { status: 400 });
    }

    await connectDb();

    // Récupérer le programme
    const program = await Program.findById(programId);
    if (!program || !program.isAvailable()) {
      return new NextResponse("Programme non disponible", { status: 404 });
    }

    // Récupérer le profil du joueur
    const playerProfile = await PlayerProfile.findOne({ clerkId: userId });
    if (!playerProfile) {
      return new NextResponse("Profil joueur non trouvé", { status: 404 });
    }

    // Vérifier la réputation
    if (playerProfile.reputationPoints < program.reputationRequired) {
      return new NextResponse("Réputation insuffisante", { status: 403 });
    }

    // Vérifier les fonds
    if (playerProfile.eddies < program.price) {
      return new NextResponse("Fonds insuffisants", { status: 400 });
    }

    // Récupérer ou créer l'inventaire du joueur
    let playerInventory = await PlayerInventory.findOne({ clerkId: userId });
    if (!playerInventory) {
      playerInventory = new PlayerInventory({ clerkId: userId });
    }

    // Effectuer l'achat
    if (program.purchase()) {
      // Déduire les eddies
      playerProfile.eddies -= program.price;
      
      // Ajouter à l'inventaire selon le type
      if (program.category === 'one_shot') {
        playerInventory.addOneShotProgram(programId);
      } else if (program.category === 'information') {
        playerInventory.purchasedInformation.push({ programId });
      }
      
      // Ajouter à l'historique
      playerInventory.addPurchase(programId, program.price);
      
      // Statistiques spéciales
      if (program.isSignature) {
        playerInventory.signatureItemsPurchased += 1;
      }

      // Sauvegarder
      await Promise.all([
        program.save(),
        playerProfile.save(),
        playerInventory.save()
      ]);

      return NextResponse.json({
        success: true,
        message: "Achat effectué avec succès",
        remainingEddies: playerProfile.eddies,
        program: program
      });
    } else {
      return new NextResponse("Stock épuisé", { status: 400 });
    }

  } catch (error) {
    console.error("[API MARKET POST] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 