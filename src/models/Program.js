import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const programSchema = new Schema({
  // Identifiant unique pour le marché
  marketId: { type: String, required: true, unique: true },
  
  // Vendeur du programme
  vendor: { type: String, required: true },
  
  // Informations de base
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['one_shot', 'implant', 'information', 'sabotage'],
    required: true 
  },
  
  // Rareté et accès
  rarity: { 
    type: String, 
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  streetCredRequired: { type: Number, default: 0 }, // Street cred minimum pour acheter
  
  // Prix et disponibilité
  cost: { type: Number, required: true }, // Prix en eddies
  stock: { type: Number, default: 1 }, // Quantité disponible
  maxStock: { type: Number, default: 1 }, // Stock maximum
  
  // Effets du programme
  effects: {
    // Pour les programmes one-shot
    skip_skill_check: { type: Boolean, default: false }, // Garantit le succès d'un test
    add_bonus_roll: { type: Number, default: 0 }, // Bonus à ajouter au jet de dé
    skill: { type: String, enum: ['hacking', 'stealth', 'combat', 'all'], default: null }, // Compétence affectée
    reveal_skill: { type: Boolean, default: false }, // Révèle une compétence requise
    reveal_all_skills: { type: Boolean, default: false }, // Révèle toutes les compétences
    reduce_difficulty: { type: Number, default: 0 }, // Réduit la difficulté
    guarantee_one_success: { type: Boolean, default: false }, // Garantit un succès
    guarantee_all_success: { type: Boolean, default: false }, // Garantit tous les succès
    instant_reputation_gain: { type: Number, default: 0 }, // Gain de réputation immédiat
    unlock_corpo_contract: { type: Boolean, default: false }, // Débloque contrat corpo
    unlock_gang_contract: { type: Boolean, default: false }, // Débloque contrat gang
    sabotage_difficulty_up: { type: Number, default: 0 }, // Augmente difficulté sabotage
    duration_trp: { type: Number, default: 0 }, // Durée en secondes TRP
    sabotage_bounty: { type: Boolean, default: false }, // Prime sur sabotage
    sabotage_threat_up: { type: Boolean, default: false }, // Augmente menace
    passive_heal_boost: { type: Number, default: 0 } // Boost de régénération
  },
  
  // Boost permanent de compétence (pour les implants)
  permanent_skill_boost: {
    skill: { type: String, enum: ['hacking', 'stealth', 'combat', 'all'], default: null },
    value: { type: Number, default: 0 }
  },
  
  // Gestion du stock et rotation
  isSignature: { type: Boolean, default: false }, // Vente flash signature
  signatureExpiry: { type: Date, default: null }, // Expiration pour les signatures
  rotationExpiry: { type: Date, default: null }, // Expiration de la rotation
  maxDaily: { type: Number, default: null }, // Limite d'achat quotidien
  
  // Métadonnées
  isActive: { type: Boolean, default: true },
  timesPurchased: { type: Number, default: 0 }, // Nombre de fois acheté
  
  // Messages de l'Intermédiaire
  vendorMessage: { type: String, default: null }, // Message spécial du vendeur
  
}, { timestamps: true });

// Méthode pour vérifier si l'objet est disponible
programSchema.methods.isAvailable = function() {
  return this.isActive && this.stock > 0;
};

// Méthode pour vérifier si le joueur peut acheter
programSchema.methods.canPlayerBuy = function(playerStreetCred) {
  return this.isAvailable() && playerStreetCred >= this.streetCredRequired;
};

// Méthode pour acheter
programSchema.methods.purchase = function() {
  if (this.stock > 0) {
    this.stock -= 1;
    this.timesPurchased += 1;
    return true;
  }
  return false;
};

const Program = mongoose.models.Program || mongoose.model('Program', programSchema);

export default Program; 