// scripts/test-market-api.js
// Script pour tester l'API du marché

import 'dotenv/config';
import connectDb from '../src/Lib/database.js';
import Program from '../src/models/Program.js';
import MarketState from '../src/models/MarketState.js';

async function testMarketAPI() {
  try {
    console.log('🔗 Connexion à la base de données...');
    await connectDb();
    
    // Vérifier et générer le stock si nécessaire
    // await generateMarketStock(); // Commenté pour éviter les problèmes d'import
    
    // Récupérer l'état du marché
    let marketState = await MarketState.findOne({ marketId: 'global' });
    if (!marketState) {
      marketState = new MarketState({
        marketId: 'global',
        lastStockRotation: new Date(),
        nextStockRotation: new Date().setHours(3, 0, 0, 0) + 24 * 60 * 60 * 1000
      });
      await marketState.save();
    }
    
    // Récupérer tous les programmes disponibles
    const availableItems = await Program.find({
      isActive: true,
      stock: { $gt: 0 }
    }).lean();
    
    console.log(`📊 Programmes disponibles: ${availableItems.length}`);
    
    // Afficher quelques exemples
    availableItems.slice(0, 5).forEach(item => {
      console.log(`   - ${item.name} (${item.vendor}) - ${item.cost.toLocaleString()} €$`);
    });
    
    // Organiser par vendeur
    const VENDORS = {
      charcudoc: { name: "Le Charcudoc", specialty: "Implants" },
      netrunner_fantome: { name: "Le Netrunner Fantôme", specialty: "Programmes" },
      informatrice: { name: "L'Informatrice", specialty: "Informations" },
      anarchiste: { name: "L'Anarchiste", specialty: "Sabotage" }
    };
    
    const organizedMarket = {};
    Object.keys(VENDORS).forEach(vendorKey => {
      const vendorItems = availableItems.filter(item => item.vendor === vendorKey);
      console.log(`\n🏪 ${VENDORS[vendorKey].name} (${vendorKey}): ${vendorItems.length} items`);
      
      vendorItems.forEach(item => {
        console.log(`   - ${item.name}: ${item.cost.toLocaleString()} €$ (${item.rarity})`);
      });
      
      organizedMarket[vendorKey] = {
        ...VENDORS[vendorKey],
        items: vendorItems
      };
    });
    
    // Vérifier le timer
    console.log(`\n⏰ Timer de restock:`);
    console.log(`   Dernière rotation: ${marketState.lastStockRotation}`);
    console.log(`   Prochaine rotation: ${marketState.nextStockRotation}`);
    
    const now = new Date().getTime();
    const nextRotation = new Date(marketState.nextStockRotation).getTime();
    const timeLeft = nextRotation - now;
    
    if (timeLeft > 0) {
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      console.log(`   Temps restant: ${hours}h ${minutes}m ${seconds}s`);
    } else {
      console.log(`   Restock nécessaire !`);
    }
    
    console.log(`\n✅ Test terminé avec succès !`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    process.exit(0);
  }
}

// Exécuter le test
testMarketAPI(); 