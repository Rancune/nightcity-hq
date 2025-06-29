// src/app/netrunners/[id]/page.js
import Link from 'next/link';
import connectDb from '@/Lib/database';
import Netrunner from '@/models/Netrunner';
import Contract from '@/models/Contract';
import Program from '@/models/Program';

// Fonction serveur pour récupérer les données du runner et de ses missions
async function getRunnerData(id) {
  try {
    await connectDb();
    
    // Récupérer le runner avec les détails des implants
    const runner = await Netrunner.findById(id).lean();
    
    if (!runner) return null;

    // Récupérer les détails des programmes pour les implants installés
    const implantsWithDetails = [];
    if (runner.installedImplants && runner.installedImplants.length > 0) {
      for (const implant of runner.installedImplants) {
        const program = await Program.findById(implant.programId).lean();
        if (program) {
          implantsWithDetails.push({
            ...implant,
            program: {
              _id: program._id,
              name: program.name,
              description: program.description,
              rarity: program.rarity,
              category: program.category,
              effects: program.effects
            }
          });
        }
      }
    }

    // Historique des missions
    const missionHistory = await Contract.find({ 
      assignedRunner: id, 
      status: { $in: ['Terminé', 'Échoué', 'En attente de rapport'] } 
    }).lean();

    // Statistiques calculées
    const totalMissions = missionHistory.length;
    const successfulMissions = missionHistory.filter(m => m.resolution_outcome === 'Succès').length;
    const failedMissions = missionHistory.filter(m => m.resolution_outcome === 'Échec').length;
    const successRate = totalMissions > 0 ? Math.round((successfulMissions / totalMissions) * 100) : 0;

    // Générer le lore et la phrase fétiche basés sur les stats
    const generateLore = (runner) => {
      const totalPower = runner.skills.hacking + runner.skills.stealth + runner.skills.combat;
      const level = runner.level;
      
      if (level >= 5) {
        return `${runner.name} est un vétéran des rues de Night City, un runner légendaire dont les exploits résonnent encore dans les bas-fonds. Avec ${totalPower} points de puissance totale, ce netrunner a survécu à plus de ${totalMissions} missions dans les zones les plus dangereuses de la ville.`;
      } else if (level >= 3) {
        return `${runner.name} a fait ses preuves dans les rues de Night City. Ce runner expérimenté a développé une réputation solide grâce à ${totalMissions} missions accomplies avec un taux de réussite de ${successRate}%.`;
      } else {
        return `${runner.name} est un runner en devenir, encore en train d'apprendre les rouages de Night City. Avec ${totalPower} points de puissance, ce débutant prometteur cherche à se faire un nom dans les rues.`;
      }
    };

    const generateCatchphrase = (runner) => {
      const phrases = [
        `"Dans la matrice, je suis le fantôme qui hante vos systèmes."`,
        `"Le code ne ment jamais, contrairement aux hommes."`,
        `"Chaque mission est une danse avec la mort numérique."`,
        `"Les rues de Night City m'ont forgé, le code m'a libéré."`,
        `"Je ne hack pas les systèmes, je les persuade."`,
        `"La vérité est dans les données, la survie dans l'ombre."`,
        `"Un runner ne meurt jamais, il se déconnecte simplement."`,
        `"Les corporations pensent contrôler la matrice. Elles se trompent."`
      ];
      
      // Utiliser l'ID du runner pour sélectionner une phrase de manière déterministe
      const index = runner._id.toString().charCodeAt(0) % phrases.length;
      return phrases[index];
    };

    const runnerWithDetails = {
      ...runner,
      installedImplants: implantsWithDetails,
      lore: generateLore(runner),
      catchphrase: generateCatchphrase(runner),
      stats: {
        totalMissions,
        successfulMissions,
        failedMissions,
        successRate
      }
    };

    return JSON.parse(JSON.stringify({ runner: runnerWithDetails, missionHistory }));
  } catch (error) {
    console.error("Erreur de récupération du runner:", error);
    return null;
  }
}

export default async function RunnerDetailsPage({ params }) {
  const awaitedParams = await params;
  const data = await getRunnerData(awaitedParams.id);

  if (!data) {
    return (
      <div className="page-container">
        <div className="content-wrapper">
          <div className="empty-state">
            <div className="empty-state-icon">❌</div>
            <p className="empty-state-text">Runner non trouvé</p>
            <Link href="/netrunners" className="btn-primary mt-4">
              Retour à l&apos;écurie
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { runner, missionHistory } = data;

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'legendary': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Disponible': return 'text-green-400';
      case 'En mission': return 'text-yellow-400';
      case 'Grillé': return 'text-red-400';
      case 'Mort': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <main className="page-container">
      <div className="content-wrapper">
        {/* En-tête */}
        <div className="page-header">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/netrunners" className="text-[--color-neon-cyan] hover:underline mb-2 inline-block">
                &larr; Retour à l&apos;écurie
              </Link>
              <h1 className="page-title">{runner.name}</h1>
              <p className="page-subtitle">Détails du Netrunner</p>
            </div>
            <div className="text-right">
              <div className={`badge ${getStatusColor(runner.status)}`}>
                {runner.status}
              </div>
              <p className="text-sm text-[--color-text-secondary] mt-1">
                Niveau {runner.level} • {runner.stats.totalMissions} missions
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale - Informations du runner */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profil et Lore */}
            <div className="card">
              <h2 className="card-title mb-4">Profil</h2>
              <div className="space-y-4">
                <div className="bg-black/30 p-4 rounded border border-[--color-border-dark]">
                  <p className="text-[--color-text-secondary] text-sm mb-2">Phrase fétiche</p>
                  <p className="text-[--color-neon-cyan] italic">&quot;{runner.catchphrase}&quot;</p>
                </div>
                
                <div className="bg-black/30 p-4 rounded border border-[--color-border-dark]">
                  <p className="text-[--color-text-secondary] text-sm mb-2">Lore</p>
                  <p className="text-[--color-text-primary] leading-relaxed">{runner.lore}</p>
                </div>
              </div>
            </div>

            {/* Compétences et Statistiques */}
            <div className="card">
              <h2 className="card-title mb-4">Compétences & Statistiques</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Compétences */}
                <div>
                  <h3 className="text-lg text-[--color-text-primary] font-bold mb-3">Compétences</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[--color-text-secondary]">Hacking</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-800 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(runner.skills.hacking / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-white font-bold w-8 text-right">{runner.skills.hacking}/10</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-[--color-text-secondary]">Stealth</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-800 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(runner.skills.stealth / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-white font-bold w-8 text-right">{runner.skills.stealth}/10</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-[--color-text-secondary]">Combat</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-800 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${(runner.skills.combat / 10) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-white font-bold w-8 text-right">{runner.skills.combat}/10</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-[--color-neon-cyan]/10 rounded border border-[--color-neon-cyan]/20">
                    <p className="text-sm text-[--color-text-secondary]">Puissance totale</p>
                    <p className="text-2xl text-[--color-neon-cyan] font-bold">
                      {runner.skills.hacking + runner.skills.stealth + runner.skills.combat}
                    </p>
                  </div>
                </div>

                {/* Statistiques */}
                <div>
                  <h3 className="text-lg text-[--color-text-primary] font-bold mb-3">Statistiques</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[--color-text-secondary]">Missions totales</span>
                      <span className="text-white font-bold">{runner.stats.totalMissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[--color-text-secondary]">Missions réussies</span>
                      <span className="text-green-400 font-bold">{runner.stats.successfulMissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[--color-text-secondary]">Missions échouées</span>
                      <span className="text-red-400 font-bold">{runner.stats.failedMissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[--color-text-secondary]">Taux de réussite</span>
                      <span className="text-[--color-neon-pink] font-bold">{runner.stats.successRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[--color-text-secondary]">Commission Fixer</span>
                      <span className="text-[--color-neon-cyan] font-bold">{runner.fixerCommission?.toFixed(1) || '??'}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Barre d'expérience */}
            <div className="card">
              <h2 className="card-title mb-4">Progression</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[--color-text-secondary]">Niveau {runner.level}</span>
                  <span className="text-[--color-text-secondary]">
                    {runner.xp || 0} / {runner.xpToNextLevel || 100} XP
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-[--color-neon-cyan] to-[--color-neon-pink] h-3 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, ((runner.xp || 0) / (runner.xpToNextLevel || 100)) * 100)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-[--color-text-secondary]">
                  {runner.xpToNextLevel - (runner.xp || 0)} XP restants pour le niveau {runner.level + 1}
                </p>
              </div>
            </div>

            {/* Historique des missions */}
            <div className="card">
              <h2 className="card-title mb-4">Historique des Missions</h2>
              <div className="space-y-3">
                {missionHistory.length > 0 ? (
                  missionHistory.map(contract => (
                    <div 
                      key={contract._id} 
                      className={`p-4 rounded border transition-all ${
                        contract.resolution_outcome === 'Succès' 
                          ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50' 
                          : contract.resolution_outcome === 'Échec'
                          ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
                          : 'bg-gray-500/10 border-gray-500/30 hover:border-gray-500/50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-[--color-text-primary] font-bold">{contract.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          contract.resolution_outcome === 'Succès' 
                            ? 'bg-green-500/20 text-green-400' 
                            : contract.resolution_outcome === 'Échec'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {contract.resolution_outcome || contract.status}
                        </span>
                      </div>
                      <p className="text-sm text-[--color-text-secondary] mb-2">{contract.description}</p>
                      <div className="flex justify-between text-xs text-[--color-text-secondary]">
                        <span>Récompense: {contract.reward?.eddies?.toLocaleString('en-US')} €$</span>
                        <span>Difficulté: {contract.loreDifficulty || 'moyen'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <p className="empty-state-text">Aucune mission archivée</p>
                    <p className="empty-state-subtext">
                      Ce runner n&apos;a pas encore accompli de missions
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne latérale - Implants et Chromes */}
          <div className="lg:col-span-1 space-y-6">
            {/* Implants installés */}
            <div className="card">
              <h2 className="card-title mb-4">🔧 Implants Installés</h2>
              <div className="space-y-3">
                {runner.installedImplants && runner.installedImplants.length > 0 ? (
                  runner.installedImplants.map((implant, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-black/30 rounded border border-[--color-border-dark] hover:border-[--color-neon-cyan]/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-[--color-text-primary] font-bold text-sm">
                          {implant.program?.name || 'Implant inconnu'}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded ${getRarityColor(implant.program?.rarity)}`}>
                          {implant.program?.rarity?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-[--color-text-secondary] mb-2">
                        {implant.program?.description}
                      </p>
                      <div className="text-xs text-[--color-neon-cyan]">
                        Installé le {new Date(implant.installedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">🔧</div>
                    <p className="empty-state-text">Aucun implant installé</p>
                    <p className="empty-state-subtext">
                      Ce runner n&apos;a pas encore d&apos;implants
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="card">
              <h2 className="card-title mb-4">Informations</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[--color-text-secondary]">Status</span>
                  <span className={`${getStatusColor(runner.status)}`}>{runner.status}</span>
                </div>
                
                {runner.recoveryUntil && (
                  <div className="flex justify-between">
                    <span className="text-[--color-text-secondary]">Récupération</span>
                    <span className="text-yellow-400">
                      {new Date(runner.recoveryUntil).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                {runner.deathCause && (
                  <div className="p-3 bg-red-500/10 rounded border border-red-500/30">
                    <p className="text-sm text-red-400 font-bold mb-1">Cause de la mort</p>
                    <p className="text-xs text-[--color-text-secondary]">{runner.deathCause}</p>
                    {runner.epitaph && (
                      <p className="text-xs text-[--color-text-secondary] mt-2 italic">&quot;{runner.epitaph}&quot;</p>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-[--color-text-secondary]">Créé le</span>
                  <span className="text-[--color-text-primary]">
                    {new Date(runner.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}