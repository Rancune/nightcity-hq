// scripts/update-program-skills.js
// Script pour mettre à jour les programmes dans la base de données avec les bonnes spécifications de skill

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Charger les variables d'environnement AVANT tout autre import
dotenv.config({ path: '.env.local' });

import connectDb from '../src/Lib/database.js';
import Program from '../src/models/Program.js';

async function updateProgramSkills() {
  console.log('🔧 Mise à jour des programmes avec les spécifications de skill\n');
  
  try {
    await connectDb();
    
    // 1. Charger le catalogue
    const catalogPath = path.join(process.cwd(), 'src', 'data', 'program-catalog.json');
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
    
    console.log(`📋 Catalogue chargé: ${catalog.length} items`);
    
    // 2. Filtrer les programmes avec bonus
    const bonusPrograms = catalog.filter(item => 
      item.effects && item.effects.add_bonus_roll !== undefined
    );
    
    console.log(`🎯 Programmes avec bonus trouvés: ${bonusPrograms.length}`);
    bonusPrograms.forEach(program => {
      console.log(`   - ${program.name}: +${program.effects.add_bonus_roll} (skill: ${program.effects.skill || 'non spécifié'})`);
    });
    console.log();
    
    // 3. Mettre à jour chaque programme dans la base
    let updatedCount = 0;
    let createdCount = 0;
    
    for (const catalogProgram of bonusPrograms) {
      console.log(`🔄 Traitement de ${catalogProgram.name}...`);
      
      // Chercher le programme dans la base
      let dbProgram = await Program.findOne({ name: catalogProgram.name });
      
      if (dbProgram) {
        // Mettre à jour le programme existant
        const oldSkill = dbProgram.effects?.skill || 'non spécifié';
        const newSkill = catalogProgram.effects.skill || 'non spécifié';
        
        dbProgram.effects = {
          ...dbProgram.effects,
          ...catalogProgram.effects
        };
        
        await dbProgram.save();
        updatedCount++;
        
        console.log(`   ✅ Mis à jour: ${oldSkill} → ${newSkill}`);
      } else {
        // Créer un nouveau programme
        const newProgram = new Program({
          name: catalogProgram.name,
          description: catalogProgram.description,
          category: catalogProgram.type,
          rarity: catalogProgram.rarity,
          price: catalogProgram.cost,
          effects: catalogProgram.effects,
          isActive: true
        });
        
        await newProgram.save();
        createdCount++;
        
        console.log(`   ✅ Créé: ${catalogProgram.effects.skill || 'non spécifié'}`);
      }
    }
    
    console.log();
    console.log(`📊 Résumé des mises à jour:`);
    console.log(`   - Programmes mis à jour: ${updatedCount}`);
    console.log(`   - Programmes créés: ${createdCount}`);
    console.log(`   - Total traité: ${updatedCount + createdCount}`);
    console.log();
    
    // 4. Vérification finale
    console.log('🔍 Vérification finale...');
    const allBonusPrograms = await Program.find({
      'effects.add_bonus_roll': { $gt: 0 }
    }).lean();
    
    console.log(`   Programmes avec bonus dans la base: ${allBonusPrograms.length}`);
    allBonusPrograms.forEach(program => {
      const skill = program.effects.skill || 'non spécifié';
      console.log(`   - ${program.name}: +${program.effects.add_bonus_roll} (skill: ${skill})`);
    });
    
    // 5. Vérifier les programmes sans skill
    const programsWithoutSkill = allBonusPrograms.filter(program => !program.effects.skill);
    if (programsWithoutSkill.length > 0) {
      console.log();
      console.log('⚠️  Programmes sans skill spécifié:');
      programsWithoutSkill.forEach(program => {
        console.log(`   - ${program.name}: +${program.effects.add_bonus_roll}`);
      });
    } else {
      console.log();
      console.log('✅ Tous les programmes ont un skill spécifié !');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  }
  
  process.exit(0);
}

updateProgramSkills(); 