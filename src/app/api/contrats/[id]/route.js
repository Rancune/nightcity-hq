// src/app/api/contrats/[id]/route.js
import { NextResponse } from 'next/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';

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