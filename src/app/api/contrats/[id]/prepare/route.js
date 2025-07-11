import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDb from '@/Lib/database';
import Contract from '@/models/Contract';
import Program from '@/models/Program';
import PlayerInventory from '@/models/PlayerInventory';

export async function POST(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Non autorisé', { status: 401 });

    const { programs } = await request.json(); // [{ programId, category }]
    if (!Array.isArray(programs) || programs.length === 0) {
      return new NextResponse('Liste de programmes manquante ou vide', { status: 400 });
    }

    await connectDb();
    const contract = await Contract.findById(params.id);
    if (!contract) {
      return new NextResponse('Contrat non trouvé', { status: 404 });
    }
    const playerInventory = await PlayerInventory.findOne({ clerkId: userId });
    if (!playerInventory) {
      return new NextResponse('Inventaire non trouvé', { status: 404 });
    }

    // Trouver ou créer l'entrée d'effets actifs pour ce joueur
    let effectEntry = contract.activeProgramEffects?.find(e => e.clerkId === userId);
    if (!effectEntry) {
      effectEntry = { clerkId: userId, effects: {} };
      if (!contract.activeProgramEffects) contract.activeProgramEffects = [];
      contract.activeProgramEffects.push(effectEntry);
    }

    // Pour chaque programme à équiper
    for (const { programId, category } of programs) {
      const program = await Program.findById(programId);
      if (!program) {
        return new NextResponse(`Programme non trouvé: ${programId}`, { status: 404 });
      }
      // Vérifier possession
      let hasProgram = false;
      if (category === 'one_shot') {
        hasProgram = playerInventory.oneShotPrograms.some(item => item.programId.equals(programId) && item.quantity > 0);
      } else if (category === 'information') {
        hasProgram = playerInventory.purchasedInformation.some(item => item.programId.equals(programId));
      }
      if (!hasProgram) {
        return new NextResponse(`Vous ne possédez pas ce programme: ${program.name}`, { status: 400 });
      }
      // Appliquer les effets (similaire à use-program)
      const effects = program.effects;
      if (effects.skip_skill_check) {
        effectEntry.effects.autoSuccess = true;
      }
      // Ne pas appliquer les bonus si le programme est utilisé pour révéler une compétence
      if (effects.add_bonus_roll && !effects.reveal_skill && !effects.reveal_all_skills) {
        const contractSkills = Object.entries(contract.requiredSkills || {}).filter(([_, v]) => v > 0);
        if (contractSkills.length > 0) {
          effectEntry.effects.bonusRoll = (effectEntry.effects.bonusRoll || 0) + effects.add_bonus_roll;
          
          // Utiliser la compétence spécifiée dans l'objet si elle existe, sinon la première du contrat
          let targetSkill = null;
          if (effects.skill && effects.skill !== 'all') {
            // Vérifier que la compétence spécifiée est bien requise par le contrat
            if (contract.requiredSkills[effects.skill] > 0) {
              targetSkill = effects.skill;
            }
          }
          
          // Si aucune compétence spécifique ou si elle n'est pas requise, utiliser la première
          if (!targetSkill) {
            targetSkill = contractSkills[0][0];
          }
          
          effectEntry.effects.bonusSkill = targetSkill;
          
          // Cas spécial : si skill === 'all', le bonus s'applique à toutes les compétences
          if (effects.skill === 'all') {
            effectEntry.effects.bonusSkill = 'all';
          }
        }
      }
      if (effects.reduce_difficulty) {
        effectEntry.effects.reduceDifficulty = (effectEntry.effects.reduceDifficulty || 0) + effects.reduce_difficulty;
      }
      if (program.isSignature) {
        effectEntry.effects.signature = program.name;
        if (effects.skip_skill_check) effectEntry.effects.autoSuccess = true;
        if (effects.add_bonus_roll) effectEntry.effects.bonusRoll = (effectEntry.effects.bonusRoll || 0) + effects.add_bonus_roll;
        if (effects.reduce_difficulty) effectEntry.effects.reduceDifficulty = (effectEntry.effects.reduceDifficulty || 0) + effects.reduce_difficulty;
      }
      // Consommer le programme
      if (category === 'one_shot') {
        const prog = playerInventory.oneShotPrograms.find(item => item.programId.equals(programId));
        if (!prog || prog.quantity <= 0) {
          return new NextResponse(`Erreur lors de la consommation du programme: ${program.name}`, { status: 500 });
        }
        prog.quantity -= 1;
      } else if (category === 'information') {
        playerInventory.purchasedInformation = playerInventory.purchasedInformation.filter(
          item => !item.programId.equals(programId)
        );
      }
    }
    await Promise.all([
      playerInventory.save(),
      contract.save()
    ]);
    return NextResponse.json({
      success: true,
      message: 'Programmes équipés avec succès',
      activeEffects: effectEntry.effects
    });
  } catch (err) {
    console.error(err);
    return new NextResponse('Erreur serveur', { status: 500 });
  }
} 