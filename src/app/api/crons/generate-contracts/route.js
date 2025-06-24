import { NextResponse } from 'next/server';
import Contract from '@/models/Contract';
import connectDb from '@/Lib/database';
import { generateContractLore } from '@/Lib/ai';
import { determineDifficulty, calculateReputationGain } from '@/Lib/reputation';

export async function GET(request) {
  // --- SÉCURITÉ ---
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await connectDb();
    // Compter les contrats proposés
    const count = await Contract.countDocuments({ status: 'Proposé' });
    if (count >= 9) {
      return NextResponse.json({ success: true, message: 'Déjà 9 contrats proposés, aucune génération.' });
    }
    // Générer entre 1 et (9-count) contrats, mais de façon aléatoire (jour/nuit)
    const toGenerate = Math.floor(Math.random() * (9 - count)) + 1;
    const results = [];
    for (let i = 0; i < toGenerate; i++) {
      // Génération du lore
      const { title, description } = await generateContractLore();
      // Données gameplay
      const corpos = ['Arasaka', 'Militech', 'Kang Tao', 'NetWatch'];
      const randomCorpo = corpos[Math.floor(Math.random() * corpos.length)];
      const requiredHacking = Math.floor(Math.random() * 7) + 2;
      const requiredStealth = Math.floor(Math.random() * 7) + 2;
      const requiredCombat = Math.floor(Math.random() * 7) + 2;
      const requiredSkills = { hacking: requiredHacking, stealth: requiredStealth, combat: requiredCombat };
      const difficulty = determineDifficulty(requiredSkills);
      const actualReputation = calculateReputationGain(difficulty);
      const difficultyMultiplier = { 'EASY': 1, 'MEDIUM': 1.5, 'HARD': 2.5, 'VERY_HARD': 4 };
      const baseEddies = 10000;
      const randomRewardEddies = Math.floor(baseEddies * difficultyMultiplier[difficulty] * (0.8 + Math.random() * 0.4));
      const randomAcceptanceDeadline = Math.floor(Math.random() * (10800 - 3600 + 1) + 3600);
      // Création du contrat
      const newContractData = {
        title,
        description,
        status: 'Proposé',
        ownerId: null,
        archetype: 'PIRATAGE_RAPIDE_v1',
        targetCorpo: randomCorpo,
        reward: { eddies: randomRewardEddies, reputation: actualReputation },
        acceptance_deadline_trp: randomAcceptanceDeadline,
        consequence_tier: Math.floor(Math.random() * 2) + 1,
        requiredSkills,
      };
      const contract = new Contract(newContractData);
      await contract.save();
      results.push(contract);
    }
    return NextResponse.json({ success: true, generated: results.length });
  } catch (error) {
    console.error('[CRON GENERATE-CONTRACTS] Erreur:', error);
    return new NextResponse('Erreur interne du serveur', { status: 500 });
  }
} 