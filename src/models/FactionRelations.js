import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const factionRelationsSchema = new Schema({
  // L'ID de l'utilisateur Clerk
  clerkId: { type: String, required: true, unique: true },
  
  // Relations avec les différentes factions (-1000 à +1000)
  relations: {
    // Mégacorpos
    arasaka: { type: Number, default: 0, min: -1000, max: 1000 },
    militech: { type: Number, default: 0, min: -1000, max: 1000 },
    kangTao: { type: Number, default: 0, min: -1000, max: 1000 },
    netWatch: { type: Number, default: 0, min: -1000, max: 1000 },
    
    // Gangs
    maelstrom: { type: Number, default: 0, min: -1000, max: 1000 },
    valentinos: { type: Number, default: 0, min: -1000, max: 1000 },
    voodooBoys: { type: Number, default: 0, min: -1000, max: 1000 },
    animals: { type: Number, default: 0, min: -1000, max: 1000 },
    scavengers: { type: Number, default: 0, min: -1000, max: 1000 },
    
    // Autorités
    ncpd: { type: Number, default: 0, min: -1000, max: 1000 },
    maxTac: { type: Number, default: 0, min: -1000, max: 1000 },
    traumaTeam: { type: Number, default: 0, min: -1000, max: 1000 },
    
    // Instances Politiques
    conseilMunicipal: { type: Number, default: 0, min: -1000, max: 1000 },
    lobbyistes: { type: Number, default: 0, min: -1000, max: 1000 },
    
    // Inframonde & Civils
    inframonde: { type: Number, default: 0, min: -1000, max: 1000 },
    
    // Autres
    fixers: { type: Number, default: 0, min: -1000, max: 1000 },
    ripperdocs: { type: Number, default: 0, min: -1000, max: 1000 },
    nomads: { type: Number, default: 0, min: -1000, max: 1000 }
  },
  
  // Historique des changements de relations
  history: [{
    faction: { type: String, required: true },
    change: { type: Number, required: true }, // Changement positif ou négatif
    reason: { type: String, required: true }, // Raison du changement
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', default: null },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Niveau de menace par faction (pour les représailles)
  threatLevels: {
    arasaka: { type: Number, default: 0, min: 0, max: 10 },
    militech: { type: Number, default: 0, min: 0, max: 10 },
    kangTao: { type: Number, default: 0, min: 0, max: 10 },
    netWatch: { type: Number, default: 0, min: 0, max: 10 },
    maelstrom: { type: Number, default: 0, min: 0, max: 10 },
    valentinos: { type: Number, default: 0, min: 0, max: 10 },
    voodooBoys: { type: Number, default: 0, min: 0, max: 10 },
    animals: { type: Number, default: 0, min: 0, max: 10 },
    scavengers: { type: Number, default: 0, min: 0, max: 10 },
    ncpd: { type: Number, default: 0, min: 0, max: 10 },
    maxTac: { type: Number, default: 0, min: 0, max: 10 },
    traumaTeam: { type: Number, default: 0, min: 0, max: 10 },
    conseilMunicipal: { type: Number, default: 0, min: 0, max: 10 },
    lobbyistes: { type: Number, default: 0, min: 0, max: 10 },
    inframonde: { type: Number, default: 0, min: 0, max: 10 },
    fixers: { type: Number, default: 0, min: 0, max: 10 },
    ripperdocs: { type: Number, default: 0, min: 0, max: 10 },
    nomads: { type: Number, default: 0, min: 0, max: 10 }
  },
  
  // Opportunités débloquées par niveau de relation
  unlockedOpportunities: {
    exclusiveContracts: [String], // IDs des contrats exclusifs débloqués
    specialVendors: [String], // Vendeurs spéciaux accessibles
    uniqueItems: [String] // Items uniques disponibles
  }
  
}, { timestamps: true });

// Méthode pour modifier une relation de faction
factionRelationsSchema.methods.modifyRelation = function(faction, change, reason, contractId = null) {
  if (!this.relations.hasOwnProperty(faction)) {
    console.error(`[FACTION] Faction inconnue: ${faction}`);
    return false;
  }
  
  const oldValue = this.relations[faction];
  this.relations[faction] = Math.max(-1000, Math.min(1000, oldValue + change));
  const actualChange = this.relations[faction] - oldValue;
  
  // Ajouter à l'historique
  this.history.push({
    faction,
    change: actualChange,
    reason,
    contractId,
    timestamp: new Date()
  });
  
  // Mettre à jour le niveau de menace si nécessaire
  if (actualChange < 0) {
    this.threatLevels[faction] = Math.min(10, this.threatLevels[faction] + Math.abs(actualChange) / 100);
  }
  
  console.log(`[FACTION] ${faction}: ${oldValue} → ${this.relations[faction]} (${actualChange > 0 ? '+' : ''}${actualChange}) - ${reason}`);
  
  return true;
};

// Méthode pour obtenir le statut d'une relation
factionRelationsSchema.methods.getRelationStatus = function(faction) {
  const value = this.relations[faction] || 0;
  
  if (value >= 500) return 'Allié';
  if (value >= 200) return 'Ami';
  if (value >= 50) return 'Favorable';
  if (value >= -50) return 'Neutre';
  if (value >= -200) return 'Hostile';
  if (value >= -500) return 'Ennemi';
  return 'Mortel';
};

// Méthode pour vérifier si une opportunité est débloquée
factionRelationsSchema.methods.hasOpportunity = function(opportunityId) {
  return this.unlockedOpportunities.exclusiveContracts.includes(opportunityId);
};

const FactionRelations = mongoose.models.FactionRelations || mongoose.model('FactionRelations', factionRelationsSchema);

export default FactionRelations; 