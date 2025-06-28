// src/Lib/factionRelations.js

// Définition des factions et leurs relations
export const FACTIONS = {
  // Mégacorpos
  arasaka: {
    name: "Arasaka",
    type: "megacorp",
    description: "Empire corporatif japonais, spécialisé dans la sécurité et l'armement",
    allies: ["kangTao"],
    enemies: ["militech", "netWatch"],
    neutral: ["voodooBoys"],
    currency: "argent et contrôle",
    retaliation: "systémique : sécurité renforcée, espionnage industriel, listes noires"
  },
  militech: {
    name: "Militech",
    type: "megacorp", 
    description: "Corporation américaine d'armement et de sécurité",
    allies: ["ncpd"],
    enemies: ["arasaka", "maelstrom"],
    neutral: ["valentinos"],
    currency: "argent et contrôle",
    retaliation: "systémique : sécurité renforcée, espionnage industriel, listes noires"
  },
  kangTao: {
    name: "Kang Tao",
    type: "megacorp",
    description: "Corporation chinoise spécialisée dans les technologies avancées",
    allies: ["arasaka"],
    enemies: ["militech"],
    neutral: ["netWatch"],
    currency: "argent et contrôle",
    retaliation: "systémique : sécurité renforcée, espionnage industriel, listes noires"
  },
  netWatch: {
    name: "NetWatch",
    type: "megacorp",
    description: "Agence de surveillance du Net et de cybersécurité",
    allies: [],
    enemies: ["arasaka", "voodooBoys"],
    neutral: ["kangTao"],
    currency: "argent et contrôle",
    retaliation: "systémique : sécurité renforcée, espionnage industriel, listes noires"
  },
  
  // Gangs
  maelstrom: {
    name: "Maelstrom",
    type: "gang",
    description: "Gang cyberpunk violent et imprévisible",
    allies: [],
    enemies: ["militech", "ncpd", "traumaTeam"],
    neutral: ["scavengers"],
    currency: "respect et territoire",
    retaliation: "directe et violente : embuscades, contrats sur la tête du joueur"
  },
  valentinos: {
    name: "Valentinos",
    type: "gang",
    description: "Gang hispanique avec un code d'honneur",
    allies: [],
    enemies: ["scavengers"],
    neutral: ["militech", "ncpd"],
    currency: "respect et territoire",
    retaliation: "directe et violente : embuscades, contrats sur la tête du joueur"
  },
  voodooBoys: {
    name: "Voodoo Boys",
    type: "gang",
    description: "Gang haïtien spécialisé dans le hacking",
    allies: [],
    enemies: ["netWatch"],
    neutral: ["arasaka", "scavengers"],
    currency: "respect et territoire",
    retaliation: "directe et violente : embuscades, contrats sur la tête du joueur"
  },
  animals: {
    name: "Animals",
    type: "gang",
    description: "Gang de bodybuilders cybernétiques",
    allies: [],
    enemies: ["ncpd"],
    neutral: ["scavengers"],
    currency: "respect et territoire",
    retaliation: "directe et violente : embuscades, contrats sur la tête du joueur"
  },
  scavengers: {
    name: "Scavengers",
    type: "gang",
    description: "Gang qui récupère et revend des implants",
    allies: [],
    enemies: ["valentinos", "traumaTeam"],
    neutral: ["maelstrom", "voodooBoys", "animals"],
    currency: "respect et territoire",
    retaliation: "directe et violente : embuscades, contrats sur la tête du joueur"
  },
  
  // Autorités
  ncpd: {
    name: "NCPD",
    type: "authority",
    description: "Police de Night City",
    allies: ["militech", "traumaTeam"],
    enemies: ["maelstrom", "animals"],
    neutral: ["valentinos"],
    currency: "la loi (leur version de la loi)",
    retaliation: "officielle : mandats d'arrêt, interventions plus rapides et plus brutales"
  },
  maxTac: {
    name: "MaxTac",
    type: "authority",
    description: "Unité d'intervention spéciale anti-cyberpsycho",
    allies: ["ncpd"],
    enemies: ["maelstrom", "animals"],
    neutral: ["valentinos"],
    currency: "la loi (leur version de la loi)",
    retaliation: "officielle : mandats d'arrêt, interventions plus rapides et plus brutales"
  },
  traumaTeam: {
    name: "Trauma Team",
    type: "authority",
    description: "Service médical d'urgence",
    allies: ["ncpd"],
    enemies: ["maelstrom", "scavengers"],
    neutral: ["fixers"],
    currency: "la loi (leur version de la loi)",
    retaliation: "officielle : mandats d'arrêt, interventions plus rapides et plus brutales"
  },
  
  // Instances Politiques
  conseilMunicipal: {
    name: "Conseil Municipal",
    type: "political",
    description: "Gouvernement local de Night City",
    allies: ["ncpd"],
    enemies: [],
    neutral: ["fixers", "ripperdocs"],
    currency: "l'influence",
    retaliation: "insidieuse : blocages administratifs, augmentation des taxes sur les services, diffamation"
  },
  lobbyistes: {
    name: "Lobbyistes",
    type: "political",
    description: "Groupes de pression corporatifs et politiques",
    allies: ["arasaka", "militech", "kangTao"],
    enemies: [],
    neutral: ["fixers"],
    currency: "l'influence",
    retaliation: "insidieuse : blocages administratifs, augmentation des taxes sur les services, diffamation"
  },
  
  // Inframonde & Civils
  inframonde: {
    name: "Inframonde",
    type: "underground",
    description: "Ripperdocs, contrebandiers, et citoyens de Night City",
    allies: [],
    enemies: [],
    neutral: ["fixers", "ripperdocs", "nomads"],
    currency: "l'information",
    retaliation: "imprévisible : fuites d'informations vers d'autres factions, augmentation des prix sur le marché noir"
  },
  
  // Autres (pour compatibilité)
  fixers: {
    name: "Fixers",
    type: "other",
    description: "Intermédiaires et arrangeurs",
    allies: [],
    enemies: [],
    neutral: ["traumaTeam", "ripperdocs", "nomads"],
    currency: "l'information",
    retaliation: "imprévisible : fuites d'informations vers d'autres factions, augmentation des prix sur le marché noir"
  },
  ripperdocs: {
    name: "Ripperdocs",
    type: "other",
    description: "Chirurgiens cybernétiques",
    allies: [],
    enemies: [],
    neutral: ["fixers", "nomads"],
    currency: "l'information",
    retaliation: "imprévisible : fuites d'informations vers d'autres factions, augmentation des prix sur le marché noir"
  },
  nomads: {
    name: "Nomads",
    type: "other",
    description: "Voyageurs et convoyeurs",
    allies: [],
    enemies: [],
    neutral: ["fixers", "ripperdocs"],
    currency: "l'information",
    retaliation: "imprévisible : fuites d'informations vers d'autres factions, augmentation des prix sur le marché noir"
  }
};

// Calcul des impacts de relation pour un contrat
export function calculateFactionImpacts(contract, isSuccess, recentActivity = {}) {
  const impacts = {};
  const threatImpacts = {};
  
  // Impact de base selon le type de faction
  const baseReputationImpact = isSuccess ? 50 : -25;
  const baseThreatImpact = isSuccess ? 0 : 2; // Échec augmente la menace
  
  // Déterminer la cible du contrat (si spécifiée)
  const targetFaction = contract.targetFaction || contract.targetCorpo?.toLowerCase();
  
  if (targetFaction && FACTIONS[targetFaction]) {
    // Impact direct sur la cible
    impacts[targetFaction] = isSuccess ? -baseReputationImpact : baseReputationImpact;
    
    // Impact sur la menace : échec augmente la menace
    if (!isSuccess) {
      threatImpacts[targetFaction] = baseThreatImpact;
    }
    
    // Vérifier l'activité récente contre cette faction
    if (recentActivity[targetFaction] && recentActivity[targetFaction].count >= 3) {
      // Trop d'activité récente = augmentation de la menace
      threatImpacts[targetFaction] = (threatImpacts[targetFaction] || 0) + 1;
    }
    
    // Impacts sur les alliés de la cible
    FACTIONS[targetFaction].allies.forEach(ally => {
      impacts[ally] = isSuccess ? -Math.floor(baseReputationImpact * 0.5) : Math.floor(baseReputationImpact * 0.5);
    });
    
    // Impacts sur les ennemis de la cible
    FACTIONS[targetFaction].enemies.forEach(enemy => {
      impacts[enemy] = isSuccess ? Math.floor(baseReputationImpact * 0.5) : -Math.floor(baseReputationImpact * 0.5);
    });
  }
  
  // Impact sur l'employeur (si différent de la cible)
  if (contract.employerFaction && contract.employerFaction !== targetFaction) {
    impacts[contract.employerFaction] = isSuccess ? baseReputationImpact : -baseReputationImpact;
  }
  
  return { impacts, threatImpacts };
}

// Calculer la dégradation temporelle de la menace (appelée périodiquement)
export function calculateThreatDecay(factionRelations, daysSinceLastActivity = 1) {
  const decayRate = 0.1; // 10% de réduction par jour d'inactivité
  const threatDecay = {};
  
  Object.keys(factionRelations.threatLevels).forEach(faction => {
    const currentThreat = factionRelations.threatLevels[faction] || 0;
    if (currentThreat > 0) {
      const decay = Math.min(currentThreat, currentThreat * decayRate * daysSinceLastActivity);
      threatDecay[faction] = -decay;
    }
  });
  
  return threatDecay;
}

// Déterminer les conséquences d'une relation négative selon le type de faction
export function getNegativeConsequences(faction, threatLevel, factionType) {
  const consequences = [];
  
  switch (factionType) {
    case 'megacorp':
      if (threatLevel >= 8) {
        consequences.push({
          type: "security_upgrade",
          description: "Sécurité renforcée, contrats plus difficiles",
          severity: "critical"
        });
      }
      if (threatLevel >= 6) {
        consequences.push({
          type: "blacklist",
          description: "Liste noire, accès restreint",
          severity: "high"
        });
      }
      if (threatLevel >= 4) {
        consequences.push({
          type: "surveillance",
          description: "Surveillance accrue",
          severity: "medium"
        });
      }
      break;
      
    case 'gang':
      if (threatLevel >= 8) {
        consequences.push({
          type: "assassination_contract",
          description: "Contrat d'assassinat contre vos netrunners",
          severity: "critical"
        });
      }
      if (threatLevel >= 6) {
        consequences.push({
          type: "ambush",
          description: "Risque d'embuscade",
          severity: "high"
        });
      }
      if (threatLevel >= 4) {
        consequences.push({
          type: "territory_denial",
          description: "Accès refusé à leurs territoires",
          severity: "medium"
        });
      }
      break;
      
    case 'authority':
      if (threatLevel >= 8) {
        consequences.push({
          type: "warrant",
          description: "Mandat d'arrêt actif",
          severity: "critical"
        });
      }
      if (threatLevel >= 6) {
        consequences.push({
          type: "rapid_response",
          description: "Interventions plus rapides et brutales",
          severity: "high"
        });
      }
      if (threatLevel >= 4) {
        consequences.push({
          type: "increased_patrols",
          description: "Patrouilles renforcées",
          severity: "medium"
        });
      }
      break;
      
    case 'political':
      if (threatLevel >= 8) {
        consequences.push({
          type: "administrative_block",
          description: "Blocages administratifs majeurs",
          severity: "critical"
        });
      }
      if (threatLevel >= 6) {
        consequences.push({
          type: "tax_increase",
          description: "Augmentation des taxes sur vos services",
          severity: "high"
        });
      }
      if (threatLevel >= 4) {
        consequences.push({
          type: "defamation",
          description: "Campagne de diffamation",
          severity: "medium"
        });
      }
      break;
      
    case 'underground':
    default:
      if (threatLevel >= 8) {
        consequences.push({
          type: "information_leak",
          description: "Fuites d'informations vers d'autres factions",
          severity: "critical"
        });
      }
      if (threatLevel >= 6) {
        consequences.push({
          type: "price_increase",
          description: "Augmentation des prix sur le marché noir",
          severity: "high"
        });
      }
      if (threatLevel >= 4) {
        consequences.push({
          type: "service_denial",
          description: "Services refusés",
          severity: "medium"
        });
      }
      break;
  }
  
  return consequences;
}

// Déterminer les opportunités d'une relation positive selon le type de faction
export function getPositiveOpportunities(faction, relationValue, factionType) {
  const opportunities = [];
  
  switch (factionType) {
    case 'megacorp':
      if (relationValue >= 500) {
        opportunities.push({
          type: "exclusive_contracts",
          description: "Contrats exclusifs de haut niveau",
          rarity: "legendary"
        });
        opportunities.push({
          type: "corporate_access",
          description: "Accès aux installations corporatives",
          rarity: "legendary"
        });
      }
      if (relationValue >= 200) {
        opportunities.push({
          type: "special_vendors",
          description: "Accès aux vendeurs corporatifs",
          rarity: "rare"
        });
      }
      if (relationValue >= 50) {
        opportunities.push({
          type: "information_sharing",
          description: "Partage d'informations privilégiées",
          rarity: "uncommon"
        });
      }
      break;
      
    case 'gang':
      if (relationValue >= 500) {
        opportunities.push({
          type: "territory_access",
          description: "Accès libre à leurs territoires",
          rarity: "legendary"
        });
        opportunities.push({
          type: "gang_protection",
          description: "Protection contre d'autres gangs",
          rarity: "legendary"
        });
      }
      if (relationValue >= 200) {
        opportunities.push({
          type: "underground_contacts",
          description: "Contacts dans l'underground",
          rarity: "rare"
        });
      }
      if (relationValue >= 50) {
        opportunities.push({
          type: "safe_passage",
          description: "Passage sûr dans leurs zones",
          rarity: "uncommon"
        });
      }
      break;
      
    case 'authority':
      if (relationValue >= 500) {
        opportunities.push({
          type: "legal_immunity",
          description: "Immunité légale pour certaines actions",
          rarity: "legendary"
        });
      }
      if (relationValue >= 200) {
        opportunities.push({
          type: "reduced_response",
          description: "Interventions plus lentes",
          rarity: "rare"
        });
      }
      if (relationValue >= 50) {
        opportunities.push({
          type: "information_access",
          description: "Accès aux bases de données",
          rarity: "uncommon"
        });
      }
      break;
      
    case 'political':
      if (relationValue >= 500) {
        opportunities.push({
          type: "political_favor",
          description: "Faveurs politiques majeures",
          rarity: "legendary"
        });
      }
      if (relationValue >= 200) {
        opportunities.push({
          type: "tax_reduction",
          description: "Réductions fiscales",
          rarity: "rare"
        });
      }
      if (relationValue >= 50) {
        opportunities.push({
          type: "bureaucratic_ease",
          description: "Procédures administratives simplifiées",
          rarity: "uncommon"
        });
      }
      break;
      
    case 'underground':
    default:
      if (relationValue >= 500) {
        opportunities.push({
          type: "exclusive_information",
          description: "Informations exclusives du marché noir",
          rarity: "legendary"
        });
      }
      if (relationValue >= 200) {
        opportunities.push({
          type: "discount_prices",
          description: "Prix réduits sur le marché noir",
          rarity: "rare"
        });
      }
      if (relationValue >= 50) {
        opportunities.push({
          type: "rumor_network",
          description: "Accès au réseau de rumeurs",
          rarity: "uncommon"
        });
      }
      break;
  }
  
  return opportunities;
}

// Générer un contrat de représailles
export function generateRetaliationContract(targetPlayer, faction, threatLevel) {
  const contract = {
    title: `Représailles ${FACTIONS[faction].name}`,
    description: `La ${FACTIONS[faction].name} cherche à se venger de vos actions. Un contrat a été émis pour neutraliser vos assets.`,
    type: "retaliation",
    targetFaction: faction,
    threatLevel: threatLevel,
    reward: {
      eddies: 15000 + (threatLevel * 2000),
      reputation: 100 + (threatLevel * 20)
    },
    requiredSkills: {
      hacking: Math.min(10, 3 + threatLevel),
      stealth: Math.min(10, 3 + threatLevel),
      combat: Math.min(10, 3 + threatLevel)
    },
    isExclusive: true,
    targetPlayerId: targetPlayer.clerkId
  };
  
  return contract;
} 