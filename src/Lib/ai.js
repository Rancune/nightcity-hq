// src/lib/ai.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// On vérifie si la clé API est bien chargée depuis le .env.local
console.log("Clé API Gemini chargée (premiers 5 caractères):", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) + '...' : 'NON DÉFINIE !');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateContractLore() {
  console.log("[IA] Début de la génération de lore...");
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
    Tu es un Fixer dans l'univers de Cyberpunk 2077. 
    Génère un contrat de mercenaire unique. Réponds UNIQUEMENT avec un objet JSON au format suivant: {"title": "...", "description": "..."}.
    Le titre doit être court et percutant.
    La description doit faire 4-5 phrases, être immersive, directe, et utiliser l'argot de Night City (choomba, corpo, eddies, etc.).
    Le thème du contrat est : sabotage industriel ou infiltration ou assassiner un corpo ou récupérer des données ou récupérer un objet rare ou détruire un objet rare ou détruire un objet important ou autre.
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
    
    // Fallback avec des contrats prédéfinis
    const fallbackContracts = [
      {
        title: "Infiltration Arasaka",
        description: "Un contact mystérieux veut des données sensibles de la tour Arasaka. Infiltrez les systèmes de sécurité, récupérez les fichiers et sortez sans vous faire repérer. Les ICE sont redoutables, choomba."
      },
      {
        title: "Sabotage Militech",
        description: "Un rival corporatiste paie bien pour que l'usine Militech ait des problèmes. Détruisez les systèmes de production, faites sauter les générateurs. Discrétion requise, les gardes sont armés jusqu'aux dents."
      },
      {
        title: "Récupération de Marchandise",
        description: "Un fixer a perdu un colis important dans les bas-fonds. Trouvez-le avant que les gangs ne s'en emparent. Le contenu vaut une fortune en eddies, mais attention aux vautours."
      },
      {
        title: "Assassinat Ciblé",
        description: "Un corpo de Kang Tao doit disparaître. Il fréquente les clubs huppés du centre-ville. Éliminez-le proprement, faites-le passer pour un accident. Pas de témoins, pas de traces."
      },
      {
        title: "Vol de Prototype",
        description: "NetWatch développe un nouveau virus de contrôle mental. Récupérez le prototype avant qu'ils ne le testent sur la population. Les labos sont ultra-sécurisés, mais les récompenses sont énormes."
      }
    ];
    
    const randomContract = fallbackContracts[Math.floor(Math.random() * fallbackContracts.length)];
    console.log("[IA] Utilisation du contrat de fallback:", randomContract.title);
    return randomContract;
  }
}

// NOUVELLE FONCTION POUR LE RAPPORT DE MISSION
export async function generateResolutionLore(contractTitle, runnerName, isSuccess) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Un prompt spécifique pour raconter l'issue de la mission
  const prompt = `
    Tu es un Fixer qui écrit un rapport de mission concis dans l'univers de Cyberpunk 2077 pour tes archives.
    La mission était : "${contractTitle}".
    Le netrunner assigné était : "${runnerName}".
    Le résultat de la mission est un ${isSuccess ? 'SUCCÈS' : 'ÉCHEC'}.
    Raconte en deux phrases ce qui s'est passé, en utilisant un ton direct et l'argot de Night City (choomba, corpo, eddies, etc.).
    Exemple de succès : "Le boulot est fait. ${runnerName} a infiltré les ICE comme un pro, a choppé les données et est parti avant même que les cops ne sonnent l'alerte. Propre et sans bavure."
    Exemple d'échec : "${runnerName} s'est fait repérer. L'alarme a hurlé et il a dû se déconnecter en urgence, le cerveau en feu. Le contrat est un échec cuisant, le client est furieux."
    Réponds UNIQUEMENT avec le texte du rapport. Pas de JSON, pas de fioritures, juste le texte brut.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // On affiche la réponse brute de l'IA
    console.log("[IA] Réponse brute reçue de Gemini pour le débriefing:", text);

    // On retourne directement le texte, car on ne veut pas de JSON.
    return text;

  } catch (error) {
    console.error("[IA] ERREUR LORS DE LA GÉNÉRATION DU RAPPORT:", error);
    
    // Gestion spécifique des erreurs de service
    if (error.status === 503) {
      console.error("[IA] Service Gemini temporairement indisponible (503). Utilisation du fallback.");
    } else if (error.message && error.message.includes('overloaded')) {
      console.error("[IA] Service Gemini surchargé. Utilisation du fallback.");
    }
    
    // Fallback avec des rapports prédéfinis
    if (isSuccess) {
      return `${runnerName} a accompli la mission avec succès. Le contrat "${contractTitle}" est terminé, les objectifs atteints. Le client est satisfait et les eddies sont dans la poche.`;
    } else {
      return `${runnerName} a échoué dans la mission "${contractTitle}". Les complications ont été trop importantes et le contrat a dû être abandonné. Le client n'est pas content, mais c'est le risque du métier.`;
    }
  }
}