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

    // --- PARTIE 5 : CALCUL DES RÉCOMPENSES ---
    // Utiliser les factions du lore si disponibles, sinon fallback
    const targetFactions = factions && factions.length > 0 ? factions : ['inframonde'];
    const targetFaction = targetFactions[0]; // Faction principale
    const employerFaction = targetFactions.length > 1 ? targetFactions[1] : 'fixers';

    // Multiplicateur selon le type de faction
    const factionMultiplier = {
      'arasaka': 1.5,
      'militech': 1.5,
      'kangTao': 1.4,
      'netWatch': 1.3,
      'ncpd': 1.2,
      'maxTac': 1.4,
      'traumaTeam': 1.1,
      'maelstrom': 1.0,
      'valentinos': 1.0,
      'voodooBoys': 1.1,
      'animals': 1.0,
      'scavengers': 0.9,
      'conseilMunicipal': 1.3,
      'lobbyistes': 1.2,
      'inframonde': 1.0,
      'fixers': 1.0,
      'ripperdocs': 1.0,
      'nomads': 1.0
    };
    
    const factionBonus = factionMultiplier[targetFaction] || 1.0;
    const rewards = calculateRewardsFromThreatLevel(threatLevel, factionBonus);

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

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la génération du contrat v4:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}