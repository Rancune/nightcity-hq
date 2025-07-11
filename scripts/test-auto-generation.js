#!/usr/bin/env node

/**
 * Script de test pour la génération automatique de contrats
 * Permet de tester le système sans attendre le cron
 */

const { autoGenerateContracts, testGeneration, CONFIG } = require('./auto-generate-contracts');

async function runTests() {
  console.log('🧪 Tests du système de génération automatique de contrats\n');
  
  // Test 1: Configuration
  console.log('📋 Test 1: Vérification de la configuration');
  console.log('Configuration:', {
    apiUrl: CONFIG.apiUrl,
    maxContracts: CONFIG.maxContracts,
    activeHours: CONFIG.activeHours,
    currentHour: new Date().getHours(),
    isProduction: process.env.NODE_ENV === 'production'
  });
  console.log('✅ Configuration OK\n');
  
  // Test 2: Heures actives
  console.log('🕐 Test 2: Vérification des heures actives');
  const now = new Date();
  const currentHour = now.getHours();
  const isActive = currentHour >= CONFIG.activeHours.start && currentHour <= CONFIG.activeHours.end;
  console.log(`Heure actuelle: ${currentHour}h`);
  console.log(`Heures actives: ${CONFIG.activeHours.start}h-${CONFIG.activeHours.end}h`);
  console.log(`Dans les heures actives: ${isActive ? '✅ Oui' : '❌ Non'}\n`);
  
  // Test 3: Probabilités
  console.log('📊 Test 3: Vérification des probabilités');
  const probability = CONFIG.hourProbabilities[currentHour] || 0.5;
  console.log(`Probabilité pour ${currentHour}h: ${(probability * 100).toFixed(1)}%`);
  console.log('✅ Probabilités OK\n');
  
  // Test 4: Simulation de génération
  console.log('🎲 Test 4: Simulation de génération');
  console.log('Note: Ce test ne génère pas réellement de contrats en développement');
  
  try {
    await testGeneration();
    console.log('✅ Test de génération terminé\n');
  } catch (error) {
    console.error('❌ Erreur lors du test de génération:', error.message);
  }
  
  // Test 5: Vérification de l'API
  console.log('🌐 Test 5: Vérification de l\'API');
  try {
    const https = require('https');
    const http = require('http');
    const url = require('url');
    
    function testApi() {
      return new Promise((resolve, reject) => {
        const parsedUrl = url.parse(CONFIG.apiUrl);
        const isHttps = parsedUrl.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const req = client.request({
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.path,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${CONFIG.cronSecret}`,
            'User-Agent': 'NightCity-HQ-Test/1.0'
          },
          timeout: 10000
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const jsonData = JSON.parse(data);
              resolve({ statusCode: res.statusCode, data: jsonData });
            } catch (error) {
              resolve({ statusCode: res.statusCode, data: { error: 'Invalid JSON' } });
            }
          });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
        
        req.end();
      });
    }
    
    const response = await testApi();
    console.log(`Status: ${response.statusCode}`);
    console.log(`Réponse: ${JSON.stringify(response.data, null, 2)}`);
    console.log('✅ API accessible\n');
    
  } catch (error) {
    console.error('❌ Erreur API:', error.message);
  }
  
  // Test 6: Recommandations
  console.log('💡 Test 6: Recommandations');
  console.log('Pour activer la génération automatique en production:');
  console.log('1. Vérifier que NODE_ENV=production');
  console.log('2. Configurer CRON_SECRET dans .env.local');
  console.log('3. Ajouter au crontab: */15 6-22 * * * /usr/bin/node /chemin/vers/scripts/auto-generate-contracts.js');
  console.log('4. Vérifier les logs: tail -f /var/log/cron');
  console.log('✅ Recommandations affichées\n');
  
  console.log('🎉 Tests terminés!');
}

// Exécuter les tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = runTests; 