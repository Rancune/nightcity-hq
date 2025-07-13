import 'dotenv/config';
import connectDb from '../src/Lib/database.js';
import Program from '../src/models/Program.js';

async function reactivatePrograms() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await connectDb();
    console.log('✅ Connecté à MongoDB');

    // Réactiver tous les programmes et leur donner du stock
    const result = await Program.updateMany(
      {}, // Tous les programmes
      {
        isActive: true,
        stock: 1,
        maxStock: 1
      }
    );

    console.log(`✅ ${result.modifiedCount} programmes réactivés`);

    // Vérification
    const activePrograms = await Program.countDocuments({ isActive: true });
    const totalPrograms = await Program.countDocuments();
    
    console.log(`📊 Total programmes: ${totalPrograms}`);
    console.log(`✅ Programmes actifs: ${activePrograms}`);

    // Afficher quelques exemples
    const examples = await Program.find({ isActive: true }).limit(5);
    console.log('\n📋 Exemples de programmes réactivés:');
    examples.forEach(prog => {
      console.log(`   - ${prog.name} (${prog.marketId}) - Stock: ${prog.stock} - Vendor: ${prog.vendor}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    console.log('🔌 Déconnecté de MongoDB');
  }
}

reactivatePrograms(); 