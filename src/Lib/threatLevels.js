// src/Lib/threatLevels.js

// Système d'Échelons de Menace selon le GDD
export const THREAT_LEVELS = {
  1: {
    name: "Menace Basse",
    subtitle: "Job de Routine",
    skillRange: { min: 3, max: 5 },
    description: "Le pain quotidien d'un Fixer. Une mission simple, parfaite pour un runner novice ou pour se faire des eddies faciles. Un runner compétent (5+) réussira sans effort.",
    playerPrerequisites: "Aucune préparation spéciale requise.",
    icon: "💀",
    color: "text-green-400",
    bgColor: "bg-green-400/20",
    borderColor: "border-green-400/50"
  },
  2: {
    name: "Menace Modérée", 
    subtitle: "Opération Standard",
    skillRange: { min: 6, max: 8 },
    description: "Nécessite un runner spécialisé et compétent. Un agent polyvalent mais moyen risquerait l'échec. Le joueur doit commencer à regarder les stats de son écurie.",
    playerPrerequisites: "Choisir le bon runner pour la mission.",
    icon: "💀💀",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/20",
    borderColor: "border-yellow-400/50"
  },
  3: {
    name: "Menace Élevée",
    subtitle: "Haute Voltige", 
    skillRange: { min: 9, max: 12 },
    description: "Le premier vrai mur. Un runner, même avec une compétence à 10, n'est pas garanti de réussir. Le jet de dé devient crucial.",
    playerPrerequisites: "Utiliser ses meilleurs runners et commencer à penser à l'équipement du Marché Noir pour combler les lacunes.",
    icon: "💀💀💀",
    color: "text-orange-400",
    bgColor: "bg-orange-400/20",
    borderColor: "border-orange-400/50"
  },
  4: {
    name: "Menace Sévère",
    subtitle: "Zone de Guerre Corpo",
    skillRange: { min: 13, max: 16 },
    description: "Impossible à réussir sur la seule base des compétences naturelles. Le joueur est obligé d'utiliser des programmes 'one-shot' ou des Implants permanents pour augmenter les compétences de ses runners.",
    playerPrerequisites: "Investissement stratégique sur le Marché Noir.",
    icon: "💀💀💀💀",
    color: "text-red-400",
    bgColor: "bg-red-400/20",
    borderColor: "border-red-400/50"
  },
  5: {
    name: "Légende de Night City",
    subtitle: "Contrat Ultime",
    skillRange: { min: 17, max: 20 },
    description: "Le genre de contrat qui fait ou défait une légende. Un défi ultime qui requiert le meilleur runner, amélioré par des implants permanents, et équipé des meilleurs programmes 'one-shot'. Le risque d'échec critique est maximal.",
    playerPrerequisites: "Préparation de fin de jeu, maîtrise de tous les systèmes.",
    icon: "💀💀💀💀💀",
    color: "text-purple-400",
    bgColor: "bg-purple-400/20",
    borderColor: "border-purple-400/50"
  }
};

// Déterminer le niveau de menace basé sur la réputation du joueur
export function getAvailableThreatLevels(playerReputation) {
  const reputationLevel = getReputationLevel(playerReputation);
  
  switch (reputationLevel) {
    case 1: // Rumeur de la Rue
      return [1, 2]; // Seulement niveaux 1-2
    case 2: // Nom qui Circule  
      return [1, 2, 3]; // Niveaux 1-3
    case 3: // Faiseur de Rois
      return [1, 2, 3, 4]; // Niveaux 1-4
    case 4: // Légende de Night City
      return [1, 2, 3, 4, 5]; // Tous les niveaux
    default:
      return [1, 2]; // Fallback sécurisé
  }
}

// Obtenir le niveau de réputation (1-4)
function getReputationLevel(reputationPoints) {
  if (reputationPoints >= 1200) return 4;
  if (reputationPoints >= 501) return 3;
  if (reputationPoints >= 151) return 2;
  return 1;
}

// Générer des compétences requises basées sur un niveau de menace
export function generateRequiredSkillsFromThreatLevel(threatLevel, missionType = 'infiltration') {
  const level = THREAT_LEVELS[threatLevel];
  if (!level) {
    console.error(`Niveau de menace invalide: ${threatLevel}`);
    return { hacking: 3, stealth: 3, combat: 3 };
  }

  // Déterminer quelles compétences sont requises selon le type de mission
  let requiredSkills = { hacking: 0, stealth: 0, combat: 0 };
  
  switch (missionType) {
    case 'infiltration':
      requiredSkills.stealth = getRandomSkillValue(level.skillRange);
      requiredSkills.hacking = Math.random() > 0.5 ? getRandomSkillValue(level.skillRange) : 0;
      break;
    case 'sabotage':
      requiredSkills.hacking = getRandomSkillValue(level.skillRange);
      requiredSkills.combat = Math.random() > 0.5 ? getRandomSkillValue(level.skillRange) : 0;
      break;
    case 'assassinat':
      requiredSkills.stealth = getRandomSkillValue(level.skillRange);
      requiredSkills.combat = Math.random() > 0.5 ? getRandomSkillValue(level.skillRange) : 0;
      break;
    case 'récupération':
      requiredSkills.stealth = getRandomSkillValue(level.skillRange);
      requiredSkills.hacking = Math.random() > 0.5 ? getRandomSkillValue(level.skillRange) : 0;
      break;
    case 'destruction':
      requiredSkills.combat = getRandomSkillValue(level.skillRange);
      requiredSkills.hacking = Math.random() > 0.5 ? getRandomSkillValue(level.skillRange) : 0;
      break;
    default:
      // Mission équilibrée
      const skills = ['hacking', 'stealth', 'combat'];
      const numSkills = Math.floor(Math.random() * 2) + 1; // 1 ou 2 compétences
      const selectedSkills = shuffleArray(skills).slice(0, numSkills);
      
      selectedSkills.forEach(skill => {
        requiredSkills[skill] = getRandomSkillValue(level.skillRange);
      });
  }

  return requiredSkills;
}

// Obtenir une valeur de compétence aléatoire dans la fourchette du niveau
function getRandomSkillValue(range) {
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

// Mélanger un tableau (Fisher-Yates)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Déterminer le niveau de menace à partir des compétences requises (pour compatibilité)
export function determineThreatLevelFromSkills(requiredSkills) {
  const totalSkill = (requiredSkills.hacking || 0) + (requiredSkills.stealth || 0) + (requiredSkills.combat || 0);
  
  if (totalSkill <= 5) return 1;
  if (totalSkill <= 8) return 2;
  if (totalSkill <= 12) return 3;
  if (totalSkill <= 16) return 4;
  return 5;
}

// Calculer les récompenses basées sur le niveau de menace
export function calculateRewardsFromThreatLevel(threatLevel, factionMultiplier = 1.0) {
  const baseRewards = {
    1: { eddies: 8000, reputation: 15 },
    2: { eddies: 15000, reputation: 30 },
    3: { eddies: 25000, reputation: 50 },
    4: { eddies: 40000, reputation: 80 },
    5: { eddies: 60000, reputation: 120 }
  };

  const base = baseRewards[threatLevel] || baseRewards[1];
  
  // Ajouter de la variabilité (±20%)
  const eddiesVariation = 0.8 + (Math.random() * 0.4);
  
  return {
    eddies: Math.floor(base.eddies * factionMultiplier * eddiesVariation),
    reputation: base.reputation
  };
}

// Analyser le lore pour détecter les compétences testées
export function analyzeLoreForSkills(description) {
  const skillHints = {
    hacking: [
      'système', 'systèmes', 'ICE', 'cyber', 'virus', 'piratage', 'hack', 'hacking',
      'données', 'fichiers', 'réseau', 'sécurité informatique', 'firewall', 'encryption',
      'logiciel', 'programme', 'algorithme', 'base de données', 'serveur'
    ],
    stealth: [
      'infiltration', 'discrétion', 'furtif', 'silencieux', 'camouflage', 'éviter',
      'se cacher', 'passer inaperçu', 'surveillance', 'gardes', 'patrouille',
      'système de sécurité', 'détecteurs', 'caméras', 'alarmes', 'sans être vu'
    ],
    combat: [
      'combat', 'tir', 'tir de précision', 'armes', 'explosifs', 'grenades',
      'neutraliser', 'éliminer', 'tuer', 'assassiner', 'tuerie', 'bataille',
      'confrontation', 'escarmouche', 'embuscade', 'assaut', 'raid'
    ]
  };

  const detectedSkills = {};
  const lowerDescription = description.toLowerCase();

  Object.entries(skillHints).forEach(([skill, hints]) => {
    const matches = hints.filter(hint => lowerDescription.includes(hint));
    if (matches.length > 0) {
      detectedSkills[skill] = matches.length; // Plus de matches = plus probable
    }
  });

  return detectedSkills;
} 