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

async function initializeMarket() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await connectDb();
    console.log('✅ Connecté à MongoDB');

    console.log(`📦 Chargement du catalogue (${catalog.length} items)...`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of catalog) {
      try {
        // Vérifier si le programme existe déjà
        let program = await Program.findOne({ marketId: item.id });
        
        if (!program) {
          // Créer un nouveau programme
          const programData = {
            marketId: item.id,
            vendor: item.vendor,
            name: item.name,
            description: item.description,
            type: item.type,
            rarity: item.rarity,
            streetCredRequired: item.streetCredRequired,
            cost: item.cost,
            stock: item.stock || 1,
            maxStock: item.maxStock || 1,
            effects: item.effects || {},
            permanent_skill_boost: item.permanent_skill_boost || null,
            vendorMessage: item.vendorMessage || '',
            isSignature: item.isSignature || false,
            signatureExpiry: item.signatureExpiry || null,
            rotationExpiry: item.rotationExpiry || null,
            maxDaily: item.maxDaily || null,
            isActive: true,
            timesPurchased: 0
          };

          await Program.create(programData);
          created++;
          console.log(`✅ Créé: ${item.name} (${item.id}) - Vendor: ${item.vendor}`);
        } else {
          // Mettre à jour le programme existant si nécessaire
          let needsUpdate = false;
          
          if (program.vendor !== item.vendor) {
            program.vendor = item.vendor;
            needsUpdate = true;
          }
          
          if (program.name !== item.name) {
            program.name = item.name;
            needsUpdate = true;
          }
          
          if (program.description !== item.description) {
            program.description = item.description;
            needsUpdate = true;
          }
          
          if (program.cost !== item.cost) {
            program.cost = item.cost;
            needsUpdate = true;
          }
          
          if (program.streetCredRequired !== item.streetCredRequired) {
            program.streetCredRequired = item.streetCredRequired;
            needsUpdate = true;
          }
          
          if (program.rarity !== item.rarity) {
            program.rarity = item.rarity;
            needsUpdate = true;
          }
          
          if (program.type !== item.type) {
            program.type = item.type;
            needsUpdate = true;
          }
          
          if (JSON.stringify(program.effects) !== JSON.stringify(item.effects || {})) {
            program.effects = item.effects || {};
            needsUpdate = true;
          }
          
          if (JSON.stringify(program.permanent_skill_boost) !== JSON.stringify(item.permanent_skill_boost || null)) {
            program.permanent_skill_boost = item.permanent_skill_boost || null;
            needsUpdate = true;
          }
          
          if (program.vendorMessage !== (item.vendorMessage || '')) {
            program.vendorMessage = item.vendorMessage || '';
            needsUpdate = true;
          }
          
          if (program.isSignature !== (item.isSignature || false)) {
            program.isSignature = item.isSignature || false;
            needsUpdate = true;
          }
          
          if (program.maxDaily !== (item.maxDaily || null)) {
            program.maxDaily = item.maxDaily || null;
            needsUpdate = true;
          }
          
          if (program.stock !== (item.stock || 1)) {
            program.stock = item.stock || 1;
            needsUpdate = true;
          }
          
          if (program.maxStock !== (item.maxStock || 1)) {
            program.maxStock = item.maxStock || 1;
            needsUpdate = true;
          }

          if (needsUpdate) {
            await program.save();
            updated++;
            console.log(`🔄 Mis à jour: ${item.name} (${item.id}) - Vendor: ${item.vendor}`);
          } else {
            skipped++;
            console.log(`⏭️  Déjà à jour: ${item.name} (${item.id})`);
          }
        }
      } catch (error) {
        console.error(`❌ Erreur avec ${item.name} (${item.id}):`, error.message);
      }
    }

    console.log('\n📊 Résumé de l\'initialisation:');
    console.log(`   ✅ Créés: ${created}`);
    console.log(`   🔄 Mis à jour: ${updated}`);
    console.log(`   ⏭️  Déjà à jour: ${skipped}`);
    console.log(`   📦 Total traité: ${catalog.length}`);

    // Vérification finale
    console.log('\n🔍 Vérification finale...');
    const totalPrograms = await Program.countDocuments();
    const programsWithVendor = await Program.countDocuments({ vendor: { $exists: true, $ne: null } });
    
    console.log(`   📊 Total programmes en base: ${totalPrograms}`);
    console.log(`   🏪 Programmes avec vendor: ${programsWithVendor}`);
    
    if (programsWithVendor === totalPrograms) {
      console.log('✅ Tous les programmes ont un vendor défini!');
    } else {
      console.log(`⚠️  Attention: ${totalPrograms - programsWithVendor} programmes n'ont pas de vendor`);
    }

    // Afficher quelques exemples pour vérification
    console.log('\n📋 Exemples de programmes:');
    const examples = await Program.find().limit(3);
    examples.forEach(prog => {
      console.log(`   - ${prog.name} (${prog.marketId}) - Vendor: ${prog.vendor}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  } finally {
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
if (require.main === module) {
  initializeMarket();
}

export default initializeMarket; 