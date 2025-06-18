// src/models/Contract.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const contractSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  // À qui est proposé ce contrat. Peut être null (offre publique).
  ownerId: { type: String, default: null }, 
  
  status: { type: String, enum: ['Proposé', 'Actif', 'Terminé', 'Échoué', 'Expiré'], default: 'Proposé' },
  
  // La récompense peut être plus complexe qu'un simple chiffre
  reward: {
    eddies: { type: Number, default: 0 },
    reputation: { type: Number, default: 0 },
    item: { type: String, default: null }, // ID ou nom d'un item rare
  },
  
  // --- NOUVELLES MÉCANIQUES CLÉS ---
  // Compte à rebours en secondes TRP pour accepter le contrat
  acceptance_deadline_trp: { type: Number, default: null }, 

  // Compte à rebours en secondes TRP pour compléter la mission
  completion_timer_trp: { type: Number, default: null }, 

  // Comment le timer de complétion se déclenche
  timer_trigger: {
    type: String,
    enum: ['on_accept', 'on_zone_entry', 'on_hostile_action'],
    default: 'on_accept'
  },
  
  // Le niveau de conséquence en cas d'échec
  consequence_tier: { type: Number, min: 1, max: 4, default: 1 },

}, { timestamps: true });

const Contract = mongoose.models.Contract || mongoose.model('Contract', contractSchema);
export default Contract;