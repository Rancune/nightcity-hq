import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import PlayerProfile from '@/models/PlayerProfile';
import PlayerInventory from '@/models/PlayerInventory';
import Program from '@/models/Program';
import MarketState from '@/models/MarketState';

// Catalogue complet du marché noir (copie de l'API programs)
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
    "effects": {
      "sabotage_threat_up": true
    }
  }
];

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
      playerInventory = new PlayerInventory({ clerkId: userId });
    }

    // Récupérer l'état du marché
    let marketState = await MarketState.findOne({ marketId: 'global' });
    if (!marketState) {
      marketState = new MarketState({ marketId: 'global' });
      await marketState.save();
    }

    // Trouver l'objet dans le catalogue local
    const targetItem = MARKET_CATALOG.find(item => item.id === itemId);
    if (!targetItem) {
      return new NextResponse("Objet non trouvé ou non disponible", { status: 404 });
    }

    // Vérifier le Street Cred
    if (targetItem.streetCredRequired > playerProfile.reputationPoints) {
      return new NextResponse("Street Cred insuffisant pour cet objet", { status: 403 });
    }

    // Vérifier les fonds
    if (playerProfile.eddies < targetItem.cost) {
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
    const maxDaily = targetItem.maxDaily || 1; // Limite par défaut : 1 par jour
    
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
        rarity: targetItem.rarity,
        category: targetItem.type,
        price: targetItem.cost,
        effects: targetItem.effects,
        marketId: itemId,
        vendor: targetItem.vendor
      });
      await program.save();
    }

    // Déduire le coût
    playerProfile.eddies -= targetItem.cost;

    // Ajouter à l'inventaire
    playerInventory.oneShotPrograms.push({
      programId: program._id,
      purchasedAt: new Date()
    });

    // Réduire le stock si c'est un objet Signature
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