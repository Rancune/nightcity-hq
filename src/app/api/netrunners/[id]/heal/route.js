// src/app/api/netrunners/[id]/heal/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Netrunner from '@/models/Netrunner';
import PlayerProfile from '@/models/PlayerProfile';

export async function POST(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const awaitedParams = await params;
    const runnerId = awaitedParams.id;
    const HEAL_COST = 10000; // Coût de l'opération : 10000 eddies

    await connectDb();

    // On récupère le joueur et le runner en parallèle
    const [player, runner] = await Promise.all([
      PlayerProfile.findOne({ clerkId: userId }),
      Netrunner.findOne({ _id: runnerId, ownerId: userId })
    ]);

    if (!runner) return new NextResponse("Netrunner introuvable.", { status: 404 });
    if (runner.status !== 'Grillé') return new NextResponse("Ce runner n'a pas besoin de soins.", { status: 400 });
    if (!player || player.eddies < HEAL_COST) {
      return new NextResponse("Fonds insuffisants pour payer le charcudoc.", { status: 400 });
    }

    // Si tout est bon, on procède à l'opération
    player.eddies -= HEAL_COST;

    runner.status = 'Disponible';
    runner.recoveryUntil = null; // On annule le temps de récupération

    // On sauvegarde les deux mises à jour
    await Promise.all([player.save(), runner.save()]);

    return NextResponse.json({ message: `${runner.name} est de nouveau opérationnel.` });

  } catch (error) {
    console.error("[API HEAL] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}