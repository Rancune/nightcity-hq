#!/usr/bin/env node

/**
 * Script de rotation automatique du stock du marché noir
 * À exécuter via cron job à 3h00 du matin en production
 * 
 * Usage:
 * - En développement: node scripts/rotate-market-stock.js
 * - En production: ajouter au crontab: 0 3 * * * /path/to/node /path/to/scripts/rotate-market-stock.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement depuis le répertoire racine
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Modèle MarketState (copie du modèle principal)
const marketStateSchema = new mongoose.Schema({
  marketId: { type: String, default: 'global', unique: true },
  lastStockRotation: { type: Date, default: Date.now },
  nextStockRotation: { type: Date, default: Date.now },
  currentStock: {
    type: Map,
    of: {
      stock: { type: Number, default: 0 },
      lastRestocked: { type: Date, default: Date.now }
    },
    default: new Map()
  },
  dailyLimits: {
    type: Map,
    of: {
      type: Map,
      of: {
        count: { type: Number, default: 0 },
        lastReset: { type: Date, default: Date.now }
      }
    },
    default: new Map()
  },
  config: {
    rotationHour: { type: Number, default: 3 },
    rotationInterval: { type: Number, default: 24 },
    enableRotation: { type: Boolean, default: true }
  }
}, { timestamps: true });

// Méthodes du schéma
marketStateSchema.methods.calculateNextRotation = function() {
  const now = new Date();
  const nextRotation = new Date(now);
  nextRotation.setHours(this.config.rotationHour, 0, 0, 0);
  
  if (nextRotation <= now) {
    nextRotation.setDate(nextRotation.getDate() + 1);
  }
  
  return nextRotation;
};

marketStateSchema.methods.needsRotation = function() {
  const now = new Date();
  return now >= this.nextStockRotation;
};

marketStateSchema.methods.performRotation = function() {
  this.lastStockRotation = new Date();
  this.nextStockRotation = this.calculateNextRotation();
  this.currentStock.clear();
  this.dailyLimits.clear();
  return this.save();
};

const MarketState = mongoose.model('MarketState', marketStateSchema);

async function rotateMarketStock() {
  try {
    console.log('[MARKET ROTATION] Début de la rotation du stock...');
    
    // Connexion à la base de données
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI non définie dans les variables d\'environnement');
    }
    
    console.log('[MARKET ROTATION] Connexion à MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('[MARKET ROTATION] Connexion à la base de données établie');
    
    // Récupérer l'état du marché
    let marketState = await MarketState.findOne({ marketId: 'global' });
    if (!marketState) {
      console.log('[MARKET ROTATION] Création d\'un nouvel état de marché');
      marketState = new MarketState({
        marketId: 'global',
        lastStockRotation: new Date(),
        nextStockRotation: new Date().setHours(3, 0, 0, 0) + 24 * 60 * 60 * 1000
      });
      await marketState.save();
    }
    
    // Vérifier si une rotation est nécessaire
    if (marketState.needsRotation()) {
      console.log('[MARKET ROTATION] Rotation nécessaire, exécution...');
      await marketState.performRotation();
      console.log('[MARKET ROTATION] Rotation effectuée avec succès');
      console.log(`[MARKET ROTATION] Prochaine rotation: ${marketState.nextStockRotation}`);
    } else {
      console.log('[MARKET ROTATION] Aucune rotation nécessaire');
      console.log(`[MARKET ROTATION] Prochaine rotation prévue: ${marketState.nextStockRotation}`);
    }
    
  } catch (error) {
    console.error('[MARKET ROTATION] Erreur lors de la rotation:', error);
    process.exit(1);
  } finally {
    // Fermer la connexion
    await mongoose.disconnect();
    console.log('[MARKET ROTATION] Connexion fermée');
    process.exit(0);
  }
}

// Exécuter le script
if (require.main === module) {
  rotateMarketStock();
}

module.exports = rotateMarketStock; 