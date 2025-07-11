import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const marketStateSchema = new Schema({
  // Identifiant unique pour le marché (pour l'instant, on n'a qu'un marché global)
  marketId: { type: String, default: 'global', unique: true },
  
  // Dernière rotation du stock
  lastStockRotation: { type: Date, default: Date.now },
  
  // Prochaine rotation prévue (calculée automatiquement)
  nextStockRotation: { type: Date, default: Date.now },
  
  // Stock actuel des objets (pour les objets Signature avec stock limité)
  currentStock: {
    type: Map,
    of: {
      stock: { type: Number, default: 0 },
      lastRestocked: { type: Date, default: Date.now }
    },
    default: new Map()
  },
  
  // Limites quotidiennes par joueur et par objet
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
  
  // Configuration du marché
  config: {
    rotationHour: { type: Number, default: 3 }, // 3h00 du matin
    rotationInterval: { type: Number, default: 24 }, // 24 heures
    enableRotation: { type: Boolean, default: true }
  }
}, { timestamps: true });

// Méthode pour calculer la prochaine rotation
marketStateSchema.methods.calculateNextRotation = function() {
  const now = new Date();
  const nextRotation = new Date(now);
  
  // Définir l'heure de rotation (3h00 du matin)
  nextRotation.setHours(this.config.rotationHour, 0, 0, 0);
  
  // Si l'heure de rotation est déjà passée aujourd'hui, passer à demain
  if (nextRotation <= now) {
    nextRotation.setDate(nextRotation.getDate() + 1);
  }
  
  return nextRotation;
};

// Méthode pour vérifier si une rotation est nécessaire
marketStateSchema.methods.needsRotation = function() {
  const now = new Date();
  return now >= this.nextStockRotation;
};

// Méthode pour effectuer une rotation
marketStateSchema.methods.performRotation = function() {
  this.lastStockRotation = new Date();
  this.nextStockRotation = this.calculateNextRotation();
  
  // Réinitialiser le stock des objets Signature
  this.currentStock.clear();
  
  // Réinitialiser toutes les limites quotidiennes
  this.dailyLimits.clear();
  
  return this.save();
};

// Méthode pour vérifier et incrémenter la limite quotidienne d'un joueur pour un objet
marketStateSchema.methods.checkAndIncrementDailyLimit = function(userId, itemId, maxDaily = 2) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Récupérer ou créer l'entrée pour cet utilisateur
  if (!this.dailyLimits.has(userId)) {
    this.dailyLimits.set(userId, new Map());
  }
  
  const userLimits = this.dailyLimits.get(userId);
  
  // Récupérer ou créer l'entrée pour cet objet
  if (!userLimits.has(itemId)) {
    userLimits.set(itemId, { count: 0, lastReset: today });
  }
  
  const itemLimit = userLimits.get(itemId);
  
  // Vérifier si c'est un nouveau jour
  const lastReset = new Date(itemLimit.lastReset);
  const lastResetDay = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate());
  
  if (today.getTime() !== lastResetDay.getTime()) {
    // Nouveau jour, réinitialiser le compteur
    itemLimit.count = 0;
    itemLimit.lastReset = today;
  }
  
  // Vérifier si la limite est atteinte
  if (itemLimit.count >= maxDaily) {
    return { allowed: false, current: itemLimit.count, max: maxDaily };
  }
  
  // Incrémenter le compteur
  itemLimit.count += 1;
  
  return { allowed: true, current: itemLimit.count, max: maxDaily };
};

// Méthode pour obtenir les limites actuelles d'un joueur
marketStateSchema.methods.getPlayerDailyLimits = function(userId) {
  const userLimits = this.dailyLimits.get(userId);
  if (!userLimits) {
    return new Map();
  }
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const limits = new Map();
  
  for (const [itemId, itemLimit] of userLimits.entries()) {
    const lastReset = new Date(itemLimit.lastReset);
    const lastResetDay = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate());
    
    if (today.getTime() === lastResetDay.getTime()) {
      limits.set(itemId, itemLimit.count);
    } else {
      limits.set(itemId, 0);
    }
  }
  
  return limits;
};

const MarketState = mongoose.models.MarketState || mongoose.model('MarketState', marketStateSchema);

export default MarketState; 