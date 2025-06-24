// src/app/api/contrats/generate/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Contract from '@/models/Contract'; // On utilise l'alias
import { generateContractLore } from '@/Lib/ai';
import connectDb from '@/Lib/database';
import { auth } from '@clerk/nextjs/server';
import { determineDifficulty, calculateReputationGain } from '@/Lib/reputation';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();

    // --- PARTIE 1 : LORE PAR IA (ne change pas) ---
    const { title, description } = await generateContractLore();

    // --- PARTIE 2 : GÉNÉRATION DE DONNÉES DE GAMEPLAY v2.0 ---
    const corpos = ['Arasaka', 'Militech', 'Kang Tao', 'NetWatch'];
    const randomCorpo = corpos[Math.floor(Math.random() * corpos.length)];

    // === GÉNÉRATION DES COMPÉTENCES REQUISES ===
    const requiredHacking = Math.floor(Math.random() * 7) + 2; // Compétence requise entre 2 et 8
    const requiredStealth = Math.floor(Math.random() * 7) + 2;
    const requiredCombat = Math.floor(Math.random() * 7) + 2;

    // Calculer la difficulté et les récompenses cohérentes
    const requiredSkills = {
      hacking: requiredHacking,
      stealth: requiredStealth,
      combat: requiredCombat,
    };
    const difficulty = determineDifficulty(requiredSkills);
    const actualReputation = calculateReputationGain(difficulty);
    
    // Récompense en eddies basée sur la difficulté
    const difficultyMultiplier = {
      'EASY': 1,
      'MEDIUM': 1.5,
      'HARD': 2.5,
      'VERY_HARD': 4
    };
    const baseEddies = 10000;
    const randomRewardEddies = Math.floor(baseEddies * difficultyMultiplier[difficulty] * (0.8 + Math.random() * 0.4)); // ±20% de variation

    // Durée pour accepter le contrat (entre 1 et 3 heures de jeu actif)
    // 1h de jeu = 3600 secondes TRP . 
    // Ici on change la durée d'acceptation pour que les joueurs aient plus de temps pour accepter le contrat si besoin
    const randomAcceptanceDeadline = Math.floor(Math.random() * (10800 - 3600 + 1) + 3600);

    // --- PARTIE 3 : CRÉATION DU NOUVEAU CONTRAT STRUCTURÉ ---
    const newContractData = {
      title,
      description,
      status: 'Proposé',
      ownerId: userId,
      archetype: 'PIRATAGE_RAPIDE_v1',
      targetCorpo: randomCorpo, // Exemple
      reward: { eddies: randomRewardEddies, reputation: actualReputation },
      acceptance_deadline_trp: randomAcceptanceDeadline,
      consequence_tier: Math.floor(Math.random() * 2) + 1,

      // On ajoute l'objet de compétences requises ici
      requiredSkills,
    };

    const contract = new Contract(newContractData);
    await contract.save();

    console.log(`[GENERATE] Nouveau contrat créé: ${title} - ${randomRewardEddies} €$ - ${actualReputation} PR (${difficulty})`);

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la génération du contrat v2:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}