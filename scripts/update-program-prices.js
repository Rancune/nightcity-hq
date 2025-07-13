// scripts/update-program-prices.js
// Script pour mettre à jour les prix des programmes selon le catalogue centralisé

import 'dotenv/config';
import connectDb from '../src/Lib/database.js';
import Program from '../src/models/Program.js';
import fs from 'fs';
import path from 'path';

// Lire le catalogue depuis le fichier JSON
const catalogPath = path.join(process.cwd(), 'src', 'data', 'program-catalog.json');
const PROGRAM_CATALOG = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

async function updateProgramPrices() {
  try {
    console.log('🔗 Connexion à la base de données...');
    await connectDb();
    
    console.log('📊 Mise à jour des prix des programmes...');
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Parcourir tous les programmes du catalogue
    for (const catalogItem of PROGRAM_CATALOG) {
      try {
        // Trouver le programme dans la base de données par marketId
        const program = await Program.findOne({ marketId: catalogItem.id });
        
        if (program) {
          // Mettre à jour les champs selon le catalogue centralisé
          const updates = {
            name: catalogItem.name,
            description: catalogItem.description,
            type: catalogItem.type,
            rarity: catalogItem.rarity,
            streetCredRequired: catalogItem.streetCredRequired,
            cost: catalogItem.cost,
            effects: catalogItem.effects || {},
            permanent_skill_boost: catalogItem.permanent_skill_boost || null,
            vendorMessage: catalogItem.vendorMessage,
            vendor: catalogItem.vendor,
            isSignature: catalogItem.isSignature || false
          };
          
          // Appliquer les mises à jour
          await Program.updateOne(
            { _id: program._id },
            { $set: updates }
          );
          
          console.log(`✅ Mis à jour: ${catalogItem.name} (${catalogItem.cost} €$)`);
          updatedCount++;
        } else {
          console.log(`⚠️  Programme non trouvé dans la DB: ${catalogItem.name}`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la mise à jour de ${catalogItem.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📈 Résumé de la mise à jour:');
    console.log(`✅ Programmes mis à jour: ${updatedCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📊 Total dans le catalogue: ${PROGRAM_CATALOG.length}`);
    
    // Afficher quelques exemples de prix mis à jour
    console.log('\n💰 Exemples de prix mis à jour:');
    const implants = PROGRAM_CATALOG.filter(p => p.type === 'implant');
    const oneShots = PROGRAM_CATALOG.filter(p => p.type === 'one_shot');
    
    console.log('\n🔧 Implants:');
    implants.slice(0, 3).forEach(implant => {
      console.log(`  - ${implant.name}: ${implant.cost.toLocaleString()} €$`);
    });
    
    console.log('\n💊 Programmes one-shot:');
    oneShots.slice(0, 3).forEach(program => {
      console.log(`  - ${program.name}: ${program.cost.toLocaleString()} €$`);
    });
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    process.exit(0);
  }
}

// Exécuter le script
updateProgramPrices(); 