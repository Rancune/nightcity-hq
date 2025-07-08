import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Netrunner from '@/models/Netrunner';
import { updatePlayerTimers } from '@/Lib/trp';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Non autorisé', { status: 401 });
    }

    await updatePlayerTimers(userId);
    await connectDb();
    const runners = await Netrunner.find({ ownerId: userId }).lean();
    return NextResponse.json(runners);
  } catch (error) {
    console.error('[API GET /player/runners] Erreur:', error);
    return new NextResponse('Erreur interne du serveur', { status: 500 });
  }
} 