// src/app/api/contrats/[id]/resolve/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import PlayerProfile from '@/models/PlayerProfile';
import { generateResolutionLore } from '@/Lib/ai';
import Netrunner from '@/models/Netrunner';


export async function POST(request, props) {
  const params = await props.params;
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    await connectDb();
    const contractId = params.id;
    const contract = await Contract.findById(contractId).populate('assignedRunner');

    if (!contract || contract.ownerId !== userId || contract.status !== 'En attente de rapport') {
      return new NextResponse("Contrat non valide pour cette action.", { status: 404 });
    }

    const isSuccess = contract.resolution_outcome === 'Succès';

    // --- On génère le lore et on applique les conséquences financières/réputation ---
    const debriefingText = await generateResolutionLore(contract.title, contract.assignedRunner.name, isSuccess);
    contract.debriefing_log = debriefingText;

    if (isSuccess) {
        // --- CONSÉQUENCES DU SUCCÈS (MISES À JOUR) ---
        console.log("[RESOLVE] La mission est un SUCCÈS.");
        contract.status = 'Terminé';
        contract.assignedRunner.status = 'Disponible';
        contract.assignedRunner.assignedContract = null;

        // --- LOGIQUE D'EXPÉRIENCE ---
        const xpGained = 50 + (contract.reward.reputation || 0); // XP = 50 + bonus de réputation
       
        // On met à jour l'expérience du runner
        contract.assignedRunner.xp += xpGained;
        console.log(`[XP] Le runner ${contract.assignedRunner.name} gagne ${xpGained} XP.`);

        // Vérification de la montée en niveau
        if (contract.assignedRunner.xp >= contract.assignedRunner.xpToNextLevel) {
          contract.assignedRunner.level += 1;
          contract.assignedRunner.xp -= contract.assignedRunner.xpToNextLevel; // On retire le coût du niveau
          contract.assignedRunner.xpToNextLevel = Math.floor(contract.assignedRunner.xpToNextLevel * 1.5); // Le prochain niveau est plus difficile

          // Le runner gagne +1 dans une compétence aléatoire !
          const skills = ['hacking', 'stealth', 'combat'];
          const randomSkillUp = skills[Math.floor(Math.random() * skills.length)];
          contract.assignedRunner.skills[randomSkillUp] += 1;

          // On prépare la notification pour le frontend !
          const levelUpInfo = { newLevel: contract.assignedRunner.level, skillUp: randomSkillUp, runnerName: contract.assignedRunner.name };
          console.log(`[LEVEL UP] ${levelUpInfo.runnerName} passe au niveau ${levelUpInfo.newLevel} ! +1 en ${levelUpInfo.skillUp}.`);
        }
        // -----------------------------

        // Sauvegarde du runner avec ses nouvelles stats
        await contract.assignedRunner.save();

        await PlayerProfile.updateOne({ clerkId: userId }, { 
          $inc: { eddies: contract.reward.eddies, reputation: contract.reward.reputation }
        });
    } else {
      contract.status = 'Échoué';
      await PlayerProfile.updateOne({ clerkId: userId }, { $inc: { reputation: -50 } });
    }

    await contract.save();
    if (contract.assignedRunner.status !== 'Mort') await contract.assignedRunner.save();
    else await Netrunner.deleteOne({ _id: contract.assignedRunner._id });

    // On renvoie le contrat complet pour l'afficher dans la modale
    return NextResponse.json({ success: isSuccess, updatedContract: contract });

  } catch (error) {
    console.error("[API RESOLVE] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
}