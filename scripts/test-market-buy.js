// scripts/test-market-buy.js
// Script pour tester l'API d'achat de marché

import 'dotenv/config';
import connectDb from '../src/Lib/database.js';
import PlayerProfile from '../src/models/PlayerProfile.js';
import PlayerInventory from '../src/models/PlayerInventory.js';
import Program from '../src/models/Program.js';

async function testMarketBuy() {
  try {
    console.log('🔗 Connexion à la base de données...');
    await connectDb();
    
    // Créer un profil de test si nécessaire
    const testUserId = 'test-user-market-buy';
    let playerProfile = await PlayerProfile.findOne({ clerkId: testUserId });
    
    if (!playerProfile) {
      playerProfile = new PlayerProfile({
        clerkId: testUserId,
        handle: 'test-user',
        name: 'Test User',
        eddies: 1000000, // 1 million d'eddies
        reputationPoints: 100, // 100 Street Cred
        level: 1,
        experience: 0
      });
      await playerProfile.save();
      console.log('✅ Profil de test créé');
    } else {
      console.log('✅ Profil de test trouvé');
    }
    
    // Vérifier l'inventaire
    let playerInventory = await PlayerInventory.findOne({ clerkId: testUserId });
    if (!playerInventory) {
      playerInventory = new PlayerInventory({
        clerkId: testUserId,
        oneShotPrograms: [],
        implants: [],
        installedImplants: [],
        purchasedInformation: [],
        purchaseHistory: []
      });
      await playerInventory.save();
      console.log('✅ Inventaire de test créé');
    } else {
      console.log('✅ Inventaire de test trouvé');
    }
    
    // Trouver un programme à acheter
    const testProgram = await Program.findOne({ type: 'one_shot' });
    if (!testProgram) {
      console.log('❌ Aucun programme one-shot trouvé pour le test');
      return;
    }
    
    console.log(`\n💰 Test d'achat du programme: ${testProgram.name}`);
    console.log(`   Coût: ${testProgram.cost.toLocaleString()} €$`);
    console.log(`   Street Cred requis: ${testProgram.streetCredRequired}`);
    console.log(`   Fonds disponibles: ${playerProfile.eddies.toLocaleString()} €$`);
    console.log(`   Street Cred disponible: ${playerProfile.reputationPoints}`);
    
    // Simuler l'achat
    if (playerProfile.eddies >= testProgram.cost && playerProfile.reputationPoints >= testProgram.streetCredRequired) {
      // Déduire le coût
      playerProfile.eddies -= testProgram.cost;
      
      // Ajouter à l'inventaire
      playerInventory.addOneShotProgram(testProgram._id);
      playerInventory.addPurchase(testProgram._id, testProgram.cost);
      
      // Sauvegarder
      await playerProfile.save();
      await playerInventory.save();
      
      console.log('✅ Achat simulé avec succès !');
      console.log(`   Fonds restants: ${playerProfile.eddies.toLocaleString()} €$`);
      
      // Vérifier l'inventaire
      const updatedInventory = await PlayerInventory.findOne({ clerkId: testUserId });
      console.log(`   Programmes one-shot en inventaire: ${updatedInventory.oneShotPrograms.length}`);
      console.log(`   Total dépensé: ${updatedInventory.totalSpent.toLocaleString()} €$`);
      
    } else {
      console.log('❌ Conditions d\'achat non remplies');
    }
    
    // Test avec un implant
    const testImplant = await Program.findOne({ type: 'implant' });
    if (testImplant) {
      console.log(`\n🔧 Test d'achat de l'implant: ${testImplant.name}`);
      console.log(`   Coût: ${testImplant.cost.toLocaleString()} €$`);
      console.log(`   Street Cred requis: ${testImplant.streetCredRequired}`);
      
      if (playerProfile.eddies >= testImplant.cost && playerProfile.reputationPoints >= testImplant.streetCredRequired) {
        // Déduire le coût
        playerProfile.eddies -= testImplant.cost;
        
        // Ajouter à l'inventaire
        playerInventory.addImplant(testImplant._id);
        playerInventory.addPurchase(testImplant._id, testImplant.cost);
        
        // Sauvegarder
        await playerProfile.save();
        await playerInventory.save();
        
        console.log('✅ Achat d\'implant simulé avec succès !');
        console.log(`   Fonds restants: ${playerProfile.eddies.toLocaleString()} €$`);
        
        // Vérifier l'inventaire
        const updatedInventory = await PlayerInventory.findOne({ clerkId: testUserId });
        console.log(`   Implants en inventaire: ${updatedInventory.implants.length}`);
        console.log(`   Total dépensé: ${updatedInventory.totalSpent.toLocaleString()} €$`);
        
      } else {
        console.log('❌ Conditions d\'achat non remplies pour l\'implant');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    process.exit(0);
  }
}

// Exécuter le test
testMarketBuy(); 