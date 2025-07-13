import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import PlayerProfile from '@/models/PlayerProfile';
import MarketState from '@/models/MarketState';
import Program from '@/models/Program';
import { generateMarketStock } from '@/Lib/market';



// Informations sur les vendeurs
const VENDORS = {
  charcudoc: {
    name: "Le Charcudoc",
    description: "Chirurgien blasé spécialisé dans les améliorations corporelles",
    icon: "🔪",
    specialty: "Implants"
  },
  netrunner_fantome: {
    name: "Le Netrunner Fantôme",
    description: "Contact anonyme qui ne communique que par texte crypté",
    icon: "👻",
    specialty: "Programmes"
  },
  informatrice: {
    name: "L'Informatrice",
    description: "Bien connectée, elle connaît toutes les rumeurs",
    icon: "💬",
    specialty: "Informations"
  },
  anarchiste: {
    name: "L'Anarchiste",
    description: "Idéologique et chaotique, il vend pour semer le désordre",
    icon: "💣",
    specialty: "Sabotage"
  }
};

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    await connectDb();

    // Utiliser directement les programmes existants (désactivation de la génération automatique)
    // await generateMarketStock();
    
    // Récupérer l'état du marché pour le timer
    let marketState = await MarketState.findOne({ marketId: 'global' });
    if (!marketState) {
      marketState = new MarketState({
        marketId: 'global',
        lastStockRotation: new Date(),
        nextStockRotation: new Date().setHours(3, 0, 0, 0) + 24 * 60 * 60 * 1000
      });
      await marketState.save();
    }

    // Récupérer le profil du joueur pour vérifier le Street Cred
    const playerProfile = await PlayerProfile.findOne({ clerkId: userId });
    if (!playerProfile) {
      return new NextResponse("Profil joueur non trouvé", { status: 404 });
    }

    const streetCred = playerProfile.reputationPoints || 0;

    // Définir l'ordre des raretés (avec epic)
    const rarityOrder = ["common", "uncommon", "rare", "epic", "legendary"];
    // Correspondance niveau Fixer -> tier max
    const levelToTier = { 1: "uncommon", 2: "rare", 3: "epic", 4: "legendary" };
    const fixerLevel = playerProfile.reputationLevel || 1;
    const maxTier = levelToTier[fixerLevel] || "uncommon";
    const maxTierIndex = rarityOrder.indexOf(maxTier);

    // Récupérer TOUS les programmes actifs et en stock > 0
    let availableItems = await Program.find({
      isActive: true,
      stock: { $gt: 0 }
    }).lean();

    // NE PAS filtrer selon la street cred ou la rareté, mais calculer canBuy
    availableItems = availableItems.map(item => {
      const itemTierIndex = rarityOrder.indexOf(item.rarity);
      const canBuy = itemTierIndex <= maxTierIndex && item.streetCredRequired <= streetCred;
      return {
        ...item,
        id: item.marketId,
        canBuy,
        currentStock: item.stock,
        available: item.stock > 0,
        dailyLimit: {
          current: 0,
          max: item.maxDaily || 1,
          remaining: item.maxDaily || 1
        }
      };
    });

    // Organiser par vendeur
    const organizedMarket = {};
    Object.keys(VENDORS).forEach(vendorKey => {
      const vendorItems = availableItems.filter(item => item.vendor === vendorKey);
      organizedMarket[vendorKey] = {
        ...VENDORS[vendorKey],
        items: vendorItems
      };
    });

    return NextResponse.json({
      success: true,
      market: organizedMarket,
      playerStreetCred: streetCred,
      vendors: VENDORS,
      marketState: {
        lastRotation: marketState.lastStockRotation,
        nextRotation: marketState.nextStockRotation,
        config: marketState.config
      }
    });

  } catch (error) {
    console.error("[API MARKET] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 