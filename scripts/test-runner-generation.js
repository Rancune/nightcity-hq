#!/usr/bin/env node

/**
 * Script de test pour la génération de noms et lore de runners par IA
 * Usage: node scripts/test-runner-generation.js
 */

import { generateRunnerNameAndLore } from '../src/Lib/ai.js';

async function testRunnerGeneration() {
  console.log('🧪 Test de génération de runners par IA\n');

  // Test 1: Génération avec compétences aléatoires
  console.log('📋 Test 1: Génération avec compétences aléatoires');
  try {
    const skills = {
      hacking: Math.floor(Math.random() * 10) + 1,
      stealth: Math.floor(Math.random() * 10) + 1,
      combat: Math.floor(Math.random() * 10) + 1,
    };
    
    console.log(`Compétences: H:${skills.hacking} S:${skills.stealth} C:${skills.combat}`);
    
    const result = await generateRunnerNameAndLore(skills);
    console.log(`✅ Nom généré: ${result.name}`);
    console.log(`📖 Lore généré: ${result.lore}\n`);
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}\n`);
  }

  // Test 2: Génération avec compétences spécialisées (hacker)
  console.log('📋 Test 2: Génération d\'un hacker spécialisé');
  try {
    const hackerSkills = {
      hacking: 9,
      stealth: 6,
      combat: 3,
    };
    
    console.log(`Compétences: H:${hackerSkills.hacking} S:${hackerSkills.stealth} C:${hackerSkills.combat}`);
    
    const result = await generateRunnerNameAndLore(hackerSkills);
    console.log(`✅ Nom généré: ${result.name}`);
    console.log(`📖 Lore généré: ${result.lore}\n`);
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}\n`);
  }

  // Test 3: Génération avec compétences spécialisées (combattant)
  console.log('📋 Test 3: Génération d\'un combattant spécialisé');
  try {
    const combatSkills = {
      hacking: 3,
      stealth: 5,
      combat: 9,
    };
    
    console.log(`Compétences: H:${combatSkills.hacking} S:${combatSkills.stealth} C:${combatSkills.combat}`);
    
    const result = await generateRunnerNameAndLore(combatSkills);
    console.log(`✅ Nom généré: ${result.name}`);
    console.log(`📖 Lore généré: ${result.lore}\n`);
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}\n`);
  }

  // Test 4: Génération avec compétences équilibrées
  console.log('📋 Test 4: Génération d\'un runner équilibré');
  try {
    const balancedSkills = {
      hacking: 7,
      stealth: 7,
      combat: 7,
    };
    
    console.log(`Compétences: H:${balancedSkills.hacking} S:${balancedSkills.stealth} C:${balancedSkills.combat}`);
    
    const result = await generateRunnerNameAndLore(balancedSkills);
    console.log(`✅ Nom généré: ${result.name}`);
    console.log(`📖 Lore généré: ${result.lore}\n`);
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}\n`);
  }

  // Test 5: Génération sans compétences (aléatoire)
  console.log('📋 Test 5: Génération sans compétences spécifiées');
  try {
    const result = await generateRunnerNameAndLore();
    console.log(`✅ Nom généré: ${result.name}`);
    console.log(`📖 Lore généré: ${result.lore}\n`);
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}\n`);
  }

  console.log('🎉 Tests terminés !');
}

// Exécuter les tests
testRunnerGeneration().catch(console.error); 