// src/app/api/player/sync/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'; // L'outil de Clerk pour l'auth côté serveur
import PlayerProfile from '@/models/PlayerProfile'; 
import mongoose from 'mongoose';
import connectDb from '@/Lib/database';


// On utilise POST car cette action peut créer une nouvelle ressource
export async function POST() {
  try {
    await connectDb();
    const { userId, user } = await auth();

    // LA CORRECTION EST ICI. On ne vérifie plus que le userId.
    if (!userId) {
      return new NextResponse("Non autorisé - Utilisateur non connecté", { status: 401 });
    }

    let player = await PlayerProfile.findOne({ clerkId: userId });

    if (!player) {
      console.log(`[API SYNC] Création d'un nouveau profil pour l'utilisateur ${userId}`);
      player = new PlayerProfile({
        clerkId: userId,
        // On utilise l'optional chaining (?.) pour ne pas planter si user est null.
        handle: user?.username || `Fixer-${userId.slice(-4)}`, 
      });
      await player.save();
    }

    return NextResponse.json(player);

  } catch (error) {
    console.error("[API SYNC] ERREUR FATALE DANS LA ROUTE SYNC:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}