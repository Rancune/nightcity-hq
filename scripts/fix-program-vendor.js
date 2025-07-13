import 'dotenv/config';
import connectDb from '../src/Lib/database.js';
import Program from '../src/models/Program.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger le catalogue
const catalogPath = path.join(__dirname, '../src/data/program-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

async function fixProgramVendors() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await connectDb();
    console.log('✅ Connecté à MongoDB');

    console.log(`📦 Chargement du catalogue (${catalog.length} items)...`);

    // Créer un map pour un accès rapide au catalogue
    const catalogMap = new Map();
    catalog.forEach(item => {
      catalogMap.set(item.id, item);
    });

    // Trouver tous les programmes qui n'ont pas de vendor ou qui ont vendor: undefined
    const programsWithoutVendor = await Program.find({
      $or: [
        { vendor: { $exists: false } },
        { vendor: null },
        { vendor: undefined }
      ]
    });

    console.log(`🔍 Trouvé ${programsWithoutVendor.length} programmes sans vendor...`);

    let updated = 0;
    let notFound = 0;

    for (const program of programsWithoutVendor) {
      const catalogItem = catalogMap.get(program.marketId);
      
      if (catalogItem && catalogItem.vendor) {
        program.vendor = catalogItem.vendor;
        await program.save();
        updated++;
        console.log(`✅ Mis à jour: ${program.name} (${program.marketId}) => Vendor: ${catalogItem.vendor}`);
      } else {
        notFound++;
        console.log(`❌ Aucun vendor trouvé pour: ${program.name} (${program.marketId})`);
      }
    }

    console.log('\n📊 Résumé de la correction:');
    console.log(`   ✅ Mis à jour: ${updated}`);
    console.log(`   ❌ Non trouvés: ${notFound}`);
    console.log(`   📦 Total traité: ${programsWithoutVendor.length}`);

    // Vérification finale
    console.log('\n🔍 Vérification finale...');
    const totalPrograms = await Program.countDocuments();
    const programsWithVendor = await Program.countDocuments({ 
      vendor: { $exists: true, $ne: null, $ne: undefined } 
    });
    
    console.log(`   📊 Total programmes en base: ${totalPrograms}`);
    console.log(`   🏪 Programmes avec vendor: ${programsWithVendor}`);
    
    if (programsWithVendor === totalPrograms) {
      console.log('✅ Tous les programmes ont maintenant un vendor défini!');
    } else {
      console.log(`⚠️  Attention: ${totalPrograms - programsWithVendor} programmes n'ont toujours pas de vendor`);
      
      // Afficher les programmes problématiques
      const problematicPrograms = await Program.find({
        $or: [
          { vendor: { $exists: false } },
          { vendor: null },
          { vendor: undefined }
        ]
      });
      
      console.log('\n🚨 Programmes sans vendor:');
      problematicPrograms.forEach(prog => {
        console.log(`   - ${prog.name} (${prog.marketId})`);
      });
    }

    // Afficher quelques exemples pour vérification
    console.log('\n📋 Exemples de programmes avec vendor:');
    const examples = await Program.find({ 
      vendor: { $exists: true, $ne: null, $ne: undefined } 
    }).limit(3);
    
    examples.forEach(prog => {
      console.log(`   - ${prog.name} (${prog.marketId}) - Vendor: ${prog.vendor}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  } finally {
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
if (require.main === module) {
  fixProgramVendors();
}

export default fixProgramVendors; 