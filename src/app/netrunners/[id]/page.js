// src/app/netrunners/[id]/page.js
import Link from 'next/link';
import connectDb from '@/Lib/database';
import Netrunner from '@/models/Netrunner';
import Contract from '@/models/Contract'; // On en aura besoin pour l'historique

// Fonction serveur pour récupérer les données du runner et de ses missions
async function getRunnerData(id) {
  try {
    await connectDb();
    // On récupère le runner et on peuple les infos de son contrat actuel s'il y en a un
    const runner = await Netrunner.findById(id).lean();
    // On cherche aussi l'historique des contrats terminés ou échoués par ce runner
    const missionHistory = await Contract.find({ assignedRunner: id, status: { $in: ['Terminé', 'Échoué'] } }).lean();

    if (!runner) return null;

    // On doit convertir les données pour les passer au client
    return JSON.parse(JSON.stringify({ runner, missionHistory }));
  } catch (error) {
    console.error("Erreur de récupération du runner:", error);
    return null;
  }
}

export default async function RunnerDetailsPage({ params }) {
  const awaitedParams = await params;
  const data = await getRunnerData(awaitedParams.id);

  if (!data) {
    return <div className="text-center p-8">Runner non trouvé.</div>;
  }

  const { runner, missionHistory } = data;

  return (
    <main className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-4xl text-neon-cyan font-bold">{runner.name}</h1>
        <p className={`text-xl font-bold ${
          runner.status === 'Disponible' ? 'text-neon-lime' : 
          runner.status === 'En mission' ? 'text-cyber-blue' : 'text-red-500'
        }`}>
          Niv. {runner.level} | Statut : {runner.status}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Colonne des stats */}
        <div className="md:col-span-1 bg-white/5 p-6 rounded-lg">
          <h2 className="text-2xl text-text-primary mb-4">Compétences</h2>
          <div className="space-y-3">
            <p>Hacking : <span className="text-2xl font-bold text-white">{runner.skills.hacking}</span></p>
            <p>Stealth : <span className="text-2xl font-bold text-white">{runner.skills.stealth}</span></p>
            <p>Combat : <span className="text-2xl font-bold text-white">{runner.skills.combat}</span></p>
          </div>
          <div className="mt-6">
            <p className="text-sm text-text-secondary">XP</p>
            <div className="w-full bg-black/50 rounded-full h-4 mt-1 border border-gray-700">
              <div 
                className="bg-neon-cyan h-4 rounded-full text-center text-xs text-background font-bold" 
                style={{ width: `${(runner.xp / runner.xpToNextLevel) * 100}%` }}
              >
                {runner.xp}/{runner.xpToNextLevel}
              </div>
            </div>
          </div>
        </div>

        {/* Colonne de l'historique des missions */}
        <div className="md:col-span-2 bg-white/5 p-6 rounded-lg">
          <h2 className="text-2xl text-text-primary mb-4">Historique des Missions</h2>
          <ul className="space-y-2">
            {missionHistory.length > 0 ? missionHistory.map(contract => (
              <li key={contract._id} className={`p-2 rounded ${contract.status === 'Terminé' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <span className={`font-bold ${contract.status === 'Terminé' ? 'text-green-400' : 'text-red-400'}`}>
                  {contract.status.toUpperCase()}
                </span>
                <span className="text-text-primary ml-4">{contract.title}</span>
              </li>
            )) : (
              <p className="text-text-secondary italic">Aucune mission archivée.</p>
            )}
          </ul>
        </div>
      </div>

      <Link href="/netrunners" className="mt-12 inline-block text-[--color-neon-cyan] hover:underline">
        &larr; Retour à l'écurie
      </Link>
    </main>
  );
}