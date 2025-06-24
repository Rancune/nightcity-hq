import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const programSchema = new Schema({
  // Informations de base
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['one_shot', 'implant', 'information', 'signature'],
    required: true 
  },
  
  // Rareté et accès
  rarity: { 
    type: String, 
    enum: ['common', 'uncommon', 'rare', 'legendary'],
    default: 'common'
  },
  reputationRequired: { type: Number, default: 0 }, // Réputation minimum pour acheter
  
  // Prix et disponibilité
  price: { type: Number, required: true }, // Prix en eddies
  stock: { type: Number, default: 1 }, // Quantité disponible
  maxStock: { type: Number, default: 1 }, // Stock maximum
  
  // Effets du programme
  effects: {
    // Pour les programmes one-shot
    skip_skill_check: { type: Boolean, default: false }, // Garantit le succès d'un test
    add_bonus_roll: { type: Number, default: 0 }, // Bonus à ajouter au jet de dé
    reveal_skill: { type: Boolean, default: false }, // Révèle une compétence requise
    reduce_difficulty: { type: Number, default: 0 }, // Réduit la difficulté
    
    // Pour les implants
    permanent_skill_boost: {
      skill: { type: String, enum: ['hacking', 'stealth', 'combat'], default: null },
      value: { type: Number, default: 0 }
    },
    
    // Pour les informations
    unlocks_contract: { type: Boolean, default: false }, // Débloque un contrat exclusif
    contract_template: { type: Schema.Types.Mixed, default: null } // Template du contrat à générer
  },
  
  // Gestion du stock et rotation
  isSignature: { type: Boolean, default: false }, // Vente flash signature
  signatureExpiry: { type: Date, default: null }, // Expiration pour les signatures
  rotationExpiry: { type: Date, default: null }, // Expiration de la rotation
  
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
programSchema.methods.canPlayerBuy = function(playerReputation) {
  return this.isAvailable() && playerReputation >= this.reputationRequired;
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