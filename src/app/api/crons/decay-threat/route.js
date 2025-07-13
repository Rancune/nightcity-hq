import { NextResponse } from 'next/server';
import connectDb from '@/Lib/database';
import FactionRelations from '@/models/FactionRelations';

export async function GET() {
  try {
    await connectDb();
    const now = new Date();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    const updated = [];

    // Récupérer tous les profils de relations de faction
    const allRelations = await FactionRelations.find({});
    for (const rel of allRelations) {
      let changed = false;
      for (const faction of Object.keys(rel.threatLevels)) {
        const threat = rel.threatLevels[faction] || 0;
        if (threat > 0) {
          const last = rel.lastThreatActivity?.[faction];
          if (!last || (now - new Date(last)) >= TWELVE_HOURS) {
            rel.threatLevels[faction] = Math.max(0, threat - 1);
            rel.lastThreatActivity[faction] = now;
            changed = true;
          }
        }
      }
      if (changed) {
        await rel.save();
        updated.push(rel.clerkId);
      }
    }
    return NextResponse.json({
      success: true,
      updatedCount: updated.length,
      updated
    });
  } catch (error) {
    console.error('[CRON DECAY-THREAT] Erreur:', error);
    return new NextResponse('Erreur interne du serveur', { status: 500 });
  }
} 