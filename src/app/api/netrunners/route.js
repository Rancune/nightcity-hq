// src/app/api/netrunners/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Netrunner from '@/models/Netrunner';
import PlayerProfile from '@/models/PlayerProfile';
import { updatePlayerTimers } from '@/Lib/trp';

// GET : Pour récupérer la liste des runners du joueur connecté
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    // ON DÉCLENCHE LE TICK DE L'HORLOGE ICI AUSSI
    await updatePlayerTimers(userId);

    await connectDb();
    // On ajoute .lean() par bonne pratique pour la performance
    const runners = await Netrunner.find({ ownerId: userId }).lean(); 
    
    // Initialiser le champ installedImplants pour les runners qui ne l'ont pas
    const runnersWithImplants = runners.map(runner => ({
      ...runner,
      installedImplants: runner.installedImplants || []
    }));
    
    return NextResponse.json(runnersWithImplants);

  } catch (error) {
    console.error("[API GET /netrunners] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}

// POST : Pour recruter (générer) un nouveau runner
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();

    const RECRUIT_COST = 500;
    const player = await PlayerProfile.findOne({ clerkId: userId });

    if (!player || player.eddies < RECRUIT_COST) {
      return new NextResponse("Fonds insuffisants pour recruter.", { status: 400 });
    }

    player.eddies -= RECRUIT_COST;

    const firstNames = ["Jax", "Cyra", "Kael", "Nyx", "Rogue", "Spike", "Vex"];
    const lastNames = ["Vector", "Byte", "Chrome", "Neon", "Silas", "Zero", "Glitch"];

    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const runnerName = `${randomFirstName} ${randomLastName}`;

    const newRunner = new Netrunner({
      ownerId: userId,
      name: runnerName,
      // --- LA PARTIE IMPORTANTE ---
      // On génère des compétences aléatoires entre 1 et 5
      skills: {
        hacking: Math.floor(Math.random() * 5) + 1,
        stealth: Math.floor(Math.random() * 5) + 1,
        combat: Math.floor(Math.random() * 5) + 1,
      }
    });

    await Promise.all([player.save(), newRunner.save()]);

    return NextResponse.json({ newRunner, updatedProfile: player }, { status: 201 });

  } catch (error) {
    console.error("[API POST /netrunners] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}