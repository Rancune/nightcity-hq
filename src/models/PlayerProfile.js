// src/models/PlayerProfile.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const playerProfileSchema = new Schema({
  // L'ID unique de l'utilisateur venant de Clerk
  clerkId: { type: String, required: true, unique: true }, 
  handle: { type: String, required: true }, // Le pseudo
  reputation: { type: Number, default: 100 },
  eddies: { type: Number, default: 5000 },
  
  // Système de réputation étendu
  reputationPoints: { type: Number, default: 100 }, // Points de réputation actuels
  reputationLevel: { type: Number, default: 1 }, // Niveau de réputation (1-4)
  reputationTitle: { type: String, default: "Rumeur de la Rue" }, // Titre de réputation
  
  // Statistiques de réputation
  missionsCompleted: { type: Number, default: 0 },
  missionsFailed: { type: Number, default: 0 },
  totalReputationGained: { type: Number, default: 0 },
  totalReputationLost: { type: Number, default: 0 },
  
  // Bonus de réputation débloqués
  reputationBonuses: {
    stealthBonus: { type: Boolean, default: false }, // Bonus pour discrétion parfaite
    speedBonus: { type: Boolean, default: false }, // Bonus pour missions ultra-rapides
    secondaryObjectiveBonus: { type: Boolean, default: false }, // Bonus pour objectifs secondaires
  },
  
  // Accès débloqués par niveau de réputation
  unlockedAccess: {
    equipmentTier: { type: String, default: "common" }, // common, uncommon, rare, legendary
    vendorDiscount: { type: Number, default: 0 }, // Pourcentage de réduction
    specialMissions: { type: Boolean, default: false }, // Accès aux missions spéciales
    exclusiveContacts: { type: Boolean, default: false }, // Contacts exclusifs
  },
  
  // La clé de notre système TRP
  lastSeen: { type: Date, default: Date.now }, 

}, { timestamps: true });

// Méthode pour calculer le niveau de réputation
playerProfileSchema.methods.calculateReputationLevel = function() {
  const points = this.reputationPoints;

  if (points >= 2500) {
    this.reputationLevel = 5;
    this.reputationTitle = "Mythe Urbain";
    this.unlockedAccess = {
      equipmentTier: "legendary",
      vendorDiscount: 20,
      specialMissions: true,
      exclusiveContacts: true
    };
  } else if (points >= 1200) {
    this.reputationLevel = 4;
    this.reputationTitle = "Légende de Night City";
    this.unlockedAccess = {
      equipmentTier: "epic",
      vendorDiscount: 15,
      specialMissions: true,
      exclusiveContacts: true
    };
  } else if (points >= 501) {
    this.reputationLevel = 3;
    this.reputationTitle = "Faiseur de Rois";
    this.unlockedAccess = {
      equipmentTier: "rare",
      vendorDiscount: 10,
      specialMissions: true,
      exclusiveContacts: false
    };
  } else if (points >= 151) {
    this.reputationLevel = 2;
    this.reputationTitle = "Nom qui Circule";
    this.unlockedAccess = {
      equipmentTier: "uncommon",
      vendorDiscount: 5,
      specialMissions: false,
      exclusiveContacts: false
    };
  } else {
    this.reputationLevel = 1;
    this.reputationTitle = "Rumeur de la Rue";
    this.unlockedAccess = {
      equipmentTier: "common",
      vendorDiscount: 0,
      specialMissions: false,
      exclusiveContacts: false
    };
  }
};

// Méthode pour ajouter de la réputation
playerProfileSchema.methods.addReputation = function(points, reason = "") {
  this.reputationPoints += points;
  this.totalReputationGained += points;
  this.calculateReputationLevel();
  
  console.log(`[REPUTATION] +${points} PR (${reason}). Nouveau total: ${this.reputationPoints} PR (${this.reputationTitle})`);
};

// Méthode pour perdre de la réputation
playerProfileSchema.methods.loseReputation = function(points, reason = "") {
  this.reputationPoints = Math.max(0, this.reputationPoints - points); // Ne peut pas descendre en dessous de 0
  this.totalReputationLost += points;
  this.calculateReputationLevel();
  
  console.log(`[REPUTATION] -${points} PR (${reason}). Nouveau total: ${this.reputationPoints} PR (${this.reputationTitle})`);
};

const PlayerProfile = mongoose.models.PlayerProfile || mongoose.model('PlayerProfile', playerProfileSchema);
export default PlayerProfile;