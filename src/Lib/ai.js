// src/lib/ai.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// On vérifie si la clé API est bien chargée depuis le .env.local
console.log("Clé API Gemini chargée (premiers 5 caractères):", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) + '...' : 'NON DÉFINIE !');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateContractLore() {
  console.log("[IA] Début de la génération de lore...");
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
    Tu es un Fixer dans l'univers de Cyberpunk 2077. 
    Génère un contrat de mercenaire unique. Réponds UNIQUEMENT avec un objet JSON au format suivant: {"title": "...", "description": "..."}.
    Le titre doit être court et percutant.
    La description doit faire 2-3 phrases, être immersive, directe, et utiliser l'argot de Night City (choomba, corpo, eddies, etc.).
    Le thème du contrat est : sabotage industriel.
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
    return {
      title: "Contrat de Récupération Standard",
      description: "Le client a perdu un colis. Infiltrez-vous, récupérez-le. Discrétion requise."
    };
  }
}