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

    // Définir l'ordre des raretés (avec epic)
    const rarityOrder = ["common", "uncommon", "rare", "epic", "legendary"];
    // Correspondance niveau Fixer -> tier max
    const levelToTier = { 1: "uncommon", 2: "rare", 3: "epic", 4: "legendary" };
    const fixerLevel = playerProfile.reputationLevel || 1;
    const maxTier = levelToTier[fixerLevel] || "uncommon";
    const maxTierIndex = rarityOrder.indexOf(maxTier);

    // Récupérer TOUS les programmes disponibles selon la réputation
    let availablePrograms = await Program.find({
      isActive: true,
      stock: { $gt: 0 },
      reputationRequired: { $lte: playerProfile.reputationPoints },
      $or: [
        { rotationExpiry: { $gt: new Date() } },
        { rotationExpiry: null }
      ]
    }).sort({ rarity: -1, price: 1 });
    // Ajouter canBuy selon la rareté max autorisée
    availablePrograms = availablePrograms.map(program => {
      const itemTierIndex = rarityOrder.indexOf(program.rarity);
      return { ...program.toObject(), canBuy: itemTierIndex <= maxTierIndex };
    });

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

    // Effectuer l'achat
    if (program.purchase()) {
      // Déduire les eddies du profil
      playerProfile.eddies -= program.price;
      
      // Récupérer ou créer l'inventaire du joueur
      let playerInventory = await PlayerInventory.findOne({ clerkId: userId });
      if (!playerInventory) {
        playerInventory = new PlayerInventory({ clerkId: userId });
      }
      
      // Ajouter le programme à l'inventaire selon sa catégorie
      if (program.type === 'one_shot') {
        playerInventory.addOneShotProgram(programId);
      } else if (program.type === 'implant') {
        // Les implants sont stockés mais pas installés automatiquement
        playerInventory.addOneShotProgram(programId);
      } else if (program.type === 'information') {
        playerInventory.purchasedInformation.push({
          programId: programId,
          purchasedAt: new Date()
        });
      } else {
        // Pour les autres catégories, traiter comme one-shot
        playerInventory.addOneShotProgram(programId);
      }
      
      // Ajouter à l'historique des achats
      playerInventory.addPurchase(programId, program.price);
      
      // Mettre à jour l'inventaire simple dans PlayerProfile pour compatibilité
      if (!playerProfile.inventory) {
        playerProfile.inventory = [];
      }
      
      const existingItem = playerProfile.inventory.find(item => item.name === program.name);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        playerProfile.inventory.push({
          name: program.name,
          description: program.description,
          rarity: program.rarity,
          type: program.type,
          effects: program.effects,
          permanent_skill_boost: program.permanent_skill_boost,
          quantity: 1
        });
      }
      
      // Sauvegarder toutes les modifications
      await Promise.all([
        program.save(),
        playerProfile.save(),
        playerInventory.save()
      ]);

      console.log(`[MARKET] Achat effectué: ${program.name} par ${playerProfile.handle}`);

      return NextResponse.json({
        success: true,
        message: "Achat effectué avec succès",
        remainingEddies: playerProfile.eddies,
        program: program,
        inventory: playerProfile.inventory
      });
    } else {
      return new NextResponse("Stock épuisé", { status: 400 });
    }

  } catch (error) {
    console.error("[API MARKET POST] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 