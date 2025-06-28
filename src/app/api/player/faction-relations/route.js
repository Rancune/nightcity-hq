import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import FactionRelations from '@/models/FactionRelations';
import { FACTIONS, getNegativeConsequences, getPositiveOpportunities } from '@/Lib/factionRelations';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();
    
    // Récupérer ou créer les relations de faction
    let factionRelations = await FactionRelations.findOne({ clerkId: userId });
    if (!factionRelations) {
      factionRelations = new FactionRelations({ clerkId: userId });
      await factionRelations.save();
    }

    // Préparer les données de réponse avec les statuts et opportunités
    const relationsData = {};
    Object.keys(FACTIONS).forEach(factionKey => {
      const faction = FACTIONS[factionKey];
      const relationValue = factionRelations.relations[factionKey] || 0;
      const status = factionRelations.getRelationStatus(factionKey);
      const threatLevel = factionRelations.threatLevels[factionKey] || 0;
      
      relationsData[factionKey] = {
        name: faction.name,
        type: faction.type,
        description: faction.description,
        currency: faction.currency,
        retaliation: faction.retaliation,
        relationValue: relationValue,
        status: status,
        threatLevel: threatLevel,
        consequences: getNegativeConsequences(factionKey, threatLevel, faction.type),
        opportunities: getPositiveOpportunities(factionKey, relationValue, faction.type),
        allies: faction.allies,
        enemies: faction.enemies,
        neutral: faction.neutral
      };
    });

    return NextResponse.json({
      factionRelations: relationsData,
      history: factionRelations.history.slice(-10), // 10 derniers événements
      unlockedOpportunities: factionRelations.unlockedOpportunities
    });

  } catch (error) {
    console.error("[API FACTION-RELATIONS] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 