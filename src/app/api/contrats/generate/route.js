// src/app/api/contrats/generate/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Contract from '@/models/Contract'; // On utilise l'alias
import { generateContractLore } from '@/Lib/ai';
import connectDb from '@/Lib/database';

export async function POST() {
  try {
    await connectDb();

    // --- PARTIE 1 : LORE PAR IA (ne change pas) ---
    const { title, description } = await generateContractLore();

    // --- PARTIE 2 : GÉNÉRATION DE DONNÉES DE GAMEPLAY v2.0 ---
    const corpos = ['Arasaka', 'Militech', 'Kang Tao', 'NetWatch'];
    const randomCorpo = corpos[Math.floor(Math.random() * corpos.length)];

    // Récompense en eddies et réputation
     const randomRewardEddies = Math.floor(Math.random() * (50000 - 5000 + 1) + 5000);
     const randomRewardRep = Math.floor(Math.random() * (200 - 50 + 1) + 50);


    // Durée pour accepter le contrat (entre 1 et 3 heures de jeu actif)
    // 1h de jeu = 3600 secondes TRP . 
    // Ici on change la durée d'acceptation pour que les joueurs aient plus de temps pour accepter le contrat si besoin
    const randomAcceptanceDeadline = Math.floor(Math.random() * (10800 - 3600 + 1) + 3600);

        // === GÉNÉRATION DES COMPÉTENCES REQUISES ===
    const requiredHacking = Math.floor(Math.random() * 7) + 2; // Compétence requise entre 2 et 8
    const requiredStealth = Math.floor(Math.random() * 7) + 2;
    const requiredCombat = Math.floor(Math.random() * 7) + 2;


    // --- PARTIE 3 : CRÉATION DU NOUVEAU CONTRAT STRUCTURÉ ---
    const newContractData = {
      title,
      description,
      status: 'Proposé',
      archetype: 'PIRATAGE_RAPIDE_v1',
      targetCorpo: randomCorpo, // Exemple
      reward: { eddies: randomRewardEddies, reputation: randomRewardRep },
      acceptance_deadline_trp: randomAcceptanceDeadline,
      consequence_tier: Math.floor(Math.random() * 2) + 1,

      // On ajoute l'objet de compétences requises ici
      requiredSkills: {
        hacking: requiredHacking,
        stealth: requiredStealth,
        combat: requiredCombat,
      },
    };

    const contract = new Contract(newContractData);
    await contract.save();

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la génération du contrat v2:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}