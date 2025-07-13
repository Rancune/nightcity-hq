// src/Lib/reputation.js

// Définition des difficultés et leurs points de réputation de base
export const REPUTATION_DIFFICULTIES = {
  EASY: {
    name: "Facile",
    basePoints: 10,
    description: "Livraison simple, intimidation de bas étage"
  },
  MEDIUM: {
    name: "Moyenne", 
    basePoints: 25,
    description: "Sabotage mineur, espionnage basique"
  },
  HARD: {
    name: "Difficile",
    basePoints: 50,
    description: "Extraction de cible, protection de témoin"
  },
  VERY_HARD: {
    name: "Très Difficile",
    basePoints: 100,
    description: "Assaut de QG corpo, vol de prototype"
  }
};

// Bonus de style pour les missions
export const STYLE_BONUSES = {
  PERFECT_STEALTH: {
    name: "Discrétion Parfaite",
    multiplier: 0.15, // +15%
    description: "Mission accomplie sans être détecté"
  },
  SECONDARY_OBJECTIVE: {
    name: "Objectif Secondaire",
    multiplier: 0.10, // +10% par objectif
    description: "Objectif secondaire réussi"
  },
  ULTRA_FAST: {
    name: "Ultra-Rapide",
    multiplier: 0.05, // +5%
    description: "Mission accomplie en temps record"
  },
  NO_COLLATERAL: {
    name: "Sans Dommages Collatéraux",
    multiplier: 0.10, // +10%
    description: "Aucun dommage collatéral"
  }
};

// Calcul des points de réputation pour une mission réussie
export function calculateReputationGain(difficulty, styleBonuses = [], secondaryObjectives = 0) {
  const basePoints = REPUTATION_DIFFICULTIES[difficulty]?.basePoints || 0;
  let totalPoints = basePoints;
  
  // Appliquer les bonus de style
  styleBonuses.forEach(bonus => {
    if (STYLE_BONUSES[bonus]) {
      totalPoints += Math.floor(basePoints * STYLE_BONUSES[bonus].multiplier);
    }
  });
  
  // Bonus pour les objectifs secondaires
  if (secondaryObjectives > 0) {
    totalPoints += Math.floor(basePoints * STYLE_BONUSES.SECONDARY_OBJECTIVE.multiplier * secondaryObjectives);
  }
  
  return totalPoints;
}

// Calcul de la perte de réputation pour une mission échouée
export function calculateReputationLoss(difficulty, isCriticalFailure = false) {
  const basePoints = REPUTATION_DIFFICULTIES[difficulty]?.basePoints || 0;
  
  if (isCriticalFailure) {
    return basePoints * 2; // Pénalité doublée pour échec critique
  }
  
  return basePoints; // Pénalité normale
}

// Déterminer la difficulté basée sur les compétences requises
export function determineDifficulty(requiredSkills) {
  const totalSkill = (requiredSkills.hacking || 0) + (requiredSkills.stealth || 0) + (requiredSkills.combat || 0);
  
  if (totalSkill <= 6) return 'EASY';
  if (totalSkill <= 12) return 'MEDIUM';
  if (totalSkill <= 18) return 'HARD';
  return 'VERY_HARD';
}

// Obtenir les informations sur un niveau de réputation
export function getReputationLevelInfo(points) {
  if (points >= 2500) {
    return {
      level: 5,
      title: "Mythe Urbain",
      description: "Tu es une légende vivante, un mythe de la rue. Les corpos te craignent, les gangs te respectent.",
      missions: "Contrats uniques, accès à tout le marché noir, missions spéciales mythiques",
      equipment: "Accès à l'équipement légendaire, bonus maximum",
      nextLevel: null
    };
  } else if (points >= 1200) {
    return {
      level: 4,
      title: "Légende de Night City",
      description: "Ton nom est un murmure dans les hautes sphères. Tu es une force de la nature.",
      missions: "Contrats qui peuvent redéfinir l'équilibre du pouvoir de toute la ville",
      equipment: "Accès au marché noir épique, armes et cyberwares épiques",
      nextLevel: 2500
    };
  } else if (points >= 501) {
    return {
      level: 3,
      title: "Faiseur de Rois",
      description: "Tu n'es plus un simple pion. Les corpos et les gangs majeurs te contactent directement.",
      missions: "Contrats à fort impact, détournement de convoi, manipulation d'élection",
      equipment: "Accès à du matériel rare et iconique, Ripperdoc exclusif",
      nextLevel: 1200
    };
  } else if (points >= 151) {
    return {
      level: 2,
      title: "Nom qui Circule",
      description: "On commence à parler de toi dans les bons cercles. Tu as prouvé que tu n'étais pas un amateur.",
      missions: "Contrats plus complexes, espionnage corpo, protection de témoin",
      equipment: "Accès à de l'équipement peu commun, réductions de 5%",
      nextLevel: 501
    };
  } else {
    return {
      level: 1,
      title: "Rumeur de la Rue",
      description: "Tu es un nom parmi d'autres. On te confie les sales boulots que personne ne veut.",
      missions: "Contrats de base, livraisons, intimidations de bas étage",
      equipment: "Accès aux vendeurs standards, équipement commun",
      nextLevel: 151
    };
  }
}

// Générer un rapport de réputation détaillé
export function generateReputationReport(playerProfile) {
  const levelInfo = getReputationLevelInfo(playerProfile.reputationPoints);
  const progressToNext = levelInfo.nextLevel 
    ? Math.floor((playerProfile.reputationPoints / levelInfo.nextLevel) * 100)
    : 100;
  
  return {
    currentLevel: levelInfo,
    progressToNext,
    statistics: {
      missionsCompleted: playerProfile.missionsCompleted,
      missionsFailed: playerProfile.missionsFailed,
      successRate: playerProfile.missionsCompleted + playerProfile.missionsFailed > 0 
        ? Math.floor((playerProfile.missionsCompleted / (playerProfile.missionsCompleted + playerProfile.missionsFailed)) * 100)
        : 0,
      totalGained: playerProfile.totalReputationGained,
      totalLost: playerProfile.totalReputationLost
    }
  };
} 