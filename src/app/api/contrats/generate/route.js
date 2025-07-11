// src/app/api/contrats/generate/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Contract from '@/models/Contract'; // On utilise l'alias
import { generateContractLore } from '@/Lib/ai';
import connectDb from '@/Lib/database';
import { auth } from '@clerk/nextjs/server';
import { determineDifficulty, calculateReputationGain } from '@/Lib/reputation';
import { FACTIONS } from '@/Lib/factionRelations';
import PlayerProfile from '@/models/PlayerProfile';
import { 
  getAvailableThreatLevels, 
  generateRequiredSkillsFromThreatLevel, 
  calculateRewardsFromThreatLevel,
  calculateRewardsWithFactionReputation,
  analyzeLoreForSkills 
} from '@/Lib/threatLevels';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();

    // --- PARTIE 1 : RÉCUPÉRER LE PROFIL DU JOUEUR ---
    const playerProfile = await PlayerProfile.findOne({ clerkId: userId });
    if (!playerProfile) {
      return new NextResponse("Profil joueur non trouvé", { status: 404 });
    }

    // --- PARTIE 2 : LORE PAR IA (avec factions) ---
    const { title, description, factions, difficulty: loreDifficulty, type } = await generateContractLore();

    // --- PARTIE 3 : SYSTÈME D'ÉCHELONS DE MENACE ---
    // Déterminer les niveaux de menace disponibles selon la réputation du joueur
    const availableThreatLevels = getAvailableThreatLevels(playerProfile.reputationPoints);
    
    // Choisir un niveau de menace aléatoire parmi ceux disponibles
    const threatLevel = availableThreatLevels[Math.floor(Math.random() * availableThreatLevels.length)];
    
    // Générer les compétences requises basées sur le niveau de menace et le type de mission
    const requiredSkills = generateRequiredSkillsFromThreatLevel(threatLevel, type);

    // --- PARTIE 4 : ANALYSE DU LORE POUR VALIDATION ---
    // Analyser le lore pour détecter les compétences mentionnées
    const loreSkills = analyzeLoreForSkills(description);
    console.log(`[GENERATE] Lore analysis for "${title}":`, loreSkills);

    // --- PARTIE 5 : CALCUL DES RÉCOMPENSES AVEC RÉPUTATION DE FACTION ---
    // Utiliser les factions du lore si disponibles, sinon fallback
    const targetFactions = factions && factions.length > 0 ? factions : ['inframonde'];
    const targetFaction = targetFactions[0]; // Faction principale
    const employerFaction = targetFactions.length > 1 ? targetFactions[1] : 'fixers';

    // Récupérer la réputation du joueur avec la faction employeur
    let playerFactionReputation = 0;
    try {
      const FactionRelations = (await import('@/models/FactionRelations')).default;
      const factionRelations = await FactionRelations.findOne({ clerkId: userId });
      if (factionRelations && factionRelations.relations[employerFaction] !== undefined) {
        playerFactionReputation = factionRelations.relations[employerFaction];
      }
    } catch (error) {
      console.log(`[GENERATE] Impossible de récupérer la réputation de faction pour ${employerFaction}:`, error.message);
    }
    
    // Calculer les récompenses en tenant compte de la réputation avec la faction
    const rewards = calculateRewardsWithFactionReputation(threatLevel, employerFaction, playerFactionReputation);

    // Durée pour accepter le contrat (entre 1 et 3 heures de jeu actif)
    const randomAcceptanceDeadline = Math.floor(Math.random() * (10800 - 3600 + 1) + 3600);

    // --- PARTIE 6 : CRÉATION DU NOUVEAU CONTRAT STRUCTURÉ ---
    const newContractData = {
      title,
      description,
      status: 'Proposé',
      ownerId: null,
      archetype: 'PIRATAGE_RAPIDE_v1',
      targetCorpo: targetFaction, // Pour compatibilité
      targetFaction: targetFaction, // Faction principale
      employerFaction: employerFaction, // Faction employeur
      involvedFactions: targetFactions, // Toutes les factions impliquées
      missionType: type, // Type de mission
      loreDifficulty: loreDifficulty, // Difficulté selon le lore
      threatLevel: threatLevel, // NOUVEAU : Niveau de menace
      reward: { eddies: rewards.eddies, reputation: rewards.reputation },
      acceptance_deadline_trp: randomAcceptanceDeadline,
      consequence_tier: Math.floor(Math.random() * 2) + 1,

      // Compétences requises générées par le système de menace
      requiredSkills,
    };

    const contract = new Contract(newContractData);
    await contract.save();

    console.log(`[GENERATE] Nouveau contrat créé: ${title}`);
    console.log(`[GENERATE] Niveau de menace: ${threatLevel} - ${rewards.eddies} €$ - ${rewards.reputation} PR`);
    console.log(`[GENERATE] Compétences requises:`, requiredSkills);
    console.log(`[GENERATE] Factions impliquées: ${targetFactions.join(', ')} - Type: ${type}`);
    console.log(`[GENERATE] Réputation joueur: ${playerProfile.reputationPoints} - Niveaux disponibles: [${availableThreatLevels.join(', ')}]`);
    console.log(`[GENERATE] Réputation avec ${employerFaction}: ${playerFactionReputation} - Multiplicateur: ${rewards.breakdown?.reputationMultiplier || 1.0}`);

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la génération du contrat v4:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}