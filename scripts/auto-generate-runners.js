#!/usr/bin/env node

/**
 * Script de génération automatique de runners pour le pool de recrutement
 * À exécuter via cron job toutes les 2-4 heures en production
 * 
 * Usage:
 * - En développement: node scripts/auto-generate-runners.js
 * - En production: ajouter au crontab: toutes les 3 heures entre 8h et 20h
 * 
 * Ce script:
 * - Ne fonctionne qu'en production
 * - Génère de nouveaux runners dans le pool de recrutement
 * - Limite le pool à 6-8 candidats maximum
 * - Utilise des probabilités variables selon l'heure de la journée
 */

const https = require('https');
const http = require('http');
const url = require('url');

// Charger les variables d'environnement
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

// Configuration
const CONFIG = {
  // URL de l'API de génération de pool
  apiUrl: process.env.NODE_ENV === 'production' 
    ? 'https://fixer.rancune.games/api/crons/generate-runners-pool'
    : 'http://localhost:3000/api/crons/generate-runners-pool',
  
  // Secret pour l'authentification (optionnel)
  cronSecret: process.env.CRON_SECRET || null,
  
  // Limite maximale de candidats dans le pool
  maxPoolSize: 8,
  
  // Heures actives (8h-20h)
  activeHours: { start: 8, end: 20 },
  
  // Probabilités par heure (0.0 à 1.0)
  hourProbabilities: {
    8: 0.4,   // Début de journée
    9: 0.5,
    10: 0.6,
    11: 0.7,
    12: 0.8,  // Heure de pointe
    13: 0.8,
    14: 0.7,
    15: 0.6,
    16: 0.7,
    17: 0.8,  // Heure de pointe
    18: 0.8,
    19: 0.7,
    20: 0.5   // Fin de journée
  }
};

// Fonction pour faire une requête HTTP/HTTPS
function makeRequest(urlString, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(urlString);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.path,
      method: 'GET',
      headers: {
        ...(CONFIG.cronSecret && { 'Authorization': `Bearer ${CONFIG.cronSecret}` }),
        'User-Agent': 'NightCity-HQ-RunnerGenerator/1.0',
        'Content-Type': 'application/json'
      },
      ...options
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: { error: 'Invalid JSON response', raw: data }
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Fonction pour vérifier si on est dans les heures actives
//function isActiveHours() {
  //const now = new Date();
  //const currentHour = now.getHours();
  //return currentHour >= CONFIG.activeHours.start && currentHour <= CONFIG.activeHours.end;
//}

// Fonction pour obtenir la probabilité de génération selon l'heure
function getGenerationProbability() {
  
  return  0.5;
}

// Fonction pour décider si on doit générer des runners
function shouldGenerate() {
  
  const probability = getGenerationProbability();
  return Math.random() < probability;
}

// Fonction principale de génération automatique
async function autoGenerateRunners() {
  const startTime = new Date();
  console.log(`[AUTO-RUNNERS] Début de l'exécution: ${startTime.toISOString()}`);
  
  try {
    // Vérifier l'environnement
    if (process.env.NODE_ENV !== 'production') {
      console.log('[AUTO-RUNNERS] Environnement non-production détecté, arrêt.');
      return;
    }

    // Vérifier les heures actives
    //if (!isActiveHours()) {
      //const currentHour = new Date().getHours();
      //console.log(`[AUTO-RUNNERS] Hors des heures actives (${currentHour}h), arrêt.`);
      //return;
    //}

    // Décider si on génère
    if (!shouldGenerate()) {
      const probability = getGenerationProbability();
      console.log(`[AUTO-RUNNERS] Pas de génération cette fois (probabilité: ${(probability * 100).toFixed(1)}%)`);
      return;
    }

    console.log('[AUTO-RUNNERS] Tentative de génération de runners...');

    // Appeler l'API de génération
    const response = await makeRequest(CONFIG.apiUrl);
    
    if (response.statusCode === 200) {
      const result = response.data;
      
      if (result.success) {
        console.log(`[AUTO-RUNNERS] Succès: ${result.message || 'Génération terminée'}`);
        
        if (result.generated > 0) {
          console.log(`[AUTO-RUNNERS] ${result.generated} runner(s) généré(s)`);
          console.log(`[AUTO-RUNNERS] Total actuel: ${result.currentTotal}/${CONFIG.maxPoolSize}`);
          console.log(`[AUTO-RUNNERS] Heure: ${result.hour}h, Probabilité: ${(result.probability * 100).toFixed(1)}%`);
          
          if (result.runners && result.runners.length > 0) {
            result.runners.forEach((runner, index) => {
              console.log(`[AUTO-RUNNERS] Runner ${index + 1}: "${runner.name}" (H:${runner.skills.hacking} S:${runner.skills.stealth} C:${runner.skills.combat})`);
            });
          }
        }
      } else {
        console.log(`[AUTO-RUNNERS] Aucune génération: ${result.message}`);
      }
    } else {
      console.error(`[AUTO-RUNNERS] Erreur HTTP ${response.statusCode}:`, response.data);
    }

  } catch (error) {
    console.error('[AUTO-RUNNERS] Erreur lors de la génération automatique:', error.message);
  } finally {
    const endTime = new Date();
    const duration = endTime - startTime;
    console.log(`[AUTO-RUNNERS] Fin de l'exécution: ${endTime.toISOString} (durée: ${duration}ms)`);
  }
}

// Fonction pour exécuter en mode test
async function testGeneration() {
  console.log('[TEST] Mode test activé');
  console.log('[TEST] Configuration:', {
    apiUrl: CONFIG.apiUrl,
    maxPoolSize: CONFIG.maxPoolSize,
    activeHours: CONFIG.activeHours,
    currentHour: new Date().getHours(),
    isActiveHours: true,
    generationProbability: getGenerationProbability()
  });
  
  await autoGenerateRunners();
}

// Point d'entrée principal
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test') || args.includes('-t')) {
    testGeneration();
  } else {
    autoGenerateRunners();
  }
}

module.exports = {
  autoGenerateRunners,
  testGeneration,
  CONFIG
}; 