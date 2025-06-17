// src/app/api/contrats/generate/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Contract from '@/models/Contract';
import { generateContractLore } from '../../../../Lib/ai';

async function connectDb() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGO_URI);
}

// Fonction qui s'exécute quand on appelle cette route en POST
export async function POST() {
    console.log("[API] Route de génération de contrat déclenchée.");
  try {
    await connectDb();
    console.log("[API] Appel du module IA pour le lore...");
        // --- PARTIE 1 : APPEL À L'IA ---
    const { title, description } = await generateContractLore(); // On récupère le lore de l'IA
    console.log("[API] Lore reçu de l'IA:", { title, description });

    // --- PARTIE 2 : GÉNÉRATION ALÉATOIRE ---
    const difficulties = ['Facile', 'Moyen', 'Difficile', 'Légendaire'];
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const randomReward = Math.floor(Math.random() * (50000 - 5000 + 1) + 5000);

    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 7);

    // --- PARTIE 3 : COMBINAISON ET SAUVEGARDE ---
    const newContractData = {
      title: title, // Titre généré par l'IA
      description: description, // Description générée par l'IA
      reward: randomReward,
      difficulty: randomDifficulty,
      expiresAt: expiration,
    };

    const contract = new Contract(newContractData);
    await contract.save();

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("[API] ERREUR DANS LA ROUTE DE GÉNÉRATION:", error);
    return NextResponse.json({ message: "Erreur lors de la génération du contrat" }, { status: 500 });
  }
}