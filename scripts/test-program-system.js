// scripts/test-program-system.js
// Script de test pour vérifier le système de programmes avec le nouveau modèle

import connectDb from '../src/Lib/database.js';
import Program from '../src/models/Program.js';
import Netrunner from '../src/models/Netrunner.js';

async function testProgramSystem() {
  console.log('🧪 Test du système de programmes avec le nouveau modèle\n');
  
  try {
    await connectDb();
    
    // 1. Vérifier la structure des programmes
    console.log('1️⃣ Vérification de la structure des programmes...');
    
    const programs = await Program.find({}).lean();
    console.log(`   ${programs.length} programmes trouvés dans la base`);
    
    let validPrograms = 0;
    let invalidPrograms = 0;
    
    for (const program of programs) {
      const hasValidType = program.type && ['one_shot', 'implant', 'information', 'sabotage'].includes(program.type);
      const hasValidCost = program.cost && typeof program.cost === 'number';
      const hasValidStreetCred = program.streetCredRequired !== undefined;
      
      if (hasValidType && hasValidCost && hasValidStreetCred) {
        validPrograms++;
      } else {
        invalidPrograms++;
        console.log(`   ❌ Programme invalide: ${program.name}`);
        console.log(`      - type: ${program.type} (valide: ${hasValidType})`);
        console.log(`      - cost: ${program.cost} (valide: ${hasValidCost})`);
        console.log(`      - streetCredRequired: ${program.streetCredRequired} (valide: ${hasValidStreetCred})`);
      }
    }
    
    console.log(`   ✅ Programmes valides: ${validPrograms}`);
    console.log(`   ❌ Programmes invalides: ${invalidPrograms}`);
    console.log();
    
    // 2. Vérifier les programmes one-shot avec bonus
    console.log('2️⃣ Vérification des programmes one-shot avec bonus...');
    
    const oneShotPrograms = await Program.find({
      type: 'one_shot',
      'effects.add_bonus_roll': { $gt: 0 }
    }).lean();
    
    console.log(`   ${oneShotPrograms.length} programmes one-shot avec bonus trouvés:`);
    
    for (const program of oneShotPrograms) {
      const hasSkill = program.effects.skill && ['hacking', 'stealth', 'combat', 'all'].includes(program.effects.skill);
      console.log(`   - ${program.name}: +${program.effects.add_bonus_roll} (skill: ${program.effects.skill || 'non spécifié'}) ${hasSkill ? '✅' : '❌'}`);
    }
    console.log();
    
    // 3. Vérifier les implants
    console.log('3️⃣ Vérification des implants...');
    
    const implants = await Program.find({
      type: 'implant'
    }).lean();
    
    console.log(`   ${implants.length} implants trouvés:`);
    
    for (const implant of implants) {
      const hasPermanentBoost = implant.permanent_skill_boost && implant.permanent_skill_boost.skill;
      const hasValidSkill = hasPermanentBoost && ['hacking', 'stealth', 'combat', 'all'].includes(implant.permanent_skill_boost.skill);
      console.log(`   - ${implant.name}: ${implant.permanent_skill_boost?.skill || 'non spécifié'} +${implant.permanent_skill_boost?.value || 0} ${hasValidSkill ? '✅' : '❌'}`);
    }
    console.log();
    
    // 4. Vérifier les runners avec implants
    console.log('4️⃣ Vérification des runners avec implants...');
    
    const runners = await Netrunner.find({
      'installedImplants.0': { $exists: true }
    }).lean();
    
    console.log(`   ${runners.length} runners avec implants trouvés:`);
    
    for (const runner of runners) {
      console.log(`   - ${runner.name}: ${runner.installedImplants.length} implants`);
      console.log(`     Compétences: Hacking ${runner.skills.hacking}, Stealth ${runner.skills.stealth}, Combat ${runner.skills.combat}`);
      
      for (const implant of runner.installedImplants) {
        const program = await Program.findById(implant.programId).lean();
        if (program) {
          console.log(`     ✓ ${program.name}: ${program.permanent_skill_boost?.skill || 'non spécifié'} +${program.permanent_skill_boost?.value || 0}`);
        }
      }
    }
    console.log();
    
    // 5. Test de création d'un programme
    console.log('5️⃣ Test de création d\'un programme...');
    
    const testProgram = new Program({
      name: "Test Program",
      description: "Programme de test pour vérifier le modèle",
      type: "one_shot",
      rarity: "common",
      streetCredRequired: 0,
      cost: 1000,
      effects: {
        add_bonus_roll: 2,
        skill: "hacking"
      }
    });
    
    await testProgram.save();
    console.log(`   ✅ Programme de test créé: ${testProgram.name}`);
    
    // Nettoyer le programme de test
    await Program.findByIdAndDelete(testProgram._id);
    console.log(`   🧹 Programme de test supprimé`);
    console.log();
    
    console.log('✅ Tests terminés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    process.exit(0);
  }
}

testProgramSystem(); 