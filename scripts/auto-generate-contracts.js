#!/usr/bin/env node

/**
 * Script de génération automatique de contrats
 * À exécuter via cron job toutes les 15-30 minutes en production
 * 
 * Usage:
 * - En développement: node scripts/auto-generate-contracts.js
 * - En production: ajouter au crontab: toutes les 15 minutes entre 6h et 22h
 * 
 * Ce script:
 * - Ne fonctionne qu'en production
 * - Génère des contrats à intervalles aléatoires entre 6h et 22h
 * - Limite le nombre de contrats à 12 maximum sur la map
 * - Utilise des probabilités variables selon l'heure de la journée
 */

const https = require('https');
const http = require('http');
const url = require('url');

// Charger les variables d'environnement
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

// Configuration
const CONFIG = {
  // URL de l'API de génération
  apiUrl: process.env.NODE_ENV === 'production' 
    ? 'https://fixer.rancune.games/api/crons/generate-contracts'
    : 'http://localhost:3000/api/crons/generate-contracts',
  
  // Secret pour l'authentification (optionnel)
  cronSecret: process.env.CRON_SECRET || null,
  
  // Limite maximale de contrats
  maxContracts: 12,
  
  // Heures actives (6h-22h)
  activeHours: { start: 6, end: 22 },
  
  // Probabilités par heure (0.0 à 1.0)
  hourProbabilities: {
    6: 0.3,   // Début de journée
    7: 0.4,
    8: 0.5,
    9: 0.6,
    10: 0.7,
    11: 0.8,
    12: 0.9,  // Heure de pointe
    13: 0.9,
    14: 0.8,
    15: 0.7,
    16: 0.6,
    17: 0.7,
    18: 0.8,  // Heure de pointe
    19: 0.8,
    20: 0.7,
    21: 0.5,
    22: 0.3   // Fin de journée
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
        'User-Agent': 'NightCity-HQ-AutoGenerator/1.0',
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
function isActiveHours() {
  //const now = new Date();
  //const currentHour = now.getHours();
  //return currentHour >= CONFIG.activeHours.start && currentHour <= CONFIG.activeHours.end;
  return true;
}

// Fonction pour obtenir la probabilité de génération selon l'heure
function getGenerationProbability() {

  return  0.5;
}

// Fonction pour décider si on doit générer des contrats
function shouldGenerate() {
  
  const probability = getGenerationProbability();
  return Math.random() < probability;
}

// Fonction principale de génération automatique
async function autoGenerateContracts() {
  const startTime = new Date();
  console.log(`[AUTO-GENERATE] Début de l'exécution: ${startTime.toISOString()}`);
  
  try {
    // Vérifier l'environnement
    if (process.env.NODE_ENV !== 'production') {
      console.log('[AUTO-GENERATE] Environnement non-production détecté, arrêt.');
      return;
    }

    // Vérifier les heures actives
    //if (!isActiveHours()) {
      //const currentHour = new Date().getHours();
      //console.log(`[AUTO-GENERATE] Hors des heures actives (${currentHour}h), arrêt.`);
      //return;
    //}

    // Décider si on génère
    if (!shouldGenerate()) {
      const probability = getGenerationProbability();
      console.log(`[AUTO-GENERATE] Pas de génération cette fois (probabilité: ${(probability * 100).toFixed(1)}%)`);
      return;
    }

    console.log('[AUTO-GENERATE] Tentative de génération de contrats...');

    // Appeler l'API de génération
    const response = await makeRequest(CONFIG.apiUrl);
    
    if (response.statusCode === 200) {
      const result = response.data;
      
      if (result.success) {
        console.log(`[AUTO-GENERATE] Succès: ${result.message || 'Génération terminée'}`);
        
        if (result.generated > 0) {
          console.log(`[AUTO-GENERATE] ${result.generated} contrat(s) généré(s)`);
          console.log(`[AUTO-GENERATE] Total actuel: ${result.currentTotal}/${CONFIG.maxContracts}`);
          console.log(`[AUTO-GENERATE] Heure: ${result.hour}h, Probabilité: ${(result.probability * 100).toFixed(1)}%`);
          
          if (result.contracts && result.contracts.length > 0) {
            result.contracts.forEach((contract, index) => {
              console.log(`[AUTO-GENERATE] Contrat ${index + 1}: "${contract.title}" (Niveau: ${contract.threatLevel}, Récompense: ${contract.reward.eddies}€$)`);
            });
          }
        }
      } else {
        console.log(`[AUTO-GENERATE] Aucune génération: ${result.message}`);
      }
    } else {
      console.error(`[AUTO-GENERATE] Erreur HTTP ${response.statusCode}:`, response.data);
    }

  } catch (error) {
    console.error('[AUTO-GENERATE] Erreur lors de la génération automatique:', error.message);
    
    // En cas d'erreur critique, on peut envoyer une notification
    if (process.env.ERROR_WEBHOOK_URL) {
      try {
        await makeRequest(process.env.ERROR_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.cronSecret}`
          }
        });
      } catch (webhookError) {
        console.error('[AUTO-GENERATE] Erreur lors de l\'envoi de la notification:', webhookError.message);
      }
    }
  } finally {
    const endTime = new Date();
    const duration = endTime - startTime;
    console.log(`[AUTO-GENERATE] Fin de l'exécution: ${endTime.toISOString} (durée: ${duration}ms)`);
  }
}

// Fonction pour exécuter en mode test
async function testGeneration() {
  console.log('[TEST] Mode test activé');
  console.log('[TEST] Configuration:', {
    apiUrl: CONFIG.apiUrl,
    maxContracts: CONFIG.maxContracts,
    activeHours: CONFIG.activeHours,
    currentHour: new Date().getHours(),
    isActiveHours: true,
    generationProbability: getGenerationProbability()
  });
  
  await autoGenerateContracts();
}

// Point d'entrée principal
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test') || args.includes('-t')) {
    testGeneration();
  } else {
    autoGenerateContracts();
  }
}

module.exports = {
  autoGenerateContracts,
  testGeneration,
  CONFIG
}; 