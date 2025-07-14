// src/app/api/netrunners/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Netrunner from '@/models/Netrunner';
import PlayerProfile from '@/models/PlayerProfile';
import { updatePlayerTimers } from '@/Lib/trp';
import { generateRunnerNameAndLore } from '@/Lib/ai';

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
    let runners = await Netrunner.find({ ownerId: userId }); // plus lean ici car on va peut-être modifier

    // Mise à jour auto des runners grillés dont le timer est fini
    const now = new Date();
    let hasUpdates = false;
    for (const runner of runners) {
      if (runner.status === 'Grillé' && runner.recoveryUntil && runner.recoveryUntil <= now) {
        runner.status = 'Disponible';
        runner.recoveryUntil = null;
        await runner.save();
        hasUpdates = true;
      }
    }
    // On repasse en lean pour la suite
    runners = runners.map(r => r.toObject());

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
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();

    // Récupérer les données de la requête
    const body = await request.json();
    const { name, skills } = body;

    // Génération des données du runner
    let runnerName, runnerSkills, runnerLore;
    if (name && skills) {
      runnerName = name;
      runnerSkills = skills;
      runnerLore = null; // Pas de lore pour les runners créés manuellement
    } else {
      // Générer les compétences aléatoirement
      runnerSkills = {
        hacking: Math.floor(Math.random() * 5) + 1,
        stealth: Math.floor(Math.random() * 5) + 1,
        combat: Math.floor(Math.random() * 5) + 1,
      };

      // Générer le nom et le lore par IA
      try {
        const { name: aiName, lore: aiLore } = await generateRunnerNameAndLore(runnerSkills);
        runnerName = aiName;
        runnerLore = aiLore;
        console.log(`[NETRUNNERS] Runner généré par IA: ${runnerName}`);
      } catch (error) {
        console.error("[NETRUNNERS] Erreur lors de la génération IA, utilisation du fallback:", error);
        // Fallback avec des noms prédéfinis (sans lore)
        const firstNames = ["Jax", "Cyra", "Kael", "Nyx", "Rogue", "Spike", "Vex"];
        const lastNames = ["Vector", "Byte", "Chrome", "Neon", "Silas", "Zero", "Glitch"];
        const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        runnerName = `${randomFirstName} ${randomLastName}`;
        runnerLore = null;
      }
    }

    // Calcul de la commission initiale du Fixer selon le GDD
    // Commission de base : 25% - (0.5% * total points de compétence)
    const totalPoints = runnerSkills.hacking + runnerSkills.stealth + runnerSkills.combat;
    let fixerCommission = 25 - (totalPoints * 0.5);
    fixerCommission = Math.max(0, Math.min(fixerCommission, 50)); // Clamp entre 0% et 50%
    fixerCommission = Math.round(fixerCommission * 10) / 10; // arrondi à 0.1 près

    // Création du runner
    const newRunner = new Netrunner({
      ownerId: userId,
      name: runnerName,
      lore: runnerLore,
      skills: runnerSkills,
      fixerCommission
    });
    await newRunner.save();

    return NextResponse.json({
      success: true,
      message: `Runner ${runnerName} recruté avec succès !`,
      runner: newRunner,
      fixerCommission
    });
  } catch (error) {
    console.error("[API POST /netrunners] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}