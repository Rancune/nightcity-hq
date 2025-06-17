// src/app/api/contrats/[id]/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Contract from '@/models/Contract';

async function connectDb() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGO_URI);
}

// === NOUVELLE FONCTION GET ===
// Pour récupérer un seul contrat par son ID
export async function GET(request, { params }) {
  const id = params.id;
  try {
    await connectDb();
    const contract = await Contract.findById(id);
    if (!contract) {
      return NextResponse.json({ message: "Contrat non trouvé" }, { status: 404 });
    }
    return NextResponse.json(contract, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la récupération du contrat" }, { status: 500 });
  }
}



// === Fonction PUT  ===
export async function PUT(request, { params }) {
  const { id } = params;
  console.log(`[SERVEUR] Requête PUT reçue pour l'ID: ${id}`); // Mouchard 1

  try {
    const body = await request.json();
    console.log("[SERVEUR] Corps de la requête reçu:", body); // Mouchard 2

    await connectDb();

    const updatedContract = await Contract.findByIdAndUpdate(id, body, { new: true });

    if (!updatedContract) {
      console.log("[SERVEUR] ERREUR: Contrat non trouvé avec cet ID."); // Mouchard 3
      return NextResponse.json({ message: "Contrat non trouvé" }, { status: 404 });
    }

    console.log("[SERVEUR] Contrat mis à jour avec succès:", updatedContract); // Mouchard 4
    return NextResponse.json(updatedContract, { status: 200 });

  } catch (error) {
    // LE MOUCHARD LE PLUS IMPORTANT !
    console.error("[SERVEUR] DÉTAIL COMPLET DE L'ERREUR:", error); 
    return NextResponse.json({ message: "Erreur interne lors de la mise à jour du contrat" }, { status: 500 });
  }
}