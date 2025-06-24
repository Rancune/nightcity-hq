import Program from '@/models/Program';
import connectDb from '@/Lib/database';

// Catalogue de programmes disponibles
const PROGRAM_CATALOG = {
  one_shot: [
    {
      name: "Virus 'Brise-Glace'",
      description: "Garantit le succès d'un test de compétence. Utilisation unique.",
      rarity: "rare",
      reputationRequired: 100,
      price: 2500,
      effects: { skip_skill_check: true },
      vendorMessage: "ICE breaker de qualité. Un seul usage, mais garanti."
    },
    {
      name: "Booster 'Sandevistan'",
      description: "Ajoute +3 à un jet de compétence. Utilisation unique.",
      rarity: "uncommon",
      reputationRequired: 50,
      price: 1500,
      effects: { add_bonus_roll: 3 },
      vendorMessage: "Accélération temporaire. Risque de surchauffe."
    },
    {
      name: "Logiciel 'Mouchard'",
      description: "Révèle une compétence requise d'un contrat avant acceptation.",
      rarity: "common",
      reputationRequired: 0,
      price: 800,
      effects: { reveal_skill: true },
      vendorMessage: "Espionnage de base. Informations précieuses."
    },
    {
      name: "Décharge IEM",
      description: "Réduit la difficulté de tous les tests d'un contrat de -1.",
      rarity: "uncommon",
      reputationRequired: 75,
      price: 2000,
      effects: { reduce_difficulty: 1 },
      vendorMessage: "Perturbation électromagnétique. Effet global."
    }
  ],
  implant: [
    {
      name: "Implant Neural 'HackMaster'",
      description: "Augmente définitivement le Hacking d'un runner de +1.",
      rarity: "rare",
      reputationRequired: 200,
      price: 8000,
      effects: { permanent_skill_boost: { skill: 'hacking', value: 1 } },
      vendorMessage: "Amélioration permanente. Installation risquée."
    },
    {
      name: "Implant Neural 'Shadow'",
      description: "Augmente définitivement le Stealth d'un runner de +1.",
      rarity: "rare",
      reputationRequired: 200,
      price: 8000,
      effects: { permanent_skill_boost: { skill: 'stealth', value: 1 } },
      vendorMessage: "Discrétion améliorée. Invisibilité relative."
    },
    {
      name: "Implant Neural 'Warrior'",
      description: "Augmente définitivement le Combat d'un runner de +1.",
      rarity: "rare",
      reputationRequired: 200,
      price: 8000,
      effects: { permanent_skill_boost: { skill: 'combat', value: 1 } },
      vendorMessage: "Combat amélioré. Réflexes augmentés."
    }
  ],
  information: [
    {
      name: "Datashard 'Corpo Secrets'",
      description: "Débloque un contrat exclusif très lucratif.",
      rarity: "legendary",
      reputationRequired: 300,
      price: 15000,
      effects: { unlocks_contract: true },
      vendorMessage: "Informations exclusives. Contrat de haut niveau."
    },
    {
      name: "Datashard 'Underground Network'",
      description: "Débloque un contrat de gang exclusif.",
      rarity: "rare",
      reputationRequired: 150,
      price: 10000,
      effects: { unlocks_contract: true },
      vendorMessage: "Réseau souterrain. Contacts exclusifs."
    }
  ]
};

// Programmes signature (ventes flash)
const SIGNATURE_PROGRAMS = [
  {
    name: "Prototype ICE 'Blackwall'",
    description: "ICE expérimental de nouvelle génération. Très instable mais puissant.",
    category: "signature",
    rarity: "legendary",
    reputationRequired: 500,
    price: 25000,
    stock: 2,
    maxStock: 2,
    effects: { skip_skill_check: true, add_bonus_roll: 5 },
    vendorMessage: "Prototype Blackwall. Seulement 2 disponibles. Fais vite.",
    isSignature: true
  },
  {
    name: "Virus 'Zero Day'",
    description: "Exploit zero-day. Garantit le succès de tous les tests d'une mission.",
    category: "signature",
    rarity: "legendary",
    reputationRequired: 400,
    price: 20000,
    stock: 1,
    maxStock: 1,
    effects: { skip_skill_check: true },
    vendorMessage: "Zero-day exploit. Unique en son genre. Prix de la rareté.",
    isSignature: true
  }
];

// Fonction pour générer le stock du marché
export async function generateMarketStock() {
  try {
    await connectDb();
    
    console.log('[MARKET] Début de la génération du stock...');
    
    // Vérifier si une rotation est nécessaire (toutes les 24h TRP)
    const lastRotation = await Program.findOne().sort({ rotationExpiry: -1 });
    const now = new Date();
    const rotationDuration = 24 * 60 * 60 * 1000; // 24h en millisecondes
    
    console.log('[MARKET] Vérification de la rotation...');
    console.log('[MARKET] Dernière rotation:', lastRotation?.rotationExpiry);
    console.log('[MARKET] Maintenant:', now);
    
    if (lastRotation && lastRotation.rotationExpiry && lastRotation.rotationExpiry > now) {
      // Rotation pas encore nécessaire
      console.log('[MARKET] Rotation pas encore nécessaire');
      return;
    }

    console.log('[MARKET] Génération d\'un nouveau stock...');

    // Désactiver l'ancien stock
    await Program.updateMany(
      { isActive: true },
      { isActive: false }
    );

    // Générer le nouveau stock
    const newStock = [];
    
    // Ajouter des programmes one-shot (3-5 items)
    const oneShotCount = Math.floor(Math.random() * 3) + 3;
    console.log(`[MARKET] Génération de ${oneShotCount} programmes one-shot...`);
    
    for (let i = 0; i < oneShotCount; i++) {
      const program = PROGRAM_CATALOG.one_shot[Math.floor(Math.random() * PROGRAM_CATALOG.one_shot.length)];
      const stock = Math.floor(Math.random() * 5) + 1;
      
      newStock.push({
        ...program,
        stock,
        maxStock: stock,
        rotationExpiry: new Date(now.getTime() + rotationDuration)
      });
    }

    // Ajouter des implants (1-2 items)
    const implantCount = Math.floor(Math.random() * 2) + 1;
    console.log(`[MARKET] Génération de ${implantCount} implants...`);
    
    for (let i = 0; i < implantCount; i++) {
      const program = PROGRAM_CATALOG.implant[Math.floor(Math.random() * PROGRAM_CATALOG.implant.length)];
      
      newStock.push({
        ...program,
        stock: 1,
        maxStock: 1,
        rotationExpiry: new Date(now.getTime() + rotationDuration)
      });
    }

    // Ajouter des informations (0-1 item)
    if (Math.random() < 0.3) {
      console.log('[MARKET] Génération d\'une information...');
      const program = PROGRAM_CATALOG.information[Math.floor(Math.random() * PROGRAM_CATALOG.information.length)];
      
      newStock.push({
        ...program,
        stock: 1,
        maxStock: 1,
        rotationExpiry: new Date(now.getTime() + rotationDuration)
      });
    }

    // Ajouter un programme signature (20% de chance)
    if (Math.random() < 0.2) {
      console.log('[MARKET] Génération d\'un programme signature...');
      const signature = SIGNATURE_PROGRAMS[Math.floor(Math.random() * SIGNATURE_PROGRAMS.length)];
      const signatureExpiry = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2h pour les signatures
      
      newStock.push({
        ...signature,
        signatureExpiry
      });
    }

    console.log(`[MARKET] ${newStock.length} programmes à créer...`);

    // Validation des programmes avant création
    newStock.forEach((program, index) => {
      if (!program.category) {
        console.error(`[MARKET] ERREUR: Programme ${index} n'a pas de catégorie:`, program.name);
      }
      if (!program.name) {
        console.error(`[MARKET] ERREUR: Programme ${index} n'a pas de nom`);
      }
      if (!program.description) {
        console.error(`[MARKET] ERREUR: Programme ${index} n'a pas de description`);
      }
      if (!program.price) {
        console.error(`[MARKET] ERREUR: Programme ${index} n'a pas de prix`);
      }
    });

    // Créer les programmes en base
    const programs = newStock.map(programData => {
      console.log('[MARKET] Création du programme:', {
        name: programData.name,
        category: programData.category,
        rarity: programData.rarity,
        price: programData.price
      });
      return new Program(programData);
    });
    
    await Program.insertMany(programs);

    console.log(`[MARKET] Nouveau stock généré: ${programs.length} programmes`);
    
  } catch (error) {
    console.error("[MARKET] Erreur lors de la génération du stock:", error);
  }
}

// Fonction pour nettoyer les programmes expirés
export async function cleanupExpiredPrograms() {
  try {
    await connectDb();
    
    const now = new Date();
    
    // Désactiver les programmes expirés
    await Program.updateMany(
      {
        $or: [
          { rotationExpiry: { $lt: now } },
          { signatureExpiry: { $lt: now } }
        ],
        isActive: true
      },
      { isActive: false }
    );
    
  } catch (error) {
    console.error("[MARKET] Erreur lors du nettoyage:", error);
  }
} 