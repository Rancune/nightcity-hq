// scripts/init-program-database.js
// Script pour initialiser la base de données avec tous les programmes du catalogue

import 'dotenv/config';
import connectDb from '../src/Lib/database.js';
import Program from '../src/models/Program.js';
import fs from 'fs';
import path from 'path';

// Lire le catalogue depuis le fichier JSON
const catalogPath = path.join(process.cwd(), 'src', 'data', 'program-catalog.json');
const PROGRAM_CATALOG = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

async function initProgramDatabase() {
  try {
    console.log('🔗 Connexion à la base de données...');
    await connectDb();
    
    console.log('📊 Initialisation de la base de données avec les programmes...');
    
    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    // Parcourir tous les programmes du catalogue
    for (const catalogItem of PROGRAM_CATALOG) {
      try {
        // Vérifier si le programme existe déjà par marketId
        let program = await Program.findOne({ marketId: catalogItem.id });
        
        if (program) {
          // Mettre à jour le programme existant
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
          
          await Program.updateOne(
            { _id: program._id },
            { $set: updates }
          );
          
          console.log(`🔄 Mis à jour: ${catalogItem.name} (${catalogItem.cost.toLocaleString()} €$)`);
          updatedCount++;
        } else {
          // Créer un nouveau programme
          const newProgram = new Program({
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
            marketId: catalogItem.id,
            isSignature: catalogItem.isSignature || false,
            stock: catalogItem.stock || 1,
            maxStock: catalogItem.maxStock || 1,
            maxDaily: catalogItem.maxDaily || null,
            isActive: true
          });
          
          await newProgram.save();
          console.log(`✅ Créé: ${catalogItem.name} (${catalogItem.cost.toLocaleString()} €$)`);
          createdCount++;
        }
      } catch (error) {
        console.error(`❌ Erreur lors du traitement de ${catalogItem.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📈 Résumé de l\'initialisation:');
    console.log(`✅ Programmes créés: ${createdCount}`);
    console.log(`🔄 Programmes mis à jour: ${updatedCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📊 Total dans le catalogue: ${PROGRAM_CATALOG.length}`);
    
    // Afficher quelques exemples
    console.log('\n💰 Exemples de programmes dans la base:');
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
    
    // Vérifier le nombre total de programmes en base
    const totalInDb = await Program.countDocuments();
    console.log(`\n📊 Total de programmes en base de données: ${totalInDb}`);
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    process.exit(0);
  }
}

// Exécuter le script
initProgramDatabase(); 