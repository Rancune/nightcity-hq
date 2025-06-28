// src/app/api/netrunners/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Netrunner from '@/models/Netrunner';
import PlayerProfile from '@/models/PlayerProfile';
import { updatePlayerTimers } from '@/Lib/trp';

// GET : Pour récupérer la liste des runners du joueur connecté
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    // ON DÉCLENCHE LE TICK DE L'HORLOGE ICI AUSSI
    await updatePlayerTimers(userId);

    await connectDb();
    // On ajoute .lean() par bonne pratique pour la performance
    const runners = await Netrunner.find({ ownerId: userId }).lean(); 
    
    // Récupérer les détails des implants installés
    const runnersWithImplants = await Promise.all(
      runners.map(async (runner) => {
        const installedImplants = runner.installedImplants || [];
        
        // Récupérer les détails des programmes pour chaque implant
        const implantsWithDetails = await Promise.all(
          installedImplants.map(async (implant) => {
            // Import dynamique pour éviter les problèmes de circular dependency
            const { default: Program } = await import('@/models/Program');
            const program = await Program.findById(implant.programId).lean();
            
            return {
              ...implant,
              program: program ? {
                _id: program._id,
                name: program.name,
                description: program.description,
                rarity: program.rarity,
                category: program.category,
                effects: program.effects
              } : null
            };
          })
        );
        
        return {
          ...runner,
          installedImplants: implantsWithDetails
        };
      })
    );
    
    return NextResponse.json(runnersWithImplants);

  } catch (error) {
    console.error("[API GET /netrunners] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}

// POST : Pour recruter (générer) un nouveau runner
export async function POST() {
  try {
    const { userId } = await auth();
    console.log("[API POST /netrunners] userId from auth:", userId);
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();

    const RECRUIT_COST = 500;
    let player = await PlayerProfile.findOne({ clerkId: userId });

    if (!player) {
      // Crée un nouveau profil joueur avec le solde de départ et un handle unique
      const uniqueHandle = `runner_${userId.slice(-6)}`;
      player = new PlayerProfile({
        clerkId: userId,
        eddies: 1000, // montant de départ
        handle: uniqueHandle,
        // Ajoute ici d'autres champs par défaut si besoin
      });
      await player.save();
      console.log("[API POST /netrunners] Nouveau profil joueur créé pour:", userId, "avec handle:", uniqueHandle);
    }

    console.log(`[API POST /netrunners] userId: ${userId}, eddies: ${player ? player.eddies : 'player not found'}`);

    if (!player || player.eddies < RECRUIT_COST) {
      return new NextResponse("Fonds insuffisants pour recruter.", { status: 400 });
    }

    player.eddies -= RECRUIT_COST;

    const firstNames = ["Jax", "Cyra", "Kael", "Nyx", "Rogue", "Spike", "Vex"];
    const lastNames = ["Vector", "Byte", "Chrome", "Neon", "Silas", "Zero", "Glitch"];

    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const runnerName = `${randomFirstName} ${randomLastName}`;

    const newRunner = new Netrunner({
      ownerId: userId,
      name: runnerName,
      // --- LA PARTIE IMPORTANTE ---
      // On génère des compétences aléatoires entre 1 et 5
      skills: {
        hacking: Math.floor(Math.random() * 5) + 1,
        stealth: Math.floor(Math.random() * 5) + 1,
        combat: Math.floor(Math.random() * 5) + 1,
      }
    });

    await newRunner.save();
    await player.save();

    console.log(`[API POST /netrunners] Nouveau runner créé: ${runnerName} pour ${userId}`);

    return NextResponse.json({
      success: true,
      message: `Runner ${runnerName} recruté avec succès !`,
      runner: newRunner
    });

  } catch (error) {
    console.error("[API POST /netrunners] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}