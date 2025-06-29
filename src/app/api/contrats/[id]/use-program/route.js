import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import Program from '@/models/Program';
import PlayerInventory from '@/models/PlayerInventory';

export async function POST(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const { programId, category } = await request.json();
    if (!programId) {
      return new NextResponse("ID du programme manquant", { status: 400 });
    }

    await connectDb();

    const awaitedParams = await params;

    // Récupérer le contrat
    const contract = await Contract.findById(awaitedParams.id);
    if (!contract) {
      return new NextResponse("Contrat non trouvé", { status: 404 });
    }

    // Récupérer le programme
    const program = await Program.findById(programId);
    if (!program) {
      return new NextResponse("Programme non trouvé", { status: 404 });
    }

    // Récupérer l'inventaire du joueur
    const playerInventory = await PlayerInventory.findOne({ clerkId: userId });
    if (!playerInventory) {
      return new NextResponse("Inventaire non trouvé", { status: 404 });
    }

    // Vérifier que le joueur possède le programme
    let hasProgram = false;
    if (category === 'one_shot') {
      hasProgram = playerInventory.oneShotPrograms.some(item => 
        item.programId.equals(programId) && item.quantity > 0
      );
    } else if (category === 'information') {
      hasProgram = playerInventory.purchasedInformation.some(item => 
        item.programId.equals(programId)
      );
    }

    if (!hasProgram) {
      return new NextResponse("Vous ne possédez pas ce programme", { status: 400 });
    }

    // Déterminer si le programme peut être utilisé selon le statut du contrat
    const canUseOnProposed = [
      "Logiciel 'Mouchard'", // Peut révéler des compétences sur les contrats proposés
      "Analyseur de Contrat", // Peut analyser les contrats proposés
      // Ajouter d'autres programmes qui peuvent être utilisés sur les contrats proposés
    ];

    const canUseOnAssigned = [
      "Brise-Glace",
      "Sandevistan", 
      "Décharge IEM",
      "Zero Day",
      "Blackwall",
      // Ajouter d'autres programmes de combat/assistance
    ];

    // Vérifier les permissions selon le statut du contrat
    if (contract.status === 'Proposé') {
      if (!canUseOnProposed.includes(program.name)) {
        return new NextResponse("Ce programme ne peut être utilisé que sur des contrats assignés", { status: 400 });
      }
    } else if (contract.status === 'Assigné') {
      if (!canUseOnAssigned.includes(program.name) && !canUseOnProposed.includes(program.name)) {
        return new NextResponse("Ce programme ne peut pas être utilisé sur ce type de contrat", { status: 400 });
      }
    } else {
      return new NextResponse("Le contrat doit être proposé ou assigné pour utiliser des programmes", { status: 400 });
    }

    // Appliquer les effets du programme
    const effects = program.effects;
    let revealedSkill = null;
    let skill = null;

    // Trouver ou créer l'entrée d'effets actifs pour ce joueur
    let effectEntry = contract.activeProgramEffects?.find(e => e.clerkId === userId);
    if (!effectEntry) {
      effectEntry = { clerkId: userId, effects: {} };
      if (!contract.activeProgramEffects) contract.activeProgramEffects = [];
      contract.activeProgramEffects.push(effectEntry);
    }

    // Brise-Glace : succès garanti
    if (effects.skip_skill_check) {
      effectEntry.effects.autoSuccess = true;
    }
    // Sandevistan : +3 à un test (on applique sur la première compétence du contrat)
    if (effects.add_bonus_roll) {
      const contractSkills = Object.entries(contract.requiredSkills || {}).filter(([_, v]) => v > 0);
      if (contractSkills.length > 0) {
        effectEntry.effects.bonusRoll = (effectEntry.effects.bonusRoll || 0) + effects.add_bonus_roll;
        effectEntry.effects.bonusSkill = contractSkills[0][0];
        skill = contractSkills[0][0];
      }
    }
    // Décharge IEM : -1 difficulté à tous les tests
    if (effects.reduce_difficulty) {
      effectEntry.effects.reduceDifficulty = (effectEntry.effects.reduceDifficulty || 0) + effects.reduce_difficulty;
    }
    // Programmes signature : stocker le nom
    if (program.isSignature) {
      effectEntry.effects.signature = program.name;
      // Appliquer tous les effets du programme signature
      if (effects.skip_skill_check) effectEntry.effects.autoSuccess = true;
      if (effects.add_bonus_roll) effectEntry.effects.bonusRoll = (effectEntry.effects.bonusRoll || 0) + effects.add_bonus_roll;
      if (effects.reduce_difficulty) effectEntry.effects.reduceDifficulty = (effectEntry.effects.reduceDifficulty || 0) + effects.reduce_difficulty;
    }

    // Effets de révélation de compétences
    if (effects.reveal_all_skills) {
      // Révéler toutes les compétences testées pour ce joueur
      const skillValues = contract.requiredSkills || {};
      const allSkills = Object.entries(skillValues)
        .filter(([skill, value]) => value > 0)
        .map(([skill]) => skill);
      let revealedEntry = contract.revealedSkillsByPlayer.find(e => e.clerkId === userId);
      if (!revealedEntry) {
        revealedEntry = { clerkId: userId, skills: [] };
        contract.revealedSkillsByPlayer.push(revealedEntry);
      }
      // Ajouter toutes les compétences non encore révélées
      allSkills.forEach(skill => {
        if (!revealedEntry.skills.includes(skill)) {
          revealedEntry.skills.push(skill);
        }
      });
      await Promise.all([
        playerInventory.save(),
        contract.save()
      ]);
      return NextResponse.json({
        success: true,
        message: `Toutes les compétences testées ont été révélées !`,
        revealedSkills: revealedEntry.skills,
        effects: effects
      });
    }
    if (effects.reveal_skill) {
      // Révéler la compétence la plus facile non révélée
      const skillValues = contract.requiredSkills || {};
      const skills = Object.entries(skillValues)
        .filter(([skill, value]) => value > 0)
        .map(([skill, value]) => ({ skill, value }));
      let revealedEntry = contract.revealedSkillsByPlayer.find(e => e.clerkId === userId);
      if (!revealedEntry) {
        revealedEntry = { clerkId: userId, skills: [] };
        contract.revealedSkillsByPlayer.push(revealedEntry);
      }
      const unrevealed = skills.filter(s => !revealedEntry.skills.includes(s.skill));
      if (unrevealed.length > 0) {
        const minSkill = unrevealed.reduce((min, curr) => curr.value < min.value ? curr : min, unrevealed[0]);
        revealedEntry.skills.push(minSkill.skill);
        revealedSkill = minSkill.skill;
      }
      await Promise.all([
        playerInventory.save(),
        contract.save()
      ]);
      return NextResponse.json({
        success: true,
        message: `Compétence révélée !`,
        revealedSkills: revealedEntry.skills,
        revealedSkill: revealedSkill,
        effects: effects
      });
    }

    // Consommer le programme
    if (category === 'one_shot') {
      const success = playerInventory.useOneShotProgram(programId);
      if (!success) {
        return new NextResponse("Erreur lors de la consommation du programme", { status: 500 });
      }
    } else if (category === 'information') {
      // Les informations sont consommées après utilisation
      playerInventory.purchasedInformation = playerInventory.purchasedInformation.filter(
        item => !item.programId.equals(programId)
      );
    }

    // Sauvegarder l'inventaire et le contrat
    await Promise.all([
      playerInventory.save(),
      contract.save()
    ]);

    return NextResponse.json({
      success: true,
      message: `Programme ${program.name} utilisé avec succès`,
      effects: effects,
      revealedSkill: revealedSkill,
      skill: skill,
      activeEffects: effectEntry.effects
    });

  } catch (error) {
    console.error("[API USE PROGRAM] Erreur:", error);
    return new NextResponse("Erreur interne du serveur", { status: 500 });
  }
} 