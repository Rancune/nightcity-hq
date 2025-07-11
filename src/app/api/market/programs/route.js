import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import PlayerProfile from '@/models/PlayerProfile';
import MarketState from '@/models/MarketState';

// On importe directement le catalogue depuis le fichier JSON
import MARKET_CATALOG from '@/data/market-catalog.json';



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

    // Vérifier et effectuer la rotation du stock si nécessaire
    let marketState = await MarketState.findOne({ marketId: 'global' });
    if (!marketState) {
      marketState = new MarketState({
        marketId: 'global',
        lastStockRotation: new Date(),
        nextStockRotation: new Date().setHours(3, 0, 0, 0) + 24 * 60 * 60 * 1000
      });
      await marketState.save();
    }

    // Vérifier si une rotation est nécessaire
    if (marketState.needsRotation()) {
      await marketState.performRotation();
      console.log('[MARKET] Rotation automatique du stock effectuée');
    }

    // Récupérer le profil du joueur pour vérifier le Street Cred
    const playerProfile = await PlayerProfile.findOne({ clerkId: userId });
    if (!playerProfile) {
      return new NextResponse("Profil joueur non trouvé", { status: 404 });
    }

    const streetCred = playerProfile.reputationPoints || 0;

    // Filtrer les objets selon le Street Cred du joueur
    let availableItems = MARKET_CATALOG.filter(item => 
      item.streetCredRequired <= streetCred
    );

    // Gérer le stock des objets Signature
    availableItems = availableItems.map(item => {
      if (item.isSignature) {
        const stockInfo = marketState.currentStock.get(item.id);
        const currentStock = stockInfo ? stockInfo.stock : (item.stock || 0);
        
        return {
          ...item,
          currentStock: currentStock,
          available: currentStock > 0
        };
      }
      return item;
    });

    // Ajouter les informations de limite quotidienne du joueur
    const userLimits = marketState.dailyLimits ? marketState.dailyLimits.get(userId) : null;
    const playerDailyLimits = new Map();
    
    if (userLimits) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      for (const [itemId, itemLimit] of userLimits.entries()) {
        const lastReset = new Date(itemLimit.lastReset);
        const lastResetDay = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate());
        
        if (today.getTime() === lastResetDay.getTime()) {
          playerDailyLimits.set(itemId, itemLimit.count);
        } else {
          playerDailyLimits.set(itemId, 0);
        }
      }
    }
    
    availableItems = availableItems.map(item => {
      const currentDaily = playerDailyLimits.get(item.id) || 0;
      const maxDaily = item.maxDaily || 1;
      
      return {
        ...item,
        dailyLimit: {
          current: currentDaily,
          max: maxDaily,
          remaining: maxDaily - currentDaily
        }
      };
    });

    // Organiser par vendeur
    const organizedMarket = {};
    Object.keys(VENDORS).forEach(vendorKey => {
      organizedMarket[vendorKey] = {
        ...VENDORS[vendorKey],
        items: availableItems.filter(item => item.vendor === vendorKey)
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