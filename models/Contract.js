// models/Contract.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// On définit la structure de nos contrats
const contractSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  reward: { type: Number, required: true },
  difficulty: { type: String, enum: ['Facile', 'Moyen', 'Difficile', 'Légendaire'], default: 'Moyen' },
  status: { type: String, enum: ['Disponible', 'En cours', 'Terminé'], default: 'Disponible' },
  expiresAt: { type: Date, required: false }, // La date d'expiration du contrat
  // Le 'timestamps' ajoute automatiquement les champs 'createdAt' et 'updatedAt'
}, { timestamps: true });

// On crée le "Modèle" à partir du schéma. C'est ce modèle qu'on utilisera pour interagir avec la base de données.
const Contract = mongoose.models.Contract || mongoose.model('Contract', contractSchema);

// On exporte le modèle pour pouvoir l'utiliser ailleurs dans notre application
module.exports = Contract;