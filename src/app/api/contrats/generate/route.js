// src/app/api/contrats/generate/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Contract from '@/models/Contract'; // On utilise l'alias
import { generateContractLore } from '@/Lib/ai';
import connectDb from '@/Lib/database';
import { auth } from '@clerk/nextjs/server';
import { determineDifficulty, calculateReputationGain } from '@/Lib/reputation';
import { FACTIONS } from '@/Lib/factionRelations';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();

    // --- PARTIE 1 : LORE PAR IA (avec factions) ---
    const { title, description, factions, difficulty: loreDifficulty, type } = await generateContractLore();

    // --- PARTIE 2 : GÉNÉRATION DE DONNÉES DE GAMEPLAY v3.0 ---
    // Utiliser les factions du lore si disponibles, sinon fallback
    const targetFactions = factions && factions.length > 0 ? factions : ['inframonde'];
    const targetFaction = targetFactions[0]; // Faction principale
    const employerFaction = targetFactions.length > 1 ? targetFactions[1] : 'fixers';

    // === GÉNÉRATION DES COMPÉTENCES REQUISES BASÉES SUR LE TYPE ===
    let requiredHacking = Math.floor(Math.random() * 7) + 2;
    let requiredStealth = Math.floor(Math.random() * 7) + 2;
    let requiredCombat = Math.floor(Math.random() * 7) + 2;

    // Ajuster les compétences selon le type de mission
    switch (type) {
      case 'infiltration':
        requiredStealth += 2;
        requiredHacking += 1;
        break;
      case 'sabotage':
        requiredHacking += 2;
        requiredCombat += 1;
        break;
      case 'assassinat':
        requiredStealth += 1;
        requiredCombat += 2;
        break;
      case 'récupération':
        requiredStealth += 1;
        requiredHacking += 1;
        break;
      case 'destruction':
        requiredCombat += 2;
        requiredHacking += 1;
        break;
    }

    // Limiter les compétences à 10 maximum
    requiredHacking = Math.min(requiredHacking, 10);
    requiredStealth = Math.min(requiredStealth, 10);
    requiredCombat = Math.min(requiredCombat, 10);

    // Calculer la difficulté et les récompenses cohérentes
    const requiredSkills = {
      hacking: requiredHacking,
      stealth: requiredStealth,
      combat: requiredCombat,
    };
    const difficulty = determineDifficulty(requiredSkills);
    const actualReputation = calculateReputationGain(difficulty);
    
    // Récompense en eddies basée sur la difficulté et le type de faction
    const difficultyMultiplier = {
      'EASY': 1,
      'MEDIUM': 1.5,
      'HARD': 2.5,
      'VERY_HARD': 4
    };
    
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
    
    const baseEddies = 10000;
    const factionBonus = factionMultiplier[targetFaction] || 1.0;
    const randomRewardEddies = Math.floor(
      baseEddies * 
      difficultyMultiplier[difficulty] * 
      factionBonus * 
      (0.8 + Math.random() * 0.4)
    );

    // Durée pour accepter le contrat (entre 1 et 3 heures de jeu actif)
    const randomAcceptanceDeadline = Math.floor(Math.random() * (10800 - 3600 + 1) + 3600);

    // --- PARTIE 3 : CRÉATION DU NOUVEAU CONTRAT STRUCTURÉ ---
    const newContractData = {
      title,
      description,
      status: 'Proposé',
      ownerId: userId,
      archetype: 'PIRATAGE_RAPIDE_v1',
      targetCorpo: targetFaction, // Pour compatibilité
      targetFaction: targetFaction, // Faction principale
      employerFaction: employerFaction, // Faction employeur
      involvedFactions: targetFactions, // Toutes les factions impliquées
      missionType: type, // Type de mission
      loreDifficulty: loreDifficulty, // Difficulté selon le lore
      reward: { eddies: randomRewardEddies, reputation: actualReputation },
      acceptance_deadline_trp: randomAcceptanceDeadline,
      consequence_tier: Math.floor(Math.random() * 2) + 1,

      // Compétences requises
      requiredSkills,
    };

    const contract = new Contract(newContractData);
    await contract.save();

    console.log(`[GENERATE] Nouveau contrat créé: ${title} - ${randomRewardEddies} €$ - ${actualReputation} PR (${difficulty})`);
    console.log(`[GENERATE] Factions impliquées: ${targetFactions.join(', ')} - Type: ${type}`);

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la génération du contrat v3:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}