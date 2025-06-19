// src/app/api/netrunners/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Netrunner from '@/models/Netrunner';

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

    // Listes pour la génération de noms aléatoires
    const firstNames = ["Jax", "Cyra", "Kael", "Nyx", "Rogue", "Spike"];
    const lastNames = ["Vector", "Byte", "Chrome", "Neon", "Silas", "Zero"];

    const newRunner = new Netrunner({
      ownerId: userId,
      name: `<span class="math-inline">\{firstNames\[Math\.floor\(Math\.random\(\) \* firstNames\.length\)\]\} "</span>{lastNames[Math.floor(Math.random() * lastNames.length)]}"`,
      skills: {
        hacking: Math.floor(Math.random() * 5) + 1, // compétence entre 1 et 5
        stealth: Math.floor(Math.random() * 5) + 1,
        combat: Math.floor(Math.random() * 5) + 1,
      }
    });

    await newRunner.save();
    return NextResponse.json(newRunner, { status: 201 });

  } catch (error) {
    console.error("[API POST /netrunners] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}