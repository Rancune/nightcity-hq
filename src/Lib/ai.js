// src/lib/ai.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// On vérifie si la clé API est bien chargée depuis le .env.local
console.log("Clé API Gemini chargée (premiers 5 caractères):", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) + '...' : 'NON DÉFINIE !');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateContractLore() {
  console.log("[IA] Début de la génération de lore...");
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const model2 = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const model3 = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

  const prompt = `
    Tu es un Fixer dans l'univers de Cyberpunk 2077. 
    Génère un contrat de mercenaire unique avec des informations sur les factions impliquées.
    
    Réponds UNIQUEMENT avec un objet JSON au format suivant:
    {
      "title": "Titre court et percutant",
      "description": "Description immersive de 4-5 phrases avec l'argot de Night City",
      "factions": ["faction1", "faction2"],
      "difficulty": "facile|moyen|difficile|expert",
      "type": "infiltration|sabotage|assassinat|récupération|destruction"
    }
    
    FACTIONS DISPONIBLES :
    - arasaka (mégacorpo japonais)
    - militech (mégacorpo américain)
    - kangTao (mégacorpo chinois)
    - netWatch (surveillance du Net)
    - maelstrom (gang violent)
    - valentinos (gang hispanique)
    - voodooBoys (gang haïtien)
    - animals (gang de bodybuilders)
    - scavengers (gang d'implants)
    - ncpd (police)
    - maxTac (anti-cyberpsycho)
    - traumaTeam (médical)
    - conseilMunicipal (politique)
    - lobbyistes (pression politique)
    - inframonde (marché noir)
    
    EXEMPLES :
    {
      "title": "Infiltration Arasaka",
      "description": "Un contact mystérieux veut des données sensibles de la tour Arasaka. Infiltrez les systèmes de sécurité, récupérez les fichiers et sortez sans vous faire repérer. Les ICE sont redoutables, choomba.",
      "factions": ["arasaka", "inframonde"],
      "difficulty": "difficile",
      "type": "infiltration"
    }
    
    {
      "title": "Sabotage Militech",
      "description": "Un rival corporatiste paie bien pour que l'usine Militech ait des problèmes. Détruisez les systèmes de production, faites sauter les générateurs. Discrétion requise, les gardes sont armés jusqu'aux dents.",
      "factions": ["militech", "arasaka"],
      "difficulty": "expert",
      "type": "sabotage"
    }
    
    Le thème du contrat peut être : sabotage industriel, infiltration, assassinat, récupération de données, vol d'objet rare, destruction d'infrastructure, etc.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // On affiche la réponse brute de l'IA avant de la parser
    console.log("[IA] Réponse brute reçue de Gemini:", text);

     // --- NOUVELLE ÉTAPE DE NETTOYAGE ---
        // On utilise une expression régulière pour trouver la première accolade {
        // jusqu'à la dernière accolade }, et tout ce qu'il y a entre.
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch && jsonMatch[0]) {
            // Si on a trouvé une correspondance, on extrait uniquement cette partie
            text = jsonMatch[0];
            console.log("[IA] Texte nettoyé, prêt pour le parsing:", text);
        } else {
            // Si on ne trouve pas de JSON, on lance une erreur
            throw new Error("La réponse de l'IA ne contient pas de JSON valide.");
        }
        // ------------------------------------

    const parsedJson = JSON.parse(text);
    console.log("[IA] JSON parsé avec succès.");
    return parsedJson;
  } catch (error) {
    console.error("[IA] ERREUR LORS DE LA COMMUNICATION AVEC GEMINI:", error);
    
    // Gestion spécifique des erreurs de service
    if (error.status === 503) {
      console.error("[IA] Service Gemini temporairement indisponible (503). Utilisation du fallback.");
    } else if (error.message && error.message.includes('overloaded')) {
      console.error("[IA] Service Gemini surchargé. Utilisation du fallback.");
    }
    
    // Fallback avec des contrats prédéfinis incluant les factions
    const fallbackContracts = [
      {
        title: "Infiltration Arasaka",
        description: "Un contact mystérieux veut des données sensibles de la tour Arasaka. Infiltrez les systèmes de sécurité, récupérez les fichiers et sortez sans vous faire repérer. Les ICE sont redoutables, choomba.",
        factions: ["arasaka", "inframonde"],
        difficulty: "difficile",
        type: "infiltration"
      },
      {
        title: "Sabotage Militech",
        description: "Un rival corporatiste paie bien pour que l'usine Militech ait des problèmes. Détruisez les systèmes de production, faites sauter les générateurs. Discrétion requise, les gardes sont armés jusqu'aux dents.",
        factions: ["militech", "arasaka"],
        difficulty: "expert",
        type: "sabotage"
      },
      {
        title: "Récupération de Marchandise",
        description: "Un fixer a perdu un colis important dans les bas-fonds. Trouvez-le avant que les gangs ne s'en emparent. Le contenu vaut une fortune en eddies, mais attention aux vautours.",
        factions: ["scavengers", "inframonde"],
        difficulty: "moyen",
        type: "récupération"
      },
      {
        title: "Assassinat Ciblé",
        description: "Un corpo de Kang Tao doit disparaître. Il fréquente les clubs huppés du centre-ville. Éliminez-le proprement, faites-le passer pour un accident. Pas de témoins, pas de traces.",
        factions: ["kangTao", "ncpd"],
        difficulty: "expert",
        type: "assassinat"
      },
      {
        title: "Vol de Prototype",
        description: "NetWatch développe un nouveau virus de contrôle mental. Récupérez le prototype avant qu'ils ne le testent sur la population. Les labos sont ultra-sécurisés, mais les récompenses sont énormes.",
        factions: ["netWatch", "inframonde"],
        difficulty: "expert",
        type: "récupération"
      }
    ];
    
    const randomContract = fallbackContracts[Math.floor(Math.random() * fallbackContracts.length)];
    console.log("[IA] Utilisation du contrat de fallback:", randomContract.title);
    return randomContract;
  }
}

// NOUVELLE FONCTION POUR LE RAPPORT DE MISSION
export async function generateResolutionLore(contractTitle, runnerName, isSuccess, contractData = {}) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Extraire les informations du contrat pour le contexte
  const contractDescription = contractData.description || "";
  const requiredSkills = contractData.requiredSkills || {};
  const reward = contractData.reward || {};

  // Un prompt spécifique pour raconter l'issue de la mission avec contexte des factions
  const prompt = `
    Tu es un Fixer qui écrit un rapport de mission détaillé dans l'univers de Cyberpunk 2077.
    
    CONTEXTE DE LA MISSION :
    - Titre : "${contractTitle}"
    - Description : "${contractDescription}"
    - Netrunner : "${runnerName}"
    - Résultat : ${isSuccess ? 'SUCCÈS' : 'ÉCHEC'}
    - Compétences requises : ${Object.keys(requiredSkills).join(', ')}
    - Récompense : ${reward.eddies || 0} eddies
    
    TÂCHE :
    Génère un rapport de mission en 3-4 phrases qui :
    1. Raconte ce qui s'est passé pendant la mission
    2. Mentionne les factions impliquées (Arasaka, Militech, Kang Tao, NetWatch, Maelstrom, Valentinos, Voodoo Boys, Animals, Scavengers, NCPD, MaxTac, Trauma Team, etc.)
    3. Explique les conséquences sur la réputation du joueur
    4. Utilise l'argot de Night City (choomba, corpo, eddies, etc.)
    
    EXEMPLE DE SUCCÈS :
    "Le boulot contre Arasaka s'est bien passé. ${runnerName} a infiltré leurs systèmes de sécurité comme un pro, a choppé les données sensibles et est parti avant même que les ICE ne se réveillent. Les corpos d'Arasaka vont être furieux, mais notre réputation dans l'inframonde va grimper en flèche. Les autres fixers vont nous respecter davantage."
    
    EXEMPLE D'ÉCHEC :
    "La mission contre Militech a tourné au vinaigre. ${runnerName} s'est fait repérer par leurs gardes, l'alarme a hurlé et il a dû se déconnecter en urgence. Militech va renforcer leur sécurité et notre réputation va en prendre un coup. Les autres corpos vont nous voir comme des amateurs."
    
    Réponds UNIQUEMENT avec le texte du rapport. Pas de JSON, pas de fioritures, juste le texte brut.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // On affiche la réponse brute de l'IA
    console.log("[IA] Réponse brute reçue de Gemini pour le débriefing:", text);

    // On retourne directement le texte
    return text;

  } catch (error) {
    console.error("[IA] ERREUR LORS DE LA GÉNÉRATION DU RAPPORT:", error);
    
    // Fallback avec des rapports prédéfinis incluant les factions
    if (isSuccess) {
      return `${runnerName} a accompli la mission "${contractTitle}" avec succès. Les objectifs ont été atteints et la réputation du fixer s'en trouve renforcée. Le client est satisfait et les eddies sont dans la poche.`;
    } else {
      return `${runnerName} a échoué dans la mission "${contractTitle}". Les complications ont été trop importantes et le contrat a dû être abandonné. La réputation en prend un coup, mais c'est le risque du métier.`;
    }
  }
}

// NOUVELLE FONCTION POUR ANALYSER LE LORE ET EXTRAIRE LES FACTIONS
export function extractFactionsFromLore(loreText) {
  const factions = [];
  const loreLower = loreText.toLowerCase();
  
  // Mapping des noms de factions et leurs variations
  const factionKeywords = {
    'arasaka': ['arasaka', 'corpo japonais', 'japonais'],
    'militech': ['militech', 'corpo américain', 'américain'],
    'kangTao': ['kang tao', 'kangtao', 'chinois'],
    'netWatch': ['netwatch', 'net watch', 'surveillance'],
    'maelstrom': ['maelstrom', 'gang violent'],
    'valentinos': ['valentinos', 'hispanique'],
    'voodooBoys': ['voodoo boys', 'voodoo', 'haïtien'],
    'animals': ['animals', 'bodybuilder'],
    'scavengers': ['scavengers', 'scav', 'implants'],
    'ncpd': ['ncpd', 'police', 'cops'],
    'maxTac': ['maxtac', 'max tac', 'cyberpsycho'],
    'traumaTeam': ['trauma team', 'trauma', 'médical'],
    'conseilMunicipal': ['conseil municipal', 'gouvernement', 'politique'],
    'lobbyistes': ['lobbyiste', 'lobby', 'pression'],
    'inframonde': ['inframonde', 'underground', 'marché noir'],
    'fixers': ['fixer', 'arrangeur'],
    'ripperdocs': ['ripperdoc', 'chirurgien'],
    'nomads': ['nomad', 'voyageur']
  };
  
  // Vérifier chaque faction
  Object.entries(factionKeywords).forEach(([factionKey, keywords]) => {
    const isMentioned = keywords.some(keyword => loreLower.includes(keyword));
    if (isMentioned) {
      factions.push(factionKey);
    }
  });
  
  return factions;
}

// NOUVELLE FONCTION POUR CALCULER LES IMPACTS DE RÉPUTATION BASÉS SUR LE LORE
export function calculateReputationFromLore(loreText, isSuccess, baseReputation) {
  const factions = extractFactionsFromLore(loreText);
  let reputationModifier = 1.0;
  let factionImpacts = {};
  
  // Analyser le ton et le contexte du lore
  const loreLower = loreText.toLowerCase();
  const isHighProfile = loreLower.includes('arasaka') || loreLower.includes('militech') || loreLower.includes('netwatch');
  const isViolent = loreLower.includes('mort') || loreLower.includes('tuer') || loreLower.includes('assassinat');
  const isStealth = loreLower.includes('infiltration') || loreLower.includes('discret') || loreLower.includes('silencieux');
  const isPublic = loreLower.includes('public') || loreLower.includes('visible') || loreLower.includes('spectaculaire');
  
  // Modificateurs basés sur le contexte
  if (isHighProfile) {
    reputationModifier *= isSuccess ? 1.5 : 0.7; // Plus d'impact pour les grosses corpos
  }
  
  if (isViolent) {
    reputationModifier *= isSuccess ? 1.2 : 0.8; // Violence = plus de réputation
  }
  
  if (isStealth) {
    reputationModifier *= isSuccess ? 1.3 : 0.9; // Discrétion = bonne réputation
  }
  
  if (isPublic) {
    reputationModifier *= isSuccess ? 1.4 : 0.6; // Public = gros impact
  }
  
  // Calculer les impacts spécifiques aux factions
  factions.forEach(faction => {
    let impact = baseReputation * reputationModifier;
    
    // Ajuster selon le type de faction
    if (['arasaka', 'militech', 'kangTao', 'netWatch'].includes(faction)) {
      impact *= isSuccess ? 1.5 : 0.7; // Mégacorpos = gros impact
    } else if (['ncpd', 'maxTac', 'traumaTeam'].includes(faction)) {
      impact *= isSuccess ? 1.3 : 0.8; // Autorités = impact moyen
    } else if (['maelstrom', 'animals', 'scavengers'].includes(faction)) {
      impact *= isSuccess ? 1.1 : 0.9; // Gangs violents = impact faible
    }
    
    factionImpacts[faction] = Math.round(impact);
  });
  
  return {
    totalReputation: Math.round(baseReputation * reputationModifier),
    factionImpacts,
    factions,
    context: {
      isHighProfile,
      isViolent,
      isStealth,
      isPublic
    }
  };
}

// NOUVELLE FONCTION POUR GÉNÉRER NOM ET LORE DE RUNNER
export async function generateRunnerNameAndLore(skills = null) {
  console.log("[IA] Début de la génération de nom et lore de runner...");
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Préparer les informations sur les compétences pour le contexte
  let skillsContext = "";
  if (skills) {
    const totalPower = skills.hacking + skills.stealth + skills.combat;
    skillsContext = `
    COMPÉTENCES DU RUNNER :
    - Hacking: ${skills.hacking}/10
    - Stealth: ${skills.stealth}/10  
    - Combat: ${skills.combat}/10
    - Puissance totale: ${totalPower}/30
    `;
  }

  const prompt = `
    Tu es un Fixer dans l'univers de Cyberpunk 2077 qui recrute des netrunners.
    Génère un nom et un background unique pour un nouveau runner.
    
    ${skillsContext}
    
    Réponds UNIQUEMENT avec un objet JSON au format suivant:
    {
      "name": "Prénom Nom",
      "lore": "Background détaillé de 3-4 phrases avec l'argot de Night City"
    }
    
    RÈGLES POUR LE NOM :
    - Prénom + Nom de famille
    - Style cyberpunk : noms courts, percutants, parfois avec des références tech
    - Exemples : "Jax Vector", "Cyra Byte", "Kael Chrome", "Nyx Neon", "Rogue Silas", "Spike Zero", "Vex Glitch"
    - Éviter les noms trop longs ou compliqués
    
    RÈGLES POUR LE LORE :
    - 3-4 phrases maximum
    - Mentionner l'origine, l'expérience, la spécialité
    - Utiliser l'argot de Night City (choomba, corpo, eddies, ICE, etc.)
    - Adapter le background aux compétences si fournies
    - Style immersif et authentique
    
    EXEMPLES :
    {
      "name": "Jax Vector",
      "lore": "Ancien corpo d'Arasaka reconverti dans le hacking illégal. Spécialiste de l'infiltration des systèmes corporatistes, Jax a appris à survivre dans les bas-fonds de Night City après avoir été trahi par ses anciens employeurs. Son expertise en hacking et sa discrétion en font un runner redoutable."
    }
    
    {
      "name": "Cyra Byte", 
      "lore": "Jeune prodige du code sortie des rues de Pacifica. Cyra a grandi en hackant les systèmes de sécurité pour survivre, développant une approche unique du piratage. Sa capacité à passer inaperçue et son instinct de survie compensent son manque d'expérience en combat."
    }
    
    {
      "name": "Kael Chrome",
      "lore": "Vétéran des guerres corporatistes, Kael a survécu à plus de missions que la plupart des runners n'en rêveront. Ses implants de combat et son expérience du terrain en font un atout précieux pour les missions dangereuses. Il préfère les approches directes aux subtilités du hacking."
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // On affiche la réponse brute de l'IA avant de la parser
    console.log("[IA] Réponse brute reçue de Gemini pour le runner:", text);

    // --- NOUVELLE ÉTAPE DE NETTOYAGE ---
    // On utilise une expression régulière pour trouver la première accolade {
    // jusqu'à la dernière accolade }, et tout ce qu'il y a entre.
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch && jsonMatch[0]) {
        // Si on a trouvé une correspondance, on extrait uniquement cette partie
        text = jsonMatch[0];
        console.log("[IA] Texte nettoyé, prêt pour le parsing:", text);
    } else {
        // Si on ne trouve pas de JSON, on lance une erreur
        throw new Error("La réponse de l'IA ne contient pas de JSON valide.");
    }
    // ------------------------------------

    const parsedJson = JSON.parse(text);
    console.log("[IA] JSON parsé avec succès pour le runner.");
    return parsedJson;
  } catch (error) {
    console.error("[IA] ERREUR LORS DE LA COMMUNICATION AVEC GEMINI:", error);
    
    // Gestion spécifique des erreurs de service
    if (error.status === 503) {
      console.error("[IA] Service Gemini temporairement indisponible (503). Utilisation du fallback.");
    } else if (error.message && error.message.includes('overloaded')) {
      console.error("[IA] Service Gemini surchargé. Utilisation du fallback.");
    }
    
    // Fallback avec des runners prédéfinis
    const fallbackRunners = [
      {
        name: "Jax Vector",
        lore: "Ancien corpo d'Arasaka reconverti dans le hacking illégal. Spécialiste de l'infiltration des systèmes corporatistes, Jax a appris à survivre dans les bas-fonds de Night City après avoir été trahi par ses anciens employeurs."
      },
      {
        name: "Cyra Byte",
        lore: "Jeune prodige du code sortie des rues de Pacifica. Cyra a grandi en hackant les systèmes de sécurité pour survivre, développant une approche unique du piratage et une capacité à passer inaperçue."
      },
      {
        name: "Kael Chrome",
        lore: "Vétéran des guerres corporatistes, Kael a survécu à plus de missions que la plupart des runners n'en rêveront. Ses implants de combat et son expérience du terrain en font un atout précieux."
      },
      {
        name: "Nyx Neon",
        lore: "Spécialiste de l'infiltration et de la discrétion, Nyx opère dans l'ombre depuis des années. Son expertise en stealth et sa connaissance des systèmes de sécurité en font un runner de confiance."
      },
      {
        name: "Rogue Silas",
        lore: "Runner indépendant avec une réputation solide dans l'inframonde. Rogue a développé un équilibre parfait entre hacking, infiltration et combat au fil de ses nombreuses missions."
      },
      {
        name: "Spike Zero",
        lore: "Expert en combat cybernétique et en neutralisation d'objectifs. Spike préfère les approches directes et a une réputation de runner efficace pour les missions dangereuses."
      },
      {
        name: "Vex Glitch",
        lore: "Hacker prodige avec une approche unique des systèmes informatiques. Vex a la capacité de trouver des failles que d'autres ne voient pas, faisant de lui un atout précieux pour les missions de piratage."
      }
    ];
    
    const randomRunner = fallbackRunners[Math.floor(Math.random() * fallbackRunners.length)];
    console.log("[IA] Utilisation du runner de fallback:", randomRunner.name);
    return randomRunner;
  }
}