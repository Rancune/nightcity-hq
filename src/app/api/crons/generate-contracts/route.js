import { NextResponse } from 'next/server';
import Contract from '@/models/Contract';
import connectDb from '@/Lib/database';
import { generateContractLore } from '@/Lib/ai';
import { 
  getAvailableThreatLevels, 
  generateRequiredSkillsFromThreatLevel, 
  calculateRewardsFromThreatLevel,
  calculateRewardsWithFactionReputation,
  analyzeLoreForSkills 
} from '@/Lib/threatLevels';

export async function GET(request) {
  // --- SÉCURITÉ ---
  // Vérifier si on est en production et si CRON_SECRET est défini
  if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  // --- VÉRIFICATION ENVIRONNEMENT ---
  // Ne fonctionne qu'en production
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({ 
      success: true, 
      message: 'Génération automatique désactivée en développement' 
    });
  }

  try {
    await connectDb();
    
    // Compter les contrats proposés actuellement
    const currentCount = await Contract.countDocuments({ status: 'Proposé' });
    
    // Limite maximale de 12 contrats
    const MAX_CONTRACTS = 12;
    
    if (currentCount >= MAX_CONTRACTS) {
      return NextResponse.json({ 
        success: true, 
        message: `Déjà ${currentCount} contrats proposés (limite: ${MAX_CONTRACTS}), aucune génération.` 
      });
    }

    // --- LOGIQUE DE GÉNÉRATION ALÉATOIRE ---
    const now = new Date();
    const currentHour = now.getHours();
    
    // Heures de génération : 6h à 22h (journée active)
    const isActiveHours = currentHour >= 6 && currentHour <= 22;
    
    if (!isActiveHours) {
      return NextResponse.json({ 
        success: true, 
        message: `Hors des heures actives (${currentHour}h), aucune génération.` 
      });
    }

    // Probabilité de génération selon l'heure
    const hourProbabilities = {
      6: 0.3,   // Début de journée
      7: 0.4,
      8: 0.5,
      9: 0.6,
      10: 0.7,
      11: 0.8,
      12: 0.9,  // Heure de pointe
      13: 0.9,
      14: 0.8,
      15: 0.7,
      16: 0.6,
      17: 0.7,
      18: 0.8,  // Heure de pointe
      19: 0.8,
      20: 0.7,
      21: 0.5,
      22: 0.3   // Fin de journée
    };

    const generationProbability = hourProbabilities[currentHour] || 0.5;
    const shouldGenerate = Math.random() < generationProbability;

    if (!shouldGenerate) {
      return NextResponse.json({ 
        success: true, 
        message: `Pas de génération cette fois (probabilité: ${(generationProbability * 100).toFixed(1)}%)` 
      });
    }

    // --- GÉNÉRATION DU CONTRAT ---
    // Nombre de contrats à générer (1-3 selon l'heure)
    const maxToGenerate = currentHour >= 12 && currentHour <= 19 ? 3 : 1;
    const toGenerate = Math.min(
      Math.floor(Math.random() * maxToGenerate) + 1,
      MAX_CONTRACTS - currentCount
    );

    const results = [];
    
    for (let i = 0; i < toGenerate; i++) {
      try {
        // Génération du lore par IA
        const { title, description, factions, difficulty: loreDifficulty, type } = await generateContractLore();

        // Utiliser un profil de réputation moyen pour la génération automatique
        const averageReputation = 20; // Réputation moyenne pour contrats auto
        const availableThreatLevels = getAvailableThreatLevels(averageReputation);
        
        // Choisir un niveau de menace aléatoire
        const threatLevel = availableThreatLevels[Math.floor(Math.random() * availableThreatLevels.length)];
        
        // Générer les compétences requises
        const requiredSkills = generateRequiredSkillsFromThreatLevel(threatLevel, type);

        // Analyser le lore pour validation
        const loreSkills = analyzeLoreForSkills(description);

        // Calcul des récompenses avec réputation de faction
        const targetFactions = factions && factions.length > 0 ? factions : ['inframonde'];
        const targetFaction = targetFactions[0];
        const employerFaction = targetFactions.length > 1 ? targetFactions[1] : 'fixers';

        // Pour les contrats automatiques, utiliser une réputation neutre (0) avec la faction
        // Cela simule un fixer "moyen" qui n'a pas de relation particulière avec la faction
        const playerFactionReputation = 0;
        
        // Calculer les récompenses en tenant compte de la réputation avec la faction
        const rewards = calculateRewardsWithFactionReputation(threatLevel, employerFaction, playerFactionReputation);

        // Durée pour accepter le contrat (entre 1 et 3 heures de jeu actif)
      const randomAcceptanceDeadline = Math.floor(Math.random() * (10800 - 3600 + 1) + 3600);

      // Création du contrat
      const newContractData = {
        title,
        description,
        status: 'Proposé',
        ownerId: null,
        archetype: 'PIRATAGE_RAPIDE_v1',
          targetCorpo: targetFaction,
          targetFaction: targetFaction,
          employerFaction: employerFaction,
          involvedFactions: targetFactions,
          missionType: type,
          loreDifficulty: loreDifficulty,
          threatLevel: threatLevel,
          reward: { eddies: rewards.eddies, reputation: rewards.reputation },
        acceptance_deadline_trp: randomAcceptanceDeadline,
        consequence_tier: Math.floor(Math.random() * 2) + 1,
        requiredSkills,
          // Marquer comme généré automatiquement
          autoGenerated: true,
          generatedAt: new Date()
      };

      const contract = new Contract(newContractData);
      await contract.save();
        
        results.push({
          id: contract._id,
          title: contract.title,
          threatLevel: contract.threatLevel,
          reward: contract.reward
        });

        console.log(`[AUTO-GENERATE] Contrat créé: ${title} (Niveau: ${threatLevel}, Récompense: ${rewards.eddies}€$, Faction: ${employerFaction}, Réputation: ${playerFactionReputation})`);
        
      } catch (error) {
        console.error(`[AUTO-GENERATE] Erreur lors de la génération du contrat ${i + 1}:`, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      generated: results.length,
      currentTotal: currentCount + results.length,
      hour: currentHour,
      probability: generationProbability,
      contracts: results
    });

  } catch (error) {
    console.error('[AUTO-GENERATE] Erreur générale:', error);
    return new NextResponse('Erreur interne du serveur', { status: 500 });
  }
} 