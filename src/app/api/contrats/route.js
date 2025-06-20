// src/app/api/contrats/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import { updatePlayerTimers } from '@/Lib/trp'; // On importe notre nouvelle fonction

export async function GET() {
  try {
    const { userId } = await auth();

    // On se connecte à la BDD quoiqu'il arrive
    await connectDb();

    // Si l'utilisateur n'est pas connecté, on ne lui montre que les offres publiques
    if (!userId) {
      const publicContracts = await Contract.find({ status: 'Proposé' }).lean();
      return NextResponse.json(publicContracts);
    }

    // Si l'utilisateur est connecté, on lance d'abord le "tick" de l'horloge
    await updatePlayerTimers(userId);

    // --- LA REQUÊTE FINALE ET CORRIGÉE ---
    const contracts = await Contract.find({
        $or: [
          // 1. Contrats publics qui sont encore valides
          { status: 'Proposé', ownerId: null },
          // 2. OU contrats qui appartiennent au joueur ET qui sont actifs/en cours
          { ownerId: userId, status: { $in: ['Proposé', 'Assigné', 'Actif', 'En attente de rapport'] } }
        ]
    })
    .sort({ createdAt: -1 })
    .lean();

    return NextResponse.json(contracts);

  } catch (error) {
    console.error("[API GET /contrats] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}

// Équivalent de app.post('/api/contrats', ...)
export async function POST(request) {
  try {
    const body = await request.json(); // La façon de récupérer le corps de la requête dans Next.js
    await connectDb();
    const newContract = new Contract(body);
    await newContract.save();
    return NextResponse.json(newContract, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la création du contrat" }, { status: 400 });
  }
}