// scripts/test-implant-installation.js
// Script pour tester l'installation d'implants

import 'dotenv/config';
import connectDb from '../src/Lib/database.js';
import PlayerProfile from '../src/models/PlayerProfile.js';
import PlayerInventory from '../src/models/PlayerInventory.js';
import Netrunner from '../src/models/Netrunner.js';
import Program from '../src/models/Program.js';

async function testImplantInstallation() {
  try {
    console.log('🔗 Connexion à la base de données...');
    await connectDb();
    
    // Créer un profil de test si nécessaire
    const testUserId = 'test-user-implant-install';
    let playerProfile = await PlayerProfile.findOne({ clerkId: testUserId });
    
    if (!playerProfile) {
      playerProfile = new PlayerProfile({
        clerkId: testUserId,
        handle: 'test-user',
        name: 'Test User',
        eddies: 100000, // 100k eddies
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
    
    // Créer un runner de test si nécessaire
    let testRunner = await Netrunner.findOne({ ownerId: testUserId });
    if (!testRunner) {
      testRunner = new Netrunner({
        name: 'Test Runner',
        ownerId: testUserId,
        skills: {
          hacking: 3,
          stealth: 4,
          combat: 2
        },
        level: 1,
        status: 'Disponible',
        installedImplants: []
      });
      await testRunner.save();
      console.log('✅ Runner de test créé');
    } else {
      console.log('✅ Runner de test trouvé');
    }
    
    // Trouver un implant à acheter et installer
    const testImplant = await Program.findOne({ type: 'implant' });
    if (!testImplant) {
      console.log('❌ Aucun implant trouvé pour le test');
      return;
    }
    
    console.log(`\n🔧 Test d'achat et installation de: ${testImplant.name}`);
    console.log(`   Coût: ${testImplant.cost.toLocaleString()} €$`);
    console.log(`   Street Cred requis: ${testImplant.streetCredRequired}`);
    console.log(`   Boost permanent: ${testImplant.permanent_skill_boost?.skill} +${testImplant.permanent_skill_boost?.value}`);
    
    // Simuler l'achat de l'implant
    if (playerProfile.eddies >= testImplant.cost && playerProfile.reputationPoints >= testImplant.streetCredRequired) {
      // Déduire le coût
      playerProfile.eddies -= testImplant.cost;
      
      // Ajouter à l'inventaire
      playerInventory.addImplant(testImplant._id);
      playerInventory.addPurchase(testImplant._id, testImplant.cost);
      
      await playerProfile.save();
      await playerInventory.save();
      
      console.log('✅ Implant acheté avec succès !');
      console.log(`   Fonds restants: ${playerProfile.eddies.toLocaleString()} €$`);
      
      // Vérifier que l'implant est dans l'inventaire
      const updatedInventory = await PlayerInventory.findOne({ clerkId: testUserId });
      const hasImplant = updatedInventory.implants.some(item => 
        item.programId.equals(testImplant._id) && item.quantity > 0
      );
      
      if (hasImplant) {
        console.log('✅ Implant confirmé dans l\'inventaire');
        
        // Simuler l'installation de l'implant
        console.log(`\n🔧 Test d'installation de l'implant sur ${testRunner.name}`);
        console.log(`   Compétences avant: H:${testRunner.skills.hacking} S:${testRunner.skills.stealth} C:${testRunner.skills.combat}`);
        
        // Coût de pose
        const INSTALLATION_COST = 2000;
        
        if (playerProfile.eddies >= INSTALLATION_COST) {
          // Déduire le coût de pose
          playerProfile.eddies -= INSTALLATION_COST;
          
          // Installer l'implant sur le runner
          if (!testRunner.installedImplants) {
            testRunner.installedImplants = [];
          }
          
          testRunner.installedImplants.push({
            programId: testImplant._id,
            installedAt: new Date()
          });
          
          // Appliquer les effets de l'implant
          const permanentBoost = testImplant.permanent_skill_boost;
          if (permanentBoost && permanentBoost.skill && permanentBoost.value) {
            const skill = permanentBoost.skill.toLowerCase();
            const boost = permanentBoost.value;
            if (testRunner.skills[skill] !== undefined) {
              testRunner.skills[skill] = Math.min(10, testRunner.skills[skill] + boost);
              console.log(`✅ Boost appliqué: +${boost} à ${skill}`);
            }
          }
          
          // Retirer l'implant de l'inventaire
          const implantIndex = updatedInventory.implants.findIndex(item => 
            item.programId.equals(testImplant._id) && item.quantity > 0
          );
          
          if (implantIndex !== -1) {
            const implantItem = updatedInventory.implants[implantIndex];
            implantItem.quantity -= 1;
            
            if (implantItem.quantity <= 0) {
              updatedInventory.implants.splice(implantIndex, 1);
            }
            
            // Ajouter à l'inventaire des implants installés
            if (!updatedInventory.installedImplants) {
              updatedInventory.installedImplants = [];
            }
            
            updatedInventory.installedImplants.push({
              runnerId: testRunner._id,
              programId: testImplant._id,
              installedAt: new Date()
            });
            
            // Sauvegarder
            await Promise.all([
              testRunner.save(),
              updatedInventory.save(),
              playerProfile.save()
            ]);
            
            console.log('✅ Implant installé avec succès !');
            console.log(`   Compétences après: H:${testRunner.skills.hacking} S:${testRunner.skills.stealth} C:${testRunner.skills.combat}`);
            console.log(`   Fonds restants: ${playerProfile.eddies.toLocaleString()} €$`);
            console.log(`   Implants installés: ${testRunner.installedImplants.length}`);
            
            // Vérifier l'inventaire final
            const finalInventory = await PlayerInventory.findOne({ clerkId: testUserId });
            console.log(`\n📊 Inventaire final:`);
            console.log(`   Implants disponibles: ${finalInventory.implants.length}`);
            console.log(`   Implants installés: ${finalInventory.installedImplants.length}`);
            
          } else {
            console.log('❌ Erreur: Implant non trouvé dans l\'inventaire');
          }
          
        } else {
          console.log('❌ Fonds insuffisants pour la pose (2,000 €$ requis)');
        }
        
      } else {
        console.log('❌ Erreur: Implant non trouvé dans l\'inventaire après achat');
      }
      
    } else {
      console.log('❌ Conditions d\'achat non remplies');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    process.exit(0);
  }
}

// Exécuter le test
testImplantInstallation(); 