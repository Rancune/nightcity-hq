// src/models/Netrunner.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const netrunnerSchema = new Schema({
  // L'ID de l'utilisateur Clerk à qui appartient ce runner
  ownerId: { type: String, required: true },

  name: { type: String, required: true },

  // Lore généré par IA pour le background du runner
  lore: { type: String, default: null },

  status: { 
    type: String, 
    enum: ['Disponible', 'En mission', 'Grillé', 'Mort'], 
    default: 'Disponible' 
  },

  // Le moment où le runner redevient disponible après avoir été "Grillé"
  recoveryUntil: { type: Date, default: null },

  // Les compétences du runner, sur 10
  skills: {
    hacking: { type: Number, default: 1, min: 1, max: 10 },
    stealth: { type: Number, default: 1, min: 1, max: 10 },
    combat: { type: Number, default: 1, min: 1, max: 10 },
  },

  // À quel contrat est-il assigné en ce moment ? Voir assignedRunner dans Contract.js
 // assignedContract: { type: Schema.Types.ObjectId, ref: 'Contract', default: null },

   // Leveling system
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  xpToNextLevel: { type: Number, default: 100 }, // Expérience requise pour passer au niveau 2

  // Implants installés sur le runner
  installedImplants: [{
    programId: { type: Schema.Types.ObjectId, ref: 'Program' },
    installedAt: { type: Date, default: Date.now }
  }],

  // Champs pour la mort du runner
  deathCause: { type: String, default: null }, // Cause de la mort (ex: "Grillé par ICE", "Tué en combat")
  deathDate: { type: Date, default: null }, // Date de la mort
  epitaph: { type: String, default: null }, // Épitaphe personnalisée

  // Commission du Fixer (en pourcentage, ex: 22.5). Voir GDD : évolue avec le niveau et les compétences initiales
  fixerCommission: { type: Number, default: 25 },

}, { timestamps: true });

const Netrunner = mongoose.models.Netrunner || mongoose.model('Netrunner', netrunnerSchema);

export default Netrunner;