import 'dotenv/config';
import connectDb from '../src/Lib/database.js';
import Program from '../src/models/Program.js';

async function adjustProgramStocks() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await connectDb();
    console.log('✅ Connecté à MongoDB');

    // Définir les stocks selon la rareté et le type
    const stockRules = {
      // Programmes one-shot
      'one_shot': {
        'common': { stock: 10, maxStock: 10 },      // Très disponibles
        'uncommon': { stock: 5, maxStock: 5 },      // Disponibles
        'rare': { stock: 3, maxStock: 3 },          // Limités
        'epic': { stock: 2, maxStock: 2 },          // Très limités
        'legendary': { stock: 1, maxStock: 1 }      // Uniques (sauf Signature)
      },
      // Implants (toujours limités car permanents)
      'implant': {
        'common': { stock: 3, maxStock: 3 },
        'uncommon': { stock: 2, maxStock: 2 },
        'rare': { stock: 1, maxStock: 1 },
        'epic': { stock: 1, maxStock: 1 },
        'legendary': { stock: 1, maxStock: 1 }
      },
      // Informations (limitées car spéciales)
      'information': {
        'common': { stock: 5, maxStock: 5 },
        'uncommon': { stock: 3, maxStock: 3 },
        'rare': { stock: 2, maxStock: 2 },
        'epic': { stock: 1, maxStock: 1 },
        'legendary': { stock: 1, maxStock: 1 }
      },
      // Sabotage (très limités car puissants)
      'sabotage': {
        'common': { stock: 3, maxStock: 3 },
        'uncommon': { stock: 2, maxStock: 2 },
        'rare': { stock: 1, maxStock: 1 },
        'epic': { stock: 1, maxStock: 1 },
        'legendary': { stock: 1, maxStock: 1 }
      }
    };

    // Récupérer tous les programmes
    const programs = await Program.find({});
    console.log(`📦 ${programs.length} programmes trouvés`);

    let updated = 0;

    for (const program of programs) {
      const rule = stockRules[program.type]?.[program.rarity];
      
      if (rule) {
        // Ne pas modifier les objets Signature (ils ont déjà leur stock défini)
        if (!program.isSignature) {
          const oldStock = program.stock;
          const oldMaxStock = program.maxStock;
          
          program.stock = rule.stock;
          program.maxStock = rule.maxStock;
          
          await program.save();
          updated++;
          
          console.log(`✅ ${program.name} (${program.rarity} ${program.type}): ${oldStock}→${rule.stock} stock`);
        } else {
          console.log(`⏭️  ${program.name}: Objet Signature, stock conservé (${program.stock})`);
        }
      } else {
        console.log(`⚠️  ${program.name}: Règle non trouvée pour ${program.type}/${program.rarity}`);
      }
    }

    console.log(`\n📊 Résumé: ${updated} programmes mis à jour`);

    // Afficher quelques exemples
    console.log('\n📋 Exemples de stocks ajustés:');
    const examples = await Program.find().limit(10);
    examples.forEach(prog => {
      console.log(`   - ${prog.name}: ${prog.stock}/${prog.maxStock} (${prog.rarity} ${prog.type})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    console.log('🔌 Déconnecté de MongoDB');
  }
}

adjustProgramStocks(); 