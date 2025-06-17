// src/app/api/crons/purge-contracts/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Contract from '@/models/Contract';

async function connectDb() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGO_URI);
}

export async function GET(request) {
  // --- SÉCURITÉ ---
  // On s'assure que la requête vient bien de Vercel et pas d'un utilisateur lambda
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await connectDb();

    // On cherche tous les contrats dont la date d'expiration est inférieure à la date actuelle
    const now = new Date();
    const result = await Contract.deleteMany({ expiresAt: { $lt: now } });

    const message = `Purge terminée. ${result.deletedCount} contrats fantômes supprimés.`;
    console.log(message);
    return NextResponse.json({ success: true, message });

  } catch (error) {
    console.error("Erreur lors de la purge des contrats:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}