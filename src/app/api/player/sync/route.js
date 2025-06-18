// src/app/api/player/sync/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'; // L'outil de Clerk pour l'auth côté serveur
import PlayerProfile from '@/models/PlayerProfile'; 
import mongoose from 'mongoose';
import connectDb from '@/Lib/database';


// On utilise POST car cette action peut créer une nouvelle ressource
export async function POST() {
  console.log("\n[API SYNC] Route de synchronisation déclenchée.");
  try {
    const { userId, user } = auth();
    console.log(`[API SYNC] Statut d'authentification Clerk: userId = ${userId}`);

    if (!userId || !user) {
      console.error("[API SYNC] Échec de l'authentification. L'utilisateur n'est pas (encore) connecté. Renvoi d'une erreur 401.");
      return new NextResponse("Non autorisé - Utilisateur non connecté", { status: 401 });
    }

    console.log(`[API SYNC] Utilisateur ${userId} authentifié. Connexion à la BDD...`);
    await connectDb();
    console.log("[API SYNC] Connexion à la BDD réussie.");

    let player = await PlayerProfile.findOne({ clerkId: userId });
    console.log("[API SYNC] Profil trouvé en BDD:", player ? 'Oui' : 'Non');

    if (!player) {
      console.log(`[API SYNC] Création d'un nouveau profil pour l'utilisateur ${user.username}`);
      player = new PlayerProfile({
        clerkId: userId,
        handle: user.username || `Fixer-${userId.slice(-4)}`,
      });
      await player.save();
      console.log("[API SYNC] Nouveau profil créé et sauvegardé.");
    }
    
    return NextResponse.json(player);

  } catch (error) {
    console.error("[API SYNC] ERREUR FATALE DANS LA ROUTE SYNC:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}