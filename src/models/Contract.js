// src/models/Contract.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const contractSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  // À qui est proposé ce contrat. Peut être null (offre publique).
  ownerId: { type: String, default: null }, 
  assignedRunners: [{
    skill: { type: String, enum: ['hacking', 'stealth', 'combat'], required: true },
    runner: { type: Schema.Types.ObjectId, ref: 'Netrunner', required: true }
  }],
  
  status: { 
  type: String, 
  enum: ['Proposé', 'Assigné', 'Actif', 'Terminé', 'Échoué', 'Expiré', 'En attente de rapport'], // On ajoute 'Assigné' à la liste
  default: 'Proposé' 
},
  // NOUVEAU CHAMP pour stocker le résultat
  resolution_outcome: {
    type: String,
    enum: ['Succès', 'Échec', 'En attente de rapport'],
    default: null
  },
  
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
  initial_completion_duration_trp: { type: Number, default: null }, 
  // NOUVEAU CHAMP : Le timestamp réel du début du minuteur de complétion
  completion_timer_started_at: { type: Date, default: null },

  // Comment le timer de complétion se déclenche
  timer_trigger: {
    type: String,
    enum: ['on_accept', 'on_zone_entry', 'on_hostile_action'],
    default: 'on_accept'
  },
  // Compétences requises
  requiredSkills: {
    hacking: { type: Number, default: 0 },
    stealth: { type: Number, default: 0 },
    combat: { type: Number, default: 0 },
  },

  // --- SYSTÈME D'ÉCHELONS DE MENACE ---
  threatLevel: { type: Number, min: 1, max: 5, default: 1 }, // Niveau de menace (1-5)

  // --- SYSTÈME DE RELATIONS DE FACTION ---
  targetFaction: { type: String, default: null }, // Faction ciblée par le contrat
  employerFaction: { type: String, default: null }, // Faction qui emploie le fixer
  targetCorpo: { type: String, default: null }, // Pour compatibilité avec l'ancien système
  involvedFactions: [{ type: String }], // Toutes les factions impliquées dans le contrat
  missionType: { type: String, enum: ['infiltration', 'sabotage', 'assassinat', 'récupération', 'destruction'], default: 'infiltration' }, // Type de mission
  loreDifficulty: { type: String, enum: ['facile', 'moyen', 'difficile', 'expert'], default: 'moyen' }, // Difficulté selon le lore

  // Le niveau de conséquence en cas d'échec
  consequence_tier: { type: Number, min: 1, max: 4, default: 1 },

  // Le log de débriefing
  debriefing_log: { type: String, default: null },

  // Résultats du test de compétences
  skill_test_results: { type: Schema.Types.Mixed, default: null },
  success_rate: { type: Number, default: null },
  
  // Compétences révélées par joueur (Mouchard, Analyseur, etc.)
  revealedSkillsByPlayer: [{
    clerkId: { type: String, required: true },
    skills: [{ type: String, enum: ['hacking', 'stealth', 'combat'] }]
  }],
  // Effets actifs de programmes one-shot par joueur
  activeProgramEffects: [{
    clerkId: { type: String, required: true },
    effects: {
      autoSuccess: { type: Boolean, default: false },
      bonusRoll: { type: Number, default: 0 }, // Ancien format pour compatibilité
      bonusSkill: { type: String, enum: ['hacking', 'stealth', 'combat'], default: null }, // Ancien format pour compatibilité
      skillBonuses: { // Nouveau format pour bonus multiples
        hacking: { type: Number, default: 0 },
        stealth: { type: Number, default: 0 },
        combat: { type: Number, default: 0 }
      },
      reduceDifficulty: { type: Number, default: 0 },
      signature: { type: String, default: null }, // nom du programme signature utilisé
      // ... autres effets à ajouter si besoin
    }
  }],

  runnerReports: [{
    skill: { type: String },
    runner: { type: String },
    isSuccess: { type: Boolean },
    result: { type: Schema.Types.Mixed },
    status: { type: String },
    xpGained: { type: Number },
    fixerCommission: { type: Number },
    eddies: { type: Number },
    commissionAmount: { type: Number },
    deathCause: { type: String },
    reputationLoss: { type: Number },
    levelUp: { type: Boolean, default: false }
  }],

  // Ajout explicite des parts financières
  playerShare: { type: Number, default: 0 }, // Part du Fixer
  totalRunnerNet: { type: Number, default: 0 }, // Part totale des runners

}, { timestamps: true });

// Correction du schéma assignedRunners (doit déjà être correct)
// Correction de la déclaration du modèle pour forcer le rechargement
if (mongoose.models.Contract) {
  delete mongoose.models.Contract;
}
const Contract = mongoose.model('Contract', contractSchema);
export default Contract;