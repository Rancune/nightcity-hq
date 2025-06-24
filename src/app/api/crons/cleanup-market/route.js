import { NextResponse } from 'next/server';
import { cleanupExpiredPrograms } from '@/Lib/market';

export async function GET() {
  try {
    await cleanupExpiredPrograms();
    
    return NextResponse.json({
      success: true,
      message: "Nettoyage du marché noir effectué"
    });
    
  } catch (error) {
    console.error("[CRON CLEANUP-MARKET] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 