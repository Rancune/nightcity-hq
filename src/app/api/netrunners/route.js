// src/app/api/netrunners/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Netrunner from '@/models/Netrunner';
import PlayerProfile from '@/models/PlayerProfile';

// GET : Pour récupérer la liste des runners du joueur connecté
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    await connectDb();
    const runners = await Netrunner.find({ ownerId: userId });
    return NextResponse.json(runners);

  } catch (error) {
    console.error("[API GET /netrunners] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}

// POST : Pour recruter (générer) un nouveau runner
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    await connectDb();

    const RECRUIT_COST = 500; // On définit le coût d'un runner

    // On cherche le profil du joueur pour vérifier son solde
    const player = await PlayerProfile.findOne({ clerkId: userId });

    if (!player || player.eddies < RECRUIT_COST) {
      return new NextResponse("Fonds insuffisants pour recruter.", { status: 400 });
    }

    // Si le joueur a assez d'argent, on déduit le coût
    player.eddies -= RECRUIT_COST;

    // On crée le nouveau runner comme avant
    const firstNames = ["Jax", "Cyra", "Kael", "Nyx", "Rogue", "Spike"];
    const lastNames = ["Vector", "Byte", "Chrome", "Neon", "Silas", "Zero"];

    const newRunner = new Netrunner({
      ownerId: userId,
      name: `<span class="math-inline">\{firstNames\[Math\.floor\(Math\.random\(\) \* firstNames\.length\)\]\} "</span>{lastNames[Math.floor(Math.random() * lastNames.length)]}"`,
      skills: { /* ... */ }
    });

    // On sauvegarde les deux changements en parallèle pour plus d'efficacité
    await Promise.all([player.save(), newRunner.save()]);

    // On renvoie le runner créé ET le profil mis à jour
    return NextResponse.json({ newRunner, updatedProfile: player }, { status: 201 });

  } catch (error) {
    console.error("[API POST /netrunners] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}