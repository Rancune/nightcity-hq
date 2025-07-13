// scripts/fix-program-system.js
// Script pour corriger tous les problèmes du système de programmes et d'implants

import connectDb from '../src/Lib/database.js';
import Program from '../src/models/Program.js';
import Netrunner from '../src/models/Netrunner.js';

async function fixProgramSystem() {
  console.log('🔧 Correction du système de programmes et d\'implants\n');
  
  try {
    await connectDb();
    
    // 1. Corriger la structure des programmes dans la base de données
    console.log('1️⃣ Correction de la structure des programmes...');
    
    // Mise à jour des programmes avec skill "hacking"
    const hackingPrograms = await Program.updateMany(
      { 
        "name": { 
          $in: [
            "Implant Neural 'HackMaster' Mk.I",
            "Cortex Quantique 'Kiroshi' Mk.II", 
            "Interface Neurale 'Nexus' Mk.III",
            "Patch de Focus"
          ]
        }
      },
      { 
        $set: { 
          "permanent_skill_boost.skill": "hacking",
          "effects.skill": "hacking"
        } 
      }
    );
    
    // Mise à jour des programmes avec skill "stealth"
    const stealthPrograms = await Program.updateMany(
      { 
        "name": { 
          $in: [
            "Implant Optique 'Shadow' Mk.I",
            "Camouflage Thermo-Optique 'Spectre' Mk.II",
            "Camouflage Adaptatif 'Chimera' Mk.III",
            "Patch d'Infiltration"
          ]
        }
      },
      { 
        $set: { 
          "permanent_skill_boost.skill": "stealth",
          "effects.skill": "stealth"
        } 
      }
    );
    
    // Mise à jour des programmes avec skill "combat"
    const combatPrograms = await Program.updateMany(
      { 
        "name": { 
          $in: [
            "Cyberbras 'Warrior' Mk.I",
            "Ossature en Titane 'Manticore' Mk.II",
            "Endo-squelette 'Juggernaut' Mk.III",
            "Patch de Combat"
          ]
        }
      },
      { 
        $set: { 
          "permanent_skill_boost.skill": "combat",
          "effects.skill": "combat"
        } 
      }
    );
    
    // Mise à jour du programme avec skill "all"
    const blackwallPrograms = await Program.updateMany(
      { 
        "name": "Fragment du 'Blackwall'"
      },
      { 
        $set: { 
          "permanent_skill_boost.skill": "all",
          "effects.skill": "all"
        } 
      }
    );
    
    console.log(`   ✅ Programmes hacking mis à jour: ${hackingPrograms.modifiedCount}`);
    console.log(`   ✅ Programmes stealth mis à jour: ${stealthPrograms.modifiedCount}`);
    console.log(`   ✅ Programmes combat mis à jour: ${combatPrograms.modifiedCount}`);
    console.log(`   ✅ Programmes all mis à jour: ${blackwallPrograms.modifiedCount}`);
    console.log();
    
    // 2. Corriger les implants installés sur les runners
    console.log('2️⃣ Correction des implants installés sur les runners...');
    
    const runners = await Netrunner.find({}).lean();
    let correctedRunners = 0;
    
    for (const runner of runners) {
      if (runner.installedImplants && runner.installedImplants.length > 0) {
        let needsUpdate = false;
        const updatedImplants = [];
        
        for (const implant of runner.installedImplants) {
          // Récupérer les détails du programme
          const program = await Program.findById(implant.programId).lean();
          
          if (program) {
            // Vérifier si l'implant a les bonnes valeurs de skill
            const hasCorrectSkill = (program.permanent_skill_boost && program.permanent_skill_boost.skill) ||
                                   (program.effects && program.effects.skill);
            
            if (!hasCorrectSkill) {
              console.log(`   ⚠️  Implant ${program.name} sur ${runner.name} n'a pas de skill défini`);
            }
            
            updatedImplants.push({
              ...implant,
              program: {
                _id: program._id,
                name: program.name,
                description: program.description,
                rarity: program.rarity,
                type: program.type,
                effects: program.effects,
                permanent_skill_boost: program.permanent_skill_boost
              }
            });
          }
        }
        
        // Mettre à jour le runner si nécessaire
        if (needsUpdate) {
          await Netrunner.findByIdAndUpdate(runner._id, {
            installedImplants: updatedImplants
          });
          correctedRunners++;
        }
      }
    }
    
    console.log(`   ✅ ${correctedRunners} runners corrigés`);
    console.log();
    
    // 3. Vérifier la cohérence des programmes
    console.log('3️⃣ Vérification de la cohérence des programmes...');
    
    const allPrograms = await Program.find({}).lean();
    let inconsistentPrograms = 0;
    
    for (const program of allPrograms) {
      const hasPermanentBoost = program.permanent_skill_boost && program.permanent_skill_boost.skill;
      const hasEffectsSkill = program.effects && program.effects.skill;
      
      if (program.type === 'implant' && !hasPermanentBoost) {
        console.log(`   ❌ Implant ${program.name} n'a pas de permanent_skill_boost.skill`);
        inconsistentPrograms++;
      }
      
      if (program.type === 'one_shot' && program.effects.add_bonus_roll && !hasEffectsSkill) {
        console.log(`   ❌ Programme one-shot ${program.name} a un bonus mais pas de skill`);
        inconsistentPrograms++;
      }
    }
    
    console.log(`   ${inconsistentPrograms === 0 ? '✅' : '❌'} ${inconsistentPrograms} programmes incohérents trouvés`);
    console.log();
    
    // 4. Afficher un résumé des programmes corrigés
    console.log('4️⃣ Résumé des programmes corrigés...');
    
    const correctedPrograms = await Program.find({
      $or: [
        { "permanent_skill_boost.skill": { $exists: true, $ne: null } },
        { "effects.skill": { $exists: true, $ne: null } }
      ]
    }).lean();
    
    console.log(`   Programmes avec skill défini: ${correctedPrograms.length}`);
    
    const implants = correctedPrograms.filter(p => p.type === 'implant');
    const oneShots = correctedPrograms.filter(p => p.type === 'one_shot');
    
    console.log(`   - Implants: ${implants.length}`);
    console.log(`   - Programmes one-shot: ${oneShots.length}`);
    
    // Afficher quelques exemples
    console.log('\n   Exemples d\'implants:');
    implants.slice(0, 3).forEach(implant => {
      console.log(`   - ${implant.name}: ${implant.permanent_skill_boost.skill} +${implant.permanent_skill_boost.value}`);
    });
    
    console.log('\n   Exemples de programmes one-shot:');
    oneShots.slice(0, 3).forEach(program => {
      console.log(`   - ${program.name}: ${program.effects.skill} +${program.effects.add_bonus_roll}`);
    });
    
    console.log('\n✅ Correction du système terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    process.exit(0);
  }
}

fixProgramSystem(); 