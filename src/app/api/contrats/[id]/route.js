// src/app/api/contrats/[id]/route.js
import { NextResponse } from 'next/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import Netrunner from '@/models/Netrunner';
import { auth } from '@clerk/nextjs/server';


export async function GET(request) {
  try {
    await connectDb();
    
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    // LA CORRECTION EST ICI. On ajoute .lean()
    const contract = await Contract.findById(id).lean();


    if (!contract) {
      return NextResponse.json({ message: "Contrat non trouvé avec cet ID." }, { status: 404 });
    }
    
    return NextResponse.json(contract);

  } catch (error) {
    console.error(`[API GET /id] Erreur serveur:`, error);
    return NextResponse.json({ message: "Erreur interne du serveur lors de la recherche du contrat" }, { status: 500 });
  }
}

// === NOUVELLE FONCTION PUT POUR L'ASSIGNATION ===
export async function PUT(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const { id: contractId } = await params;
    const { netrunnerId } = await request.json(); 

    if (!netrunnerId) {
      return new NextResponse("ID du Netrunner manquant", { status: 400 });
    }

    await connectDb();

    const runner = await Netrunner.findOne({ _id: netrunnerId, ownerId: userId, status: 'Disponible' });
    if (!runner) {
      return new NextResponse("Netrunner invalide ou non disponible.", { status: 404 });
    }

    // --- LA CORRECTION EST ICI ---
    const updatedContract = await Contract.findOneAndUpdate(
      { _id: contractId, status: 'Proposé' },
      { 
        $set: {
          status: 'Assigné',
          ownerId: userId,
          assignedRunner: netrunnerId,
          // On initialise le minuteur de mission !
          initial_completion_duration_trp: 300, // Durée de 5 minutes (300s) pour l'exemple
          completion_timer_started_at: new Date(), // On enregistre l'heure de début
        }
      },
      { new: true }
    );
    // -----------------------------

    if (!updatedContract) {
      return new NextResponse("Contrat non trouvé ou déjà assigné.", { status: 404 });
    }

    runner.status = 'En mission';
    runner.assignedContract = contractId;
    await runner.save();

    return NextResponse.json({ contract: updatedContract, runner });

  } catch (error) {
    console.error("[API PUT /contrats/id] Erreur d'assignation:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}