// src/models/Netrunner.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const netrunnerSchema = new Schema({
  // L'ID de l'utilisateur Clerk à qui appartient ce runner
  ownerId: { type: String, required: true },

  name: { type: String, required: true },

  status: { 
    type: String, 
    enum: ['Disponible', 'En mission', 'Grillé'], 
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

  // À quel contrat est-il assigné en ce moment ?
  assignedContract: { type: Schema.Types.ObjectId, ref: 'Contract', default: null },

}, { timestamps: true });

const Netrunner = mongoose.models.Netrunner || mongoose.model('Netrunner', netrunnerSchema);

export default Netrunner;