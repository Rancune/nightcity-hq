// src/models/PlayerProfile.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const playerProfileSchema = new Schema({
  // L'ID unique de l'utilisateur venant de Clerk
  clerkId: { type: String, required: true, unique: true }, 
  handle: { type: String, required: true }, // Le pseudo
  reputation: { type: Number, default: 100 },
  eddies: { type: Number, default: 5000 },
  
  // La clé de notre système TRP
  lastSeen: { type: Date, default: Date.now }, 

}, { timestamps: true });

const PlayerProfile = mongoose.models.PlayerProfile || mongoose.model('PlayerProfile', playerProfileSchema);
export default PlayerProfile;