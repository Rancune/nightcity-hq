import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Program from '@/models/Program';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();
    
    // Désactiver tous les programmes existants
    await Program.updateMany({}, { isActive: false });
    
    // Créer quelques programmes de base pour tester
    const basePrograms = [
      {
        name: "Virus 'Brise-Glace'",
        description: "Garantit le succès d'un test de compétence. Utilisation unique.",
        type: "one_shot",
        rarity: "rare",
        streetCredRequired: 0, // Accessible à tous pour les tests
        cost: 2500,
        stock: 3,
        maxStock: 3,
        effects: { skip_skill_check: true },
        vendorMessage: "ICE breaker de qualité. Un seul usage, mais garanti.",
        isActive: true,
        rotationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
      },
      {
        name: "Booster 'Sandevistan'",
        description: "Ajoute +3 à un jet de compétence. Utilisation unique.",
        type: "one_shot",
        rarity: "uncommon",
        streetCredRequired: 0,
        cost: 1500,
        stock: 5,
        maxStock: 5,
        effects: { add_bonus_roll: 3 },
        vendorMessage: "Accélération temporaire. Risque de surchauffe.",
        isActive: true,
        rotationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      {
        name: "Logiciel 'Mouchard'",
        description: "Révèle une compétence requise d'un contrat avant acceptation.",
        type: "one_shot",
        rarity: "common",
        streetCredRequired: 0,
        cost: 800,
        stock: 2,
        maxStock: 2,
        effects: { reveal_skill: true },
        vendorMessage: "Espionnage de base. Informations précieuses.",
        isActive: true,
        rotationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      {
        name: "Implant Neural 'HackMaster' Mk.I",
        description: "Un co-processeur neural standard qui optimise les algorithmes de piratage. Augmente définitivement le Hacking d'un runner de +1.",
        type: "implant",
        rarity: "uncommon",
        streetCredRequired: 0,
        cost: 80000,
        stock: 1,
        maxStock: 1,
        permanent_skill_boost: { skill: "hacking", value: 1 },
        vendorMessage: "Amélioration permanente. Installation risquée.",
        isActive: true,
        rotationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    ];

    // Créer les programmes
    const programs = basePrograms.map(programData => new Program(programData));
    await Program.insertMany(programs);

    console.log(`[INIT MARKET] ${programs.length} programmes de base créés`);

    return NextResponse.json({
      success: true,
      message: "Marché noir initialisé avec succès",
      programsCreated: programs.length,
      programs: basePrograms.map(p => ({
        name: p.name,
        type: p.type,
        cost: p.cost,
        stock: p.stock
      }))
    });

  } catch (error) {
    console.error("[API INIT-MARKET] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 