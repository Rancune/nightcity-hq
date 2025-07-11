#!/usr/bin/env node

/**
 * Script de test pour l'API de recrutement
 * Usage: node scripts/test-recruitment-api.js
 * 
 * Note: Ce script nécessite que le serveur soit en cours d'exécution
 */

async function testRecruitmentAPI() {
  console.log('🧪 Test de l\'API de recrutement\n');

  try {
    // Test 1: Récupérer le pool de recrutement
    console.log('📋 Test 1: Récupération du pool de recrutement');
    
    const response = await fetch('http://localhost:3000/api/netrunners/recruitment-pool', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const pool = await response.json();
      console.log(`✅ Pool récupéré avec ${pool.length} candidats\n`);
      
      pool.forEach((candidate, index) => {
        console.log(`🎯 Candidat ${index + 1}: ${candidate.name}`);
        console.log(`   Compétences: H:${candidate.skills.hacking} S:${candidate.skills.stealth} C:${candidate.skills.combat}`);
        console.log(`   Puissance totale: ${candidate.totalPower}`);
        console.log(`   Commission: ${candidate.commission}€$`);
        if (candidate.lore) {
          console.log(`   Lore: ${candidate.lore}`);
        } else {
          console.log(`   Lore: (généré par fallback)`);
        }
        console.log('');
      });
    } else {
      const errorText = await response.text();
      console.error(`❌ Erreur ${response.status}: ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.log('\n💡 Assurez-vous que le serveur est en cours d\'exécution (npm run dev)');
  }

  console.log('🎉 Test terminé !');
}

// Exécuter le test
testRecruitmentAPI().catch(console.error); 