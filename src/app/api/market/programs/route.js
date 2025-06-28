import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import PlayerProfile from '@/models/PlayerProfile';
import MarketState from '@/models/MarketState';

// Catalogue complet du marché noir
const MARKET_CATALOG = [
  // === CHARCUDOC - IMPLANTS ===
  {
    "id": "charcudoc-implant-neural-basique-hack",
    "vendor": "charcudoc",
    "name": "Implant Neural 'HackMaster' Mk.I",
    "description": "Un co-processeur neural standard qui optimise les algorithmes de piratage. Augmente définitivement le Hacking d'un runner de +1.",
    "type": "implant",
    "rarity": "uncommon",
    "streetCredRequired": 150,
    "cost": 8000,
    "effects": {
      "permanent_skill_boost": {
        "skill": "hacking",
        "value": 1
      }
    }
  },
  {
    "id": "charcudoc-implant-optique-shadow-mk1",
    "vendor": "charcudoc",
    "name": "Implant Optique 'Shadow' Mk.I",
    "description": "Amélioration de la cornée qui analyse les schémas de patrouille en temps réel. Augmente définitivement le Stealth d'un runner de +1.",
    "type": "implant",
    "rarity": "uncommon",
    "streetCredRequired": 150,
    "cost": 8000,
    "effects": {
      "permanent_skill_boost": {
        "skill": "stealth",
        "value": 1
      }
    }
  },
  {
    "id": "charcudoc-cyberbras-warrior-mk1",
    "vendor": "charcudoc",
    "name": "Cyberbras 'Warrior' Mk.I",
    "description": "Actuateurs myomères renforcés pour une meilleure stabilisation de l'arme. Augmente définitivement le Combat d'un runner de +1.",
    "type": "implant",
    "rarity": "uncommon",
    "streetCredRequired": 150,
    "cost": 8000,
    "effects": {
      "permanent_skill_boost": {
        "skill": "combat",
        "value": 1
      }
    }
  },
  {
    "id": "charcudoc-cortex-quantique-mk2",
    "vendor": "charcudoc",
    "name": "Cortex Quantique 'Kiroshi' Mk.II",
    "description": "Un processeur de calcul quantique expérimental. Un véritable monstre. Augmente définitivement le Hacking d'un runner de +2.",
    "type": "implant",
    "rarity": "legendary",
    "streetCredRequired": 1200,
    "cost": 25000,
    "effects": {
      "permanent_skill_boost": {
        "skill": "hacking",
        "value": 2
      }
    }
  },
  {
    "id": "charcudoc-camouflage-thermo-optique-mk2",
    "vendor": "charcudoc",
    "name": "Camouflage Thermo-Optique 'Spectre' Mk.II",
    "description": "Dévie la lumière et masque la signature thermique. Le top du top de l'infiltration. Augmente définitivement le Stealth d'un runner de +2.",
    "type": "implant",
    "rarity": "legendary",
    "streetCredRequired": 1200,
    "cost": 25000,
    "effects": {
      "permanent_skill_boost": {
        "skill": "stealth",
        "value": 2
      }
    }
  },
  {
    "id": "charcudoc-ossature-titane-mk2",
    "vendor": "charcudoc",
    "name": "Ossature en Titane 'Manticore' Mk.II",
    "description": "Un squelette renforcé en alliage de titane pour encaisser et rendre les coups. Augmente définitivement le Combat d'un runner de +2.",
    "type": "implant",
    "rarity": "legendary",
    "streetCredRequired": 1200,
    "cost": 25000,
    "effects": {
      "permanent_skill_boost": {
        "skill": "combat",
        "value": 2
      }
    }
  },
  {
    "id": "charcudoc-regulateur-synaptique",
    "vendor": "charcudoc",
    "name": "Régulateur Synaptique",
    "description": "Un implant qui stabilise les neuro-transmetteurs. Réduit de 25% le temps de récupération d'un runner 'Grillé'.",
    "type": "implant",
    "rarity": "rare",
    "streetCredRequired": 500,
    "cost": 18000,
    "effects": {
      "passive_heal_boost": 0.25
    }
  },

  // === NETRUNNER FANTÔME - PROGRAMMES ===
  {
    "id": "netrunner-fantome-mouchard",
    "vendor": "netrunner_fantome",
    "name": "Logiciel 'Mouchard'",
    "description": "Un simple script qui scanne les ports ouverts d'un système. Révèle une des compétences requises pour un contrat avant son acceptation.",
    "type": "one_shot",
    "rarity": "common",
    "streetCredRequired": 0,
    "cost": 800,
    "maxDaily": 3,
    "effects": {
      "reveal_skill": true
    }
  },
  {
    "id": "netrunner-fantome-patch-focus",
    "vendor": "netrunner_fantome",
    "name": "Patch de Focus",
    "description": "Stimulant chimique qui améliore la concentration. +2 au prochain test de Hacking. Usage unique.",
    "type": "one_shot",
    "rarity": "uncommon",
    "streetCredRequired": 150,
    "cost": 3000,
    "maxDaily": 2,
    "effects": {
      "add_bonus_roll": 2,
      "skill": "hacking"
    }
  },
  {
    "id": "netrunner-fantome-patch-stealth",
    "vendor": "netrunner_fantome",
    "name": "Patch d'Infiltration",
    "description": "Amortisseurs de son et inhibiteurs de mouvement. +2 au prochain test de Stealth. Usage unique.",
    "type": "one_shot",
    "rarity": "uncommon",
    "streetCredRequired": 150,
    "cost": 3000,
    "maxDaily": 2,
    "effects": {
      "add_bonus_roll": 2,
      "skill": "stealth"
    }
  },
  {
    "id": "netrunner-fantome-patch-combat",
    "vendor": "netrunner_fantome",
    "name": "Patch de Combat",
    "description": "Cocktail de stimulants et d'adrénaline de synthèse. +2 au prochain test de Combat. Usage unique.",
    "type": "one_shot",
    "rarity": "uncommon",
    "streetCredRequired": 150,
    "cost": 3000,
    "maxDaily": 2,
    "effects": {
      "add_bonus_roll": 2,
      "skill": "combat"
    }
  },
  {
    "id": "netrunner-fantome-analyseur-contrat",
    "vendor": "netrunner_fantome",
    "name": "Analyseur de Contrat",
    "description": "Un programme d'analyse de risque complet. Révèle toutes les compétences testées d'un contrat avant son acceptation.",
    "type": "one_shot",
    "rarity": "uncommon",
    "streetCredRequired": 200,
    "cost": 4000,
    "maxDaily": 1,
    "effects": {
      "reveal_all_skills": true
    }
  },
  {
    "id": "netrunner-fantome-decharge-iem",
    "vendor": "netrunner_fantome",
    "name": "Décharge IEM",
    "description": "Surcharge les systèmes cibles, les rendant plus vulnérables. Réduit la difficulté de tous les tests de compétence d'un contrat de -1.",
    "type": "one_shot",
    "rarity": "rare",
    "streetCredRequired": 500,
    "cost": 7000,
    "maxDaily": 1,
    "effects": {
      "reduce_difficulty": 1
    }
  },
  {
    "id": "netrunner-fantome-brise-glace",
    "vendor": "netrunner_fantome",
    "name": "Virus 'Brise-Glace'",
    "description": "Un puissant virus qui exploite une faille connue. Garantit le succès d'UN test de compétence (le plus difficile) sur un contrat.",
    "type": "one_shot",
    "rarity": "rare",
    "streetCredRequired": 600,
    "cost": 9000,
    "maxDaily": 1,
    "effects": {
      "guarantee_one_success": true
    }
  },
  {
    "id": "netrunner-fantome-zero-day",
    "vendor": "netrunner_fantome",
    "name": "Virus 'Zero Day'",
    "description": "Un exploit de faille inconnue, une véritable clé passe-partout. Garantit le succès de TOUS les tests de compétence d'une mission.",
    "type": "one_shot",
    "rarity": "legendary",
    "streetCredRequired": 1200,
    "cost": 20000,
    "isSignature": true,
    "stock": 2,
    "maxDaily": 1,
    "effects": {
      "guarantee_all_success": true
    }
  },
  {
    "id": "netrunner-fantome-blackwall",
    "vendor": "netrunner_fantome",
    "name": "Fragment du 'Blackwall'",
    "description": "Une fraction d'un code ancien et terrifiant. Succès garanti sur tous les tests, et un bonus de +5 à tous les jets. Personne ne sait comment ça marche. Mieux vaut ne pas poser de questions.",
    "type": "one_shot",
    "rarity": "legendary",
    "streetCredRequired": 1500,
    "cost": 35000,
    "isSignature": true,
    "stock": 1,
    "maxDaily": 1,
    "effects": {
      "guarantee_all_success": true,
      "add_bonus_roll": 5,
      "skill": "all"
    }
  },

  // === INFORMATRICE - INFORMATIONS ===
  {
    "id": "informatrice-datashard-fixer",
    "vendor": "informatrice",
    "name": "Datashard d'un Fixer Rival",
    "description": "Contient le 'black book' d'un petit Fixer. Le décrypter donne un gain de réputation immédiat.",
    "type": "information",
    "rarity": "uncommon",
    "streetCredRequired": 100,
    "cost": 2500,
    "maxDaily": 2,
    "effects": {
      "instant_reputation_gain": 50
    }
  },
  {
    "id": "informatrice-datashard-corpo",
    "vendor": "informatrice",
    "name": "Datashard de Secrets Corpo",
    "description": "Informations compromettantes sur un cadre d'une corporation. Débloque un contrat d'extorsion exclusif, très lucratif.",
    "type": "information",
    "rarity": "rare",
    "streetCredRequired": 500,
    "cost": 10000,
    "maxDaily": 1,
    "effects": {
      "unlock_corpo_contract": true
    }
  },
  {
    "id": "informatrice-datashard-gang",
    "vendor": "informatrice",
    "name": "Coordonnées d'une Planque de Gang",
    "description": "La localisation d'un entrepôt de contrebande des Valentinos. Débloque un contrat d'assaut exclusif.",
    "type": "information",
    "rarity": "rare",
    "streetCredRequired": 400,
    "cost": 8000,
    "maxDaily": 1,
    "effects": {
      "unlock_gang_contract": true
    }
  },

  // === ANARCHISTE - SABOTAGE ===
  {
    "id": "anarchiste-virus-verrou",
    "vendor": "anarchiste",
    "name": "Virus 'Verrou'",
    "description": "À appliquer sur un contrat PUBLIC. Augmente sa difficulté de +2 pendant 1h TRP, le rendant trop difficile pour les Fixers rivaux.",
    "type": "sabotage",
    "rarity": "uncommon",
    "streetCredRequired": 200,
    "cost": 1500,
    "maxDaily": 3,
    "effects": {
      "sabotage_difficulty_up": 2,
      "duration_trp": 3600
    }
  },
  {
    "id": "anarchiste-datalink-bruite",
    "vendor": "anarchiste",
    "name": "Datalink 'Bruité'",
    "description": "À appliquer sur un contrat DÉJÀ ASSIGNÉ par un autre joueur. Place une 'prime' dessus. Si son runner échoue, vous touchez 20% de sa perte de réputation en eddies.",
    "type": "sabotage",
    "rarity": "rare",
    "streetCredRequired": 400,
    "cost": 3000,
    "maxDaily": 2,
    "effects": {
      "sabotage_bounty": true
    }
  },
  {
    "id": "anarchiste-faux-temoignage",
    "vendor": "anarchiste",
    "name": "Faux Témoignage Numérique",
    "description": "À utiliser après qu'un autre joueur a réussi une mission. Implique son runner dans une autre affaire, augmentant le 'Niveau de Menace' de la faction cible contre lui.",
    "type": "sabotage",
    "rarity": "rare",
    "streetCredRequired": 600,
    "cost": 5000,
    "maxDaily": 1,
    "effects": {
      "sabotage_threat_up": true
    }
  }
];

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