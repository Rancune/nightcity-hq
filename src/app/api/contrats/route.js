// src/app/api/contrats/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import Netrunner from '@/models/Netrunner';
import { updatePlayerTimers } from '@/Lib/trp'; // On importe notre nouvelle fonction

export async function GET(request) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(request.url);
    
    // Récupérer les paramètres de filtrage
    const status = searchParams.get('status');
    const ownerId = searchParams.get('ownerId');
    const playerContracts = searchParams.get('playerContracts');

    // On se connecte à la BDD quoiqu'il arrive
    await connectDb();

    // Si l'utilisateur n'est pas connecté, on ne lui montre que les offres publiques
    if (!userId) {
      const publicContracts = await Contract.find({ 
        status: 'Proposé',
        ownerId: null 
      }).lean();
      return NextResponse.json(publicContracts);
    }

    // Si l'utilisateur est connecté, on lance d'abord le "tick" de l'horloge
    await updatePlayerTimers(userId);

    let query = {};
    let shouldPopulate = false;

    // Si on demande les contrats du joueur (page Contrats)
    if (playerContracts === 'true') {
      query = {
        ownerId: userId,
        status: { $in: ['Assigné', 'Actif', 'En attente de rapport', 'Terminé', 'Échoué'] }
      };
      shouldPopulate = true; // On a besoin du runner pour les contrats assignés
    }
    // Si on demande les contrats proposés (page Map)
    else if (status === 'Proposé' && ownerId === 'null') {
      query = {
        status: 'Proposé',
        ownerId: null
      };
      shouldPopulate = false; // Pas de runner pour les contrats proposés
    }
    // Par défaut (compatibilité), retourner tous les contrats
    else {
      query = {
        status: { $in: ['Proposé', 'Assigné', 'Actif', 'En attente de rapport'] }
      };
      shouldPopulate = true; // On populate par défaut
    }

    // Retourner les contrats selon le filtre
    let contractsQuery = Contract.find(query).sort({ createdAt: -1 });
    
    if (shouldPopulate) {
      contractsQuery = contractsQuery.populate('assignedRunner');
    }
    
    const contracts = await contractsQuery.lean();

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