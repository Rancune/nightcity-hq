import Program from '@/models/Program';
import connectDb from '@/Lib/database';
import { PROGRAM_CATALOG, catalogToProgram, getProgramsByType, getSignaturePrograms } from './programCatalog';

// Programmes signature (ventes flash) - maintenant importés depuis le catalogue centralisé
const SIGNATURE_PROGRAMS = getSignaturePrograms();

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
    const oneShotPrograms = getProgramsByType('one_shot');
    const oneShotCount = Math.floor(Math.random() * 3) + 3;
    console.log(`[MARKET] Génération de ${oneShotCount} programmes one-shot...`);
    
    for (let i = 0; i < oneShotCount; i++) {
      const program = oneShotPrograms[Math.floor(Math.random() * oneShotPrograms.length)];
      const stock = Math.floor(Math.random() * 5) + 1;
      
      newStock.push({
        ...catalogToProgram(program),
        stock,
        maxStock: stock,
        rotationExpiry: new Date(now.getTime() + rotationDuration)
      });
    }

    // Ajouter des implants (1-2 items)
    const implantPrograms = getProgramsByType('implant');
    const implantCount = Math.floor(Math.random() * 2) + 1;
    console.log(`[MARKET] Génération de ${implantCount} implants...`);
    
    for (let i = 0; i < implantCount; i++) {
      const program = implantPrograms[Math.floor(Math.random() * implantPrograms.length)];
      
      newStock.push({
        ...catalogToProgram(program),
        stock: 1,
        maxStock: 1,
        rotationExpiry: new Date(now.getTime() + rotationDuration)
      });
    }

    // Ajouter des informations (0-1 item)
    if (Math.random() < 0.3) {
      console.log('[MARKET] Génération d\'une information...');
      const informationPrograms = getProgramsByType('information');
      const program = informationPrograms[Math.floor(Math.random() * informationPrograms.length)];
      
      newStock.push({
        ...catalogToProgram(program),
        stock: 1,
        maxStock: 1,
        rotationExpiry: new Date(now.getTime() + rotationDuration)
      });
    }

    // Ajouter un programme signature (20% de chance)
    if (Math.random() < 0.2 && SIGNATURE_PROGRAMS.length > 0) {
      console.log('[MARKET] Génération d\'un programme signature...');
      const signature = SIGNATURE_PROGRAMS[Math.floor(Math.random() * SIGNATURE_PROGRAMS.length)];
      const signatureExpiry = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2h pour les signatures
      
      newStock.push({
        ...catalogToProgram(signature),
        signatureExpiry
      });
    }

    console.log(`[MARKET] ${newStock.length} programmes à créer...`);

    // Validation des programmes avant création
    newStock.forEach((program, index) => {
      if (!program.type) {
        console.error(`[MARKET] ERREUR: Programme ${index} n'a pas de type:`, program.name);
      }
      if (!program.name) {
        console.error(`[MARKET] ERREUR: Programme ${index} n'a pas de nom`);
      }
      if (!program.description) {
        console.error(`[MARKET] ERREUR: Programme ${index} n'a pas de description`);
      }
      if (!program.cost) {
        console.error(`[MARKET] ERREUR: Programme ${index} n'a pas de coût`);
      }
    });

    // Créer les programmes en base
    const programs = newStock.map(programData => {
      console.log('[MARKET] Création du programme:', {
        name: programData.name,
        type: programData.type,
        rarity: programData.rarity,
        cost: programData.cost
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