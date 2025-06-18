// src/app/api/contrats/[id]/route.js
import { NextResponse } from 'next/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import Netrunner from '@/models/Netrunner';


export async function GET(request, { params }) {
  try {
    await connectDb();

    // Avec Next.js 14, ceci est la méthode standard et fiable pour récupérer l'ID.
    const { id } = await params; 

    const contract = await Contract.findById(id);

    if (!contract) {
      return NextResponse.json({ message: "Contrat non trouvé" }, { status: 404 });
    }

    return NextResponse.json(contract);

  } catch (error) {
    console.error("[API GET /id] Erreur:", error);
    return NextResponse.json({ message: "Erreur interne du serveur" }, { status: 500 });
  }
}

// === NOUVELLE FONCTION PUT POUR L'ASSIGNATION ===
export async function PUT(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const { id: contractId } = params;
    // Le frontend nous enverra maintenant l'ID du runner choisi
    const { netrunnerId } = await request.json(); 

    if (!netrunnerId) {
      return new NextResponse("ID du Netrunner manquant", { status: 400 });
    }

    await connectDb();

    // On vérifie que le contrat et le runner existent et appartiennent bien au joueur
    const contract = await Contract.findOne({ _id: contractId, status: 'Proposé' });
    const runner = await Netrunner.findOne({ _id: netrunnerId, ownerId: userId, status: 'Disponible' });

    if (!contract || !runner) {
      return new NextResponse("Contrat ou Netrunner invalide/non disponible.", { status: 404 });
    }

    // Tout est bon, on procède à l'assignation
    contract.status = 'Assigné'; // Le contrat n'est plus "disponible" mais "assigné"
    contract.assignedPlayer = userId;
    contract.assignedRunner = netrunnerId;

    runner.status = 'En mission';
    runner.assignedContract = contractId;

    // On sauvegarde les deux documents mis à jour dans la base de données
    await contract.save();
    await runner.save();

    return NextResponse.json({ contract, runner });

  } catch (error) {
    console.error("[API PUT /contrats/id] Erreur d'assignation:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}