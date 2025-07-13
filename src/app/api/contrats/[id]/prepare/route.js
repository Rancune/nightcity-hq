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

    console.log(`[PREPARE DEBUG] Statut du contrat: ${contract.status}`);
    console.log(`[PREPARE DEBUG] Compétences requises:`, contract.requiredSkills);
    console.log(`[PREPARE DEBUG] Programmes à équiper:`, programs);

    // Trouver ou créer l'entrée d'effets actifs pour ce joueur
    let effectEntry = contract.activeProgramEffects?.find(e => e.clerkId === userId);
    if (!effectEntry) {
      effectEntry = { clerkId: userId, effects: { skillBonuses: {} } };
      if (!contract.activeProgramEffects) contract.activeProgramEffects = [];
      contract.activeProgramEffects.push(effectEntry);
    }

    // Initialiser skillBonuses si pas présent
    if (!effectEntry.effects.skillBonuses) {
      effectEntry.effects.skillBonuses = {};
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
        console.log(`[PREPARE DEBUG] Programme ${program.name} - Bonus: +${effects.add_bonus_roll}, Skill: ${effects.skill}`);
        console.log(`[PREPARE DEBUG] Compétences testées du contrat:`, contract.requiredSkills);
        
        // Appliquer le bonus à la compétence spécifiée dans l'objet
        let targetSkill = null;
        if (effects.skill && effects.skill !== 'all') {
          targetSkill = effects.skill;
          console.log(`[PREPARE DEBUG] Bonus spécifique détecté pour: ${targetSkill}`);
        } else if (effects.skill === 'all') {
          console.log(`[PREPARE DEBUG] Bonus global détecté (all) - application à toutes les compétences`);
          // Si 'all', appliquer à toutes les compétences testées
          const contractSkills = Object.entries(contract.requiredSkills || {}).filter(([_, v]) => v > 0);
          contractSkills.forEach(([skill]) => {
            if (!effectEntry.effects.skillBonuses[skill]) {
              effectEntry.effects.skillBonuses[skill] = 0;
            }
            effectEntry.effects.skillBonuses[skill] += effects.add_bonus_roll;
            console.log(`[PREPARE DEBUG] Bonus +${effects.add_bonus_roll} appliqué à ${skill} (total: ${effectEntry.effects.skillBonuses[skill]})`);
          });
        } else {
          console.log(`[PREPARE DEBUG] Aucun skill spécifié - fallback sur la première compétence`);
          // Fallback : première compétence du contrat
          const contractSkills = Object.entries(contract.requiredSkills || {}).filter(([_, v]) => v > 0);
          if (contractSkills.length > 0) {
            targetSkill = contractSkills[0][0];
            console.log(`[PREPARE DEBUG] Première compétence sélectionnée: ${targetSkill}`);
          }
        }
        
        // Appliquer le bonus à la compétence ciblée
        if (targetSkill) {
          if (!effectEntry.effects.skillBonuses[targetSkill]) {
            effectEntry.effects.skillBonuses[targetSkill] = 0;
          }
          effectEntry.effects.skillBonuses[targetSkill] += effects.add_bonus_roll;
          console.log(`[PREPARE DEBUG] Bonus +${effects.add_bonus_roll} appliqué à ${targetSkill} (total: ${effectEntry.effects.skillBonuses[targetSkill]})`);
        }
        
        console.log(`[PREPARE DEBUG] État final des skillBonuses après ${program.name}:`, effectEntry.effects.skillBonuses);
      }
      if (effects.reduce_difficulty) {
        effectEntry.effects.reduceDifficulty = (effectEntry.effects.reduceDifficulty || 0) + effects.reduce_difficulty;
      }
      if (program.isSignature) {
        effectEntry.effects.signature = program.name;
        if (effects.skip_skill_check) effectEntry.effects.autoSuccess = true;
        if (effects.add_bonus_roll) {
          // Appliquer les bonus du programme signature
          if (effects.skill === 'all') {
            const contractSkills = Object.entries(contract.requiredSkills || {}).filter(([_, v]) => v > 0);
            contractSkills.forEach(([skill]) => {
              if (!effectEntry.effects.skillBonuses[skill]) {
                effectEntry.effects.skillBonuses[skill] = 0;
              }
              effectEntry.effects.skillBonuses[skill] += effects.add_bonus_roll;
            });
          } else if (effects.skill) {
            if (!effectEntry.effects.skillBonuses[effects.skill]) {
              effectEntry.effects.skillBonuses[effects.skill] = 0;
            }
            effectEntry.effects.skillBonuses[effects.skill] += effects.add_bonus_roll;
          }
        }
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