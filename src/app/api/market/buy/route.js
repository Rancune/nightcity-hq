import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import PlayerProfile from '@/models/PlayerProfile';
import PlayerInventory from '@/models/PlayerInventory';
import Program from '@/models/Program';
import MarketState from '@/models/MarketState';
import { getProgramById } from '@/Lib/programCatalog';

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    await connectDb();

    const { itemId } = await request.json();
    if (!itemId) {
      return new NextResponse("ID d'objet requis", { status: 400 });
    }

    // Récupérer le profil du joueur
    const playerProfile = await PlayerProfile.findOne({ clerkId: userId });
    if (!playerProfile) {
      return new NextResponse("Profil joueur non trouvé", { status: 404 });
    }

    // Récupérer l'inventaire du joueur
    let playerInventory = await PlayerInventory.findOne({ clerkId: userId });
    if (!playerInventory) {
      playerInventory = new PlayerInventory({ 
        clerkId: userId,
        oneShotPrograms: [],
        implants: [],
        installedImplants: [],
        purchasedInformation: [],
        purchaseHistory: []
      });
    }

    // Récupérer l'état du marché
    let marketState = await MarketState.findOne({ marketId: 'global' });
    if (!marketState) {
      marketState = new MarketState({ marketId: 'global' });
      await marketState.save();
    }

    // Trouver l'objet dans le catalogue centralisé
    const targetItem = getProgramById(itemId);
    if (!targetItem) {
      return new NextResponse("Objet non trouvé ou non disponible", { status: 404 });
    }

    // Vérifier le Street Cred
    console.log(`[MARKET BUY DEBUG] Street Cred requis: ${targetItem.streetCredRequired}, Joueur: ${playerProfile.reputationPoints}`);
    if (targetItem.streetCredRequired > playerProfile.reputationPoints) {
      console.log(`[MARKET BUY DEBUG] Street Cred insuffisant pour ${targetItem.name}`);
      return new NextResponse("Street Cred insuffisant pour cet objet", { status: 403 });
    }

    // Vérifier les fonds
    console.log(`[MARKET BUY DEBUG] Coût: ${targetItem.cost}, Fonds joueur: ${playerProfile.eddies}`);
    if (playerProfile.eddies < targetItem.cost) {
      console.log(`[MARKET BUY DEBUG] Fonds insuffisants pour ${targetItem.name}`);
      return new NextResponse("Fonds insuffisants", { status: 400 });
    }

    // Vérifier le stock pour les objets Signature
    if (targetItem.isSignature) {
      const stockInfo = marketState.currentStock.get(itemId);
      const currentStock = stockInfo ? stockInfo.stock : (targetItem.stock || 0);
      
      if (currentStock <= 0) {
        return new NextResponse("Stock épuisé pour cet objet", { status: 400 });
      }
    }

    // Vérifier la limite quotidienne
    const maxDaily = targetItem.maxDaily || 5; // Limite par défaut : 5 par jour
    
    // Logique de vérification de limite quotidienne
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Initialiser dailyLimits si nécessaire
    if (!marketState.dailyLimits) {
      marketState.dailyLimits = new Map();
    }
    
    // Récupérer ou créer l'entrée pour cet utilisateur
    if (!marketState.dailyLimits.has(userId)) {
      marketState.dailyLimits.set(userId, new Map());
    }
    
    const userLimits = marketState.dailyLimits.get(userId);
    
    // Récupérer ou créer l'entrée pour cet objet
    if (!userLimits.has(itemId)) {
      userLimits.set(itemId, { count: 0, lastReset: today });
    }
    
    const itemLimit = userLimits.get(itemId);
    
    // Vérifier si c'est un nouveau jour
    const lastReset = new Date(itemLimit.lastReset);
    const lastResetDay = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate());
    
    if (today.getTime() !== lastResetDay.getTime()) {
      // Nouveau jour, réinitialiser le compteur
      itemLimit.count = 0;
      itemLimit.lastReset = today;
    }
    
    // Vérifier si la limite est atteinte
    if (itemLimit.count >= maxDaily) {
      return new NextResponse(`Limite quotidienne atteinte pour cet objet (${itemLimit.count}/${maxDaily} par jour)`, { status: 400 });
    }
    
    // Incrémenter le compteur
    itemLimit.count += 1;

    // Créer ou récupérer le programme dans la base de données
    let program = await Program.findOne({ marketId: itemId });
    if (!program) {
      program = new Program({
        name: targetItem.name,
        description: targetItem.description,
        type: targetItem.type,
        rarity: targetItem.rarity,
        streetCredRequired: targetItem.streetCredRequired,
        cost: targetItem.cost,
        effects: targetItem.effects || {},
        permanent_skill_boost: targetItem.permanent_skill_boost || null,
        marketId: itemId,
        vendor: targetItem.vendor,
        vendorMessage: targetItem.vendorMessage
      });
      await program.save();
    }

    // Déduire le coût
    playerProfile.eddies -= targetItem.cost;

    // Ajouter à l'inventaire selon le type
    if (targetItem.type === 'implant') {
      playerInventory.addImplant(program._id);
    } else {
      playerInventory.addOneShotProgram(program._id);
    }
    
    // Ajouter à l'historique des achats
    playerInventory.addPurchase(program._id, targetItem.cost);

    // Réduire le stock du programme
    if (program.stock > 0) {
      program.stock -= 1;
      program.timesPurchased += 1;
      await program.save();
    }

    // Réduire le stock si c'est un objet Signature (logique existante)
    if (targetItem.isSignature) {
      const stockInfo = marketState.currentStock.get(itemId);
      const currentStock = stockInfo ? stockInfo.stock : (targetItem.stock || 0);
      
      marketState.currentStock.set(itemId, {
        stock: currentStock - 1,
        lastRestocked: stockInfo ? stockInfo.lastRestocked : new Date()
      });
    }

    // Sauvegarder les modifications
    await playerProfile.save();
    await playerInventory.save();
    await marketState.save();

    return NextResponse.json({
      success: true,
      message: `${targetItem.name} acheté avec succès !`,
      item: targetItem,
      remainingEddies: playerProfile.eddies,
      programId: program._id,
      dailyLimit: {
        current: itemLimit.count,
        max: maxDaily
      }
    });

  } catch (error) {
    console.error("[API MARKET BUY] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 