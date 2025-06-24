// src/app/api/test-env/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDb from '@/Lib/database';
import { auth } from '@clerk/nextjs/server';
import PlayerProfile from '@/models/PlayerProfile';
import { generateMarketStock } from '@/Lib/market';

export async function GET() {
  try {
    const envCheck = {
      MONGODB_URI: process.env.MONGODB_URI ? '✅ Configurée' : '❌ Manquante',
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? '✅ Configurée' : '❌ Manquante',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Configurée' : '❌ Manquante',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✅ Configurée' : '❌ Manquante',
      CRON_SECRET: process.env.CRON_SECRET ? '✅ Configurée' : '❌ Manquante',
    };

    return NextResponse.json({
      message: 'Test des variables d\'environnement',
      envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[TEST ENV] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}