// scripts/test-inventory-display.js
// Script pour tester l'affichage de l'inventaire après achat

import 'dotenv/config';
import connectDb from '../src/Lib/database.js';
import PlayerProfile from '../src/models/PlayerProfile.js';
import PlayerInventory from '../src/models/PlayerInventory.js';
import Program from '../src/models/Program.js';

async function testInventoryDisplay() {
  try {
    console.log('🔗 Connexion à la base de données...');
    await connectDb();
    
    // Créer un profil de test si nécessaire
    const testUserId = 'test-user-inventory-display';
    let playerProfile = await PlayerProfile.findOne({ clerkId: testUserId });
    
    if (!playerProfile) {
      playerProfile = new PlayerProfile({
        clerkId: testUserId,
        handle: 'test-user',
        name: 'Test User',
        eddies: 1000000, // 1 million d'eddies
        reputationPoints: 200, // 200 Street Cred
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
    
    // Trouver des programmes à acheter
    const testPrograms = await Program.find({ type: 'one_shot' }).limit(3);
    const testImplants = await Program.find({ type: 'implant' }).limit(2);
    
    console.log(`\n💰 Test d'achat de ${testPrograms.length} programmes one-shot et ${testImplants.length} implants`);
    
    // Simuler l'achat des programmes one-shot
    for (const program of testPrograms) {
      console.log(`\n💊 Achat de: ${program.name} (${program.cost.toLocaleString()} €$)`);
      
      if (playerProfile.eddies >= program.cost && playerProfile.reputationPoints >= program.streetCredRequired) {
        // Déduire le coût
        playerProfile.eddies -= program.cost;
        
        // Ajouter à l'inventaire
        playerInventory.addOneShotProgram(program._id);
        playerInventory.addPurchase(program._id, program.cost);
        
        console.log(`✅ Acheté avec succès !`);
        console.log(`   Fonds restants: ${playerProfile.eddies.toLocaleString()} €$`);
      } else {
        console.log(`❌ Conditions d'achat non remplies`);
      }
    }
    
    // Simuler l'achat des implants
    for (const implant of testImplants) {
      console.log(`\n🔧 Achat de: ${implant.name} (${implant.cost.toLocaleString()} €$)`);
      
      if (playerProfile.eddies >= implant.cost && playerProfile.reputationPoints >= implant.streetCredRequired) {
        // Déduire le coût
        playerProfile.eddies -= implant.cost;
        
        // Ajouter à l'inventaire
        playerInventory.addImplant(implant._id);
        playerInventory.addPurchase(implant._id, implant.cost);
        
        console.log(`✅ Acheté avec succès !`);
        console.log(`   Fonds restants: ${playerProfile.eddies.toLocaleString()} €$`);
      } else {
        console.log(`❌ Conditions d'achat non remplies`);
      }
    }
    
    // Sauvegarder les modifications
    await playerProfile.save();
    await playerInventory.save();
    
    // Vérifier l'inventaire final
    const finalInventory = await PlayerInventory.findOne({ clerkId: testUserId });
    console.log(`\n📊 Inventaire final:`);
    console.log(`   Programmes one-shot: ${finalInventory.oneShotPrograms.length}`);
    console.log(`   Implants: ${finalInventory.implants.length}`);
    console.log(`   Total dépensé: ${finalInventory.totalSpent.toLocaleString()} €$`);
    
    // Afficher les détails des programmes one-shot
    console.log(`\n💊 Programmes one-shot en inventaire:`);
    for (const item of finalInventory.oneShotPrograms) {
      const program = await Program.findById(item.programId);
      console.log(`   - ${program.name} (x${item.quantity})`);
    }
    
    // Afficher les détails des implants
    console.log(`\n🔧 Implants en inventaire:`);
    for (const item of finalInventory.implants) {
      const program = await Program.findById(item.programId);
      console.log(`   - ${program.name} (x${item.quantity})`);
    }
    
    // Simuler l'appel à l'API d'inventaire
    console.log(`\n🔍 Test de l'API d'inventaire:`);
    
    // Simuler la récupération des détails comme dans l'API
    const oneShotPrograms = await Promise.all(
      finalInventory.oneShotPrograms.map(async (item) => {
        const program = await Program.findById(item.programId);
        return {
          ...item.toObject(),
          program: program ? {
            _id: program._id,
            name: program.name,
            description: program.description,
            rarity: program.rarity,
            type: program.type,
            effects: program.effects,
            permanent_skill_boost: program.permanent_skill_boost
          } : null
        };
      })
    );
    
    const implants = await Promise.all(
      finalInventory.implants.map(async (item) => {
        const program = await Program.findById(item.programId);
        return {
          ...item.toObject(),
          program: program ? {
            _id: program._id,
            name: program.name,
            description: program.description,
            rarity: program.rarity,
            type: program.type,
            effects: program.effects,
            permanent_skill_boost: program.permanent_skill_boost
          } : null
        };
      })
    );
    
    console.log(`   API - One-shot programmes: ${oneShotPrograms.length}`);
    console.log(`   API - Implants: ${implants.length}`);
    
    // Vérifier que les programmes ont bien les détails
    console.log(`\n✅ Vérification des détails:`);
    oneShotPrograms.forEach(item => {
      console.log(`   - ${item.program?.name}: ${item.program?.type} (${item.program?.rarity})`);
    });
    
    implants.forEach(item => {
      console.log(`   - ${item.program?.name}: ${item.program?.type} (${item.program?.rarity})`);
    });
    
    console.log(`\n🎉 Test terminé avec succès !`);
    console.log(`   L'inventaire devrait maintenant s'afficher correctement dans l'interface.`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    process.exit(0);
  }
}

// Exécuter le test
testInventoryDisplay(); 