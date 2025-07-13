import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Program from '@/models/Program';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    await connectDb();

    // Définir les stocks selon la rareté et le type
    const stockRules = {
      // Programmes one-shot
      'one_shot': {
        'common': { stock: 10, maxStock: 10 },
        'uncommon': { stock: 5, maxStock: 5 },
        'rare': { stock: 3, maxStock: 3 },
        'epic': { stock: 2, maxStock: 2 },
        'legendary': { stock: 1, maxStock: 1 }
      },
      // Implants
      'implant': {
        'common': { stock: 3, maxStock: 3 },
        'uncommon': { stock: 2, maxStock: 2 },
        'rare': { stock: 1, maxStock: 1 },
        'epic': { stock: 1, maxStock: 1 },
        'legendary': { stock: 1, maxStock: 1 }
      },
      // Informations
      'information': {
        'common': { stock: 5, maxStock: 5 },
        'uncommon': { stock: 3, maxStock: 3 },
        'rare': { stock: 2, maxStock: 2 },
        'epic': { stock: 1, maxStock: 1 },
        'legendary': { stock: 1, maxStock: 1 }
      },
      // Sabotage
      'sabotage': {
        'common': { stock: 3, maxStock: 3 },
        'uncommon': { stock: 2, maxStock: 2 },
        'rare': { stock: 1, maxStock: 1 },
        'epic': { stock: 1, maxStock: 1 },
        'legendary': { stock: 1, maxStock: 1 }
      }
    };

    // Récupérer tous les programmes
    const programs = await Program.find({});
    let updated = 0;

    for (const program of programs) {
      const rule = stockRules[program.type]?.[program.rarity];
      
      if (rule && !program.isSignature) {
        // Ne pas modifier les objets Signature
        const oldStock = program.stock;
        program.stock = rule.stock;
        program.maxStock = rule.maxStock;
        
        await program.save();
        updated++;
        
        console.log(`[MARKET RESET] ${program.name}: ${oldStock} → ${rule.stock} stock`);
      }
    }

    console.log(`[MARKET RESET] ${updated} programmes mis à jour par ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Tous les stocks ont été régénérés",
      details: {
        programsUpdated: updated,
        totalPrograms: programs.length
      }
    });

  } catch (error) {
    console.error("[API MARKET RESET STOCKS] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 