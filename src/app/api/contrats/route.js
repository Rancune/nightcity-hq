// src/app/api/contrats/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Contract from '../../../../models/Contract'; // Ajuste le chemin si besoin

// Connexion à la base de données
async function connectDb() {
  if (mongoose.connection.readyState >= 1) {
    return; // Si déjà connecté, on ne fait rien
  }
  await mongoose.connect(process.env.MONGO_URI);
}

// Équivalent de app.get('/api/contrats', ...)
export async function GET() {
  try {
    await connectDb();
    const contracts = await Contract.find();
    return NextResponse.json(contracts, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la récupération des contrats" }, { status: 500 });
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