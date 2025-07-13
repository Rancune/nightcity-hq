// scripts/debug-bonus-system.js
// Script de debug pour tracer le système de bonus de compétences

import connectDb from '../src/Lib/database.js';
import Contract from '../src/models/Contract.js';
import Program from '../src/models/Program.js';

const DEBUG_CONFIG = {
  contractId: null, // Sera rempli manuellement
  userId: null, // Sera rempli manuellement
};

async function debugBonusSystem() {
  console.log('🔍 Debug du système de bonus de compétences\n');
  
  try {
    await connectDb();
    
    // 1. Vérifier les programmes avec bonus
    console.log('1️⃣ Vérification des programmes avec bonus...');
    const bonusPrograms = await Program.find({
      'effects.add_bonus_roll': { $gt: 0 }
    }).lean();
    
    console.log(`   ${bonusPrograms.length} programmes avec bonus trouvés:`);
    bonusPrograms.forEach(program => {
      console.log(`   - ${program.name}: +${program.effects.add_bonus_roll} (skill: ${program.effects.skill || 'non spécifié'})`);
    });
    console.log();
    
    // 2. Vérifier un contrat spécifique si fourni
    if (DEBUG_CONFIG.contractId) {
      console.log('2️⃣ Vérification du contrat spécifique...');
      const contract = await Contract.findById(DEBUG_CONFIG.contractId).lean();
      
      if (contract) {
        console.log(`   Contrat: ${contract.title}`);
        console.log(`   Compétences requises:`, contract.requiredSkills);
        console.log(`   Effets actifs:`, contract.activeProgramEffects);
        
        if (DEBUG_CONFIG.userId && contract.activeProgramEffects) {
          const userEffects = contract.activeProgramEffects.find(e => e.clerkId === DEBUG_CONFIG.userId);
          console.log(`   Effets pour l'utilisateur ${DEBUG_CONFIG.userId}:`, userEffects?.effects);
          console.log(`   skillBonuses:`, userEffects?.effects?.skillBonuses);
        }
      } else {
        console.log('   Contrat non trouvé');
      }
      console.log();
    }
    
    // 3. Vérifier tous les contrats avec des effets actifs
    console.log('3️⃣ Vérification de tous les contrats avec effets actifs...');
    const contractsWithEffects = await Contract.find({
      'activeProgramEffects.0': { $exists: true }
    }).lean();
    
    console.log(`   ${contractsWithEffects.length} contrats avec effets actifs:`);
    contractsWithEffects.forEach(contract => {
      console.log(`   - ${contract.title} (${contract._id}):`);
      contract.activeProgramEffects.forEach(effect => {
        console.log(`     Utilisateur ${effect.clerkId}:`, effect.effects);
        if (effect.effects.skillBonuses) {
          console.log(`       skillBonuses:`, effect.effects.skillBonuses);
        }
      });
    });
    console.log();
    
    // 4. Statistiques des bonus par compétence
    console.log('4️⃣ Statistiques des bonus par compétence...');
    const allEffects = await Contract.aggregate([
      { $unwind: '$activeProgramEffects' },
      { $group: {
        _id: null,
        totalHacking: { $sum: '$activeProgramEffects.effects.skillBonuses.hacking' },
        totalStealth: { $sum: '$activeProgramEffects.effects.skillBonuses.stealth' },
        totalCombat: { $sum: '$activeProgramEffects.effects.skillBonuses.combat' }
      }}
    ]);
    
    if (allEffects.length > 0) {
      console.log('   Total des bonus appliqués:');
      console.log(`   - Hacking: ${allEffects[0].totalHacking || 0}`);
      console.log(`   - Stealth: ${allEffects[0].totalStealth || 0}`);
      console.log(`   - Combat: ${allEffects[0].totalCombat || 0}`);
    }
    console.log();
    
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  }
  
  process.exit(0);
}

// Instructions d'utilisation
console.log('📋 Instructions d\'utilisation:');
console.log('1. Modifiez DEBUG_CONFIG.contractId avec l\'ID du contrat à vérifier');
console.log('2. Modifiez DEBUG_CONFIG.userId avec l\'ID de l\'utilisateur à vérifier');
console.log('3. Lancez: node scripts/debug-bonus-system.js');
console.log();

debugBonusSystem(); 