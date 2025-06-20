// src/app/netrunners/page.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';



export default function NetrunnersPage() {
  const [runners, setRunners] = useState([]);
  const { isSignedIn, isLoaded } = useAuth();

  const fetchRunners = async () => {
    // On ajoute l'option { cache: 'no-store' } pour forcer la récupération de données fraîches
    const response = await fetch('/api/netrunners', { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      setRunners(data);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchRunners();
    }
  }, [isLoaded, isSignedIn]);

  // Il faut passer la fonction setPlayerProfile depuis la page d'accueil,
  // ou utiliser un gestionnaire d'état global. Pour l'instant, faisons simple :
  // On va juste rafraîchir toutes les données.

  // Mais pour une meilleure expérience, on devrait idéalement avoir un état global.
  // Pour ce cas, on va supposer que l'utilisateur retournera à la page d'accueil
  // pour voir son solde mis à jour. On se concentre sur la logique backend.

  // La fonction handleRecruit actuelle qui appelle fetchRunners est déjà bonne pour rafraîchir la liste.
  const handleRecruit = async () => {
      const response = await fetch('/api/netrunners', { method: 'POST' });
      if (!response.ok) {
          const errorData = await response.json();
          alert(errorData.message || "Erreur de recrutement"); // Affiche une alerte si pas assez de fonds
      }
      fetchRunners(); // Rafraîchit la liste des runners
  };

  // NOUVELLE FONCTION POUR SOIGNER UN RUNNER
  const handleHealRunner = async (runnerId) => {
    const response = await fetch(`/api/netrunners/${runnerId}/heal`, { method: 'POST' });

    if (response.ok) {
      //alert("Opération réussie ! Votre runner est de nouveau disponible.");
      fetchRunners(); // On rafraîchit la liste pour voir le nouveau statut
    } else {
      const errorData = await response.json();
      alert(`Échec de l'opération : ${errorData.message}`);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-4xl text-[--color-neon-cyan] font-bold">Mon Écurie de Netrunners</h1>
        <Link href="/" className="text-[--color-neon-cyan] hover:underline">&larr; Retour aux contrats</Link>
      </header>

      <div className="mb-8">
        <button onClick={handleRecruit} className="bg-[--color-neon-pink] hover:opacity-80 text-white font-bold py-2 px-4 rounded">
          Recruter un nouveau Runner (500 €$)
        </button>
      </div>
      {/*  SECTION RUNNERS */}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {runners.map(runner => (
           <Link href={`/netrunners/${runner._id}`} key={runner._id}>
            <div className="bg-white/5 p-4 rounded-lg border border-[--color-border-dark] flex flex-col justify-between h-full cursor-pointer hover:border-neon-cyan transition-colors">
            
          <div key={runner._id} className="bg-white/5 p-4 rounded-lg border border-[--color-border-dark]">
            <h2 className="text-2xl text-[--color-text-primary] font-bold">{runner.name}</h2>
            <p className={`mt-2 font-bold ${
                runner.status === 'Disponible' ? 'text-neon-lime' : 
                runner.status === 'En mission' ? 'text-cyber-blue' : 'text-red-500'
              }`}>
                Statut : {runner.status}
              </p>
             {/*  SECTION XP */}
            <div className="mt-4">
              <p className="text-sm text-text-secondary">XP: {runner.xp} / {runner.xpToNextLevel}</p>
              <div className="w-full bg-black/50 rounded-full h-2.5 mt-1 border border-gray-700">
                <div 
                  className="bg-neon-cyan h-2.5 rounded-full" 
                  style={{ width: `${(runner.xp / runner.xpToNextLevel) * 100}%` }}
                ></div>
              </div>
            </div>
            {/*  SECTION COMPÉTENCES */}
            <div className="mt-4 space-y-2">
              <p>Hacking : <span className="text-white">{runner.skills.hacking} / 10</span></p>
              <p>Stealth : <span className="text-white">{runner.skills.stealth} / 10</span></p>
              <p>Combat : <span className="text-white">{runner.skills.combat} / 10</span></p>
            </div>
            {/* --- NOUVELLE PARTIE : LE BOUTON DE SOIN --- */}
            <div className="mt-4 pt-4 border-t border-white/10">
              {runner.status === 'Grillé' && (
                <button 
                  onClick={() => handleHealRunner(runner._id)}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Payer Charcudoc (1,000 €$)
                </button>
              )}
            </div>
          </div>
          </div>
          </Link>
        ))}
      </div>
    </main>
  );
}