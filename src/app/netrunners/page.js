// src/app/netrunners/page.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import ButtonWithLoading from '@/components/ButtonWithLoading';

export default function NetrunnersPage() {
  const [runners, setRunners] = useState([]);
  const [playerInventory, setPlayerInventory] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  const fetchRunners = async () => {
    // On ajoute l'option { cache: 'no-store' } pour forcer la récupération de données fraîches
    const response = await fetch('/api/netrunners', { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      setRunners(data);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/player/inventory');
      if (response.ok) {
        const inventory = await response.json();
        setPlayerInventory(inventory);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'inventaire:', error);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchRunners();
      fetchInventory();
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
          const errorMessage = await response.text();
          alert(errorMessage || "Erreur de recrutement"); // Affiche une alerte si pas assez de fonds
      } else {
          fetchRunners(); // Rafraîchit la liste des runners seulement en cas de succès
      }
  };

  // NOUVELLE FONCTION POUR SOIGNER UN RUNNER
  const handleHealRunner = async (runnerId) => {
    const response = await fetch(`/api/netrunners/${runnerId}/heal`, { method: 'POST' });

    if (response.ok) {
      //alert("Opération réussie ! Votre runner est de nouveau disponible.");
      fetchRunners(); // On rafraîchit la liste pour voir le nouveau statut
    } else {
      const errorMessage = await response.text();
      alert(`Échec de l'opération : ${errorMessage}`);
    }
  };

  // Gestion du drag & drop
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, runnerId) => {
    e.preventDefault();
    try {
      const droppedData = e.dataTransfer.getData('text/plain');
      const item = JSON.parse(droppedData);
      setLoading(true);
      if (item && item.category === 'implant') {
        const response = await fetch(`/api/netrunners/${runnerId}/install-implant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ programId: item.program._id })
        });
        if (response.ok) {
          const data = await response.json();
          alert(`Implant ${item.program.name} installé sur ${data.runnerName} !`);
          fetchRunners();
          fetchInventory();
        } else {
          const error = await response.text();
          alert(`Erreur: ${error}`);
        }
      } else if (item && item.category === 'one_shot') {
        const response = await fetch(`/api/netrunners/${runnerId}/use-program`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ programId: item.program._id })
        });
        if (response.ok) {
          const data = await response.json();
          alert(`Programme one-shot ${item.program.name} utilisé sur ${data.runnerName} !`);
          fetchRunners();
          fetchInventory();
        } else {
          const error = await response.text();
          alert(`Erreur: ${error}`);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'application:', error);
      alert('Erreur lors de l\'application du programme');
    } finally {
      setLoading(false);
      setDraggedItem(null);
    }
  };

  const handleDragEnd = (e) => {
    setDraggedItem(null);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'legendary': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <main className="min-h-screen p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button onClick={handleRecruit} className="bg-[--color-neon-pink] text-white font-bold py-2 px-4 rounded transition-all duration-200 hover:bg-neon-cyan hover:text-background hover:shadow-[0_0_15px_var(--color-neon-pink)] glitch-on-hover">
            Recruter un nouveau Runner (500 €$)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne des runners */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl text-[--color-neon-cyan] font-bold mb-6 flex items-center gap-2">
              <span>👥</span>
              Tes Runners
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {runners.map(runner => (
                <div 
                  key={runner._id} 
                  className="bg-white/5 p-4 rounded-lg border border-[--color-border-dark] hover:border-neon-cyan transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, runner._id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl text-[--color-text-primary] font-bold">{runner.name}</h3>
                    <p className={`text-sm font-bold ${
                      runner.status === 'Disponible' ? 'text-green-400' : 
                      runner.status === 'En mission' ? 'text-blue-400' : 'text-red-500'
                    }`}>
                      {runner.status}
                    </p>
                  </div>

                  {/* XP */}
                  <div className="mb-4">
                    <p className="text-sm text-[--color-text-secondary]">XP: {runner.xp} / {runner.xpToNextLevel}</p>
                    <div className="w-full bg-black/50 rounded-full h-2.5 mt-1 border border-gray-700">
                      <div 
                        className="bg-neon-cyan h-2.5 rounded-full" 
                        style={{ width: `${(runner.xp / runner.xpToNextLevel) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Compétences */}
                  <div className="mb-4 space-y-1">
                    <p className="text-sm">Hacking : <span className="text-white">{runner.skills.hacking} / 10</span></p>
                    <p className="text-sm">Stealth : <span className="text-white">{runner.skills.stealth} / 10</span></p>
                    <p className="text-sm">Combat : <span className="text-white">{runner.skills.combat} / 10</span></p>
                  </div>

                  {/* Implants installés */}
                  {runner.installedImplants && runner.installedImplants.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-[--color-neon-cyan] font-bold mb-2">Implants installés:</p>
                      <div className="space-y-1">
                        {runner.installedImplants.map((implant, index) => (
                          <div key={index} className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded">
                            ✓ {implant.program?.name || 'Implant inconnu'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Zone de drop */}
                  <div className="border-2 border-dashed border-[--color-border-dark] rounded p-2 text-center text-xs text-[--color-text-secondary] mb-3 min-h-[40px] flex items-center justify-center">
                    {draggedItem ? 'Dépose l\'implant ici' : 'Glisse un implant ici'}
                  </div>

                  {/* Boutons d'action */}
                  <div className="space-y-2">
                    <Link href={`/netrunners/${runner._id}`}>
                      <button className="w-full bg-[--color-neon-cyan] text-background font-bold py-2 px-4 rounded hover:bg-white transition-colors text-sm">
                        Voir détails
                      </button>
                    </Link>
                    
                    {runner.status === 'Grillé' && (
                      <ButtonWithLoading
                        onClick={() => handleHealRunner(runner._id)}
                        isLoading={loading}
                        loadingText="SOIN..."
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition-colors text-sm"
                      >
                        Payer Charcudoc (1,000 €$)
                      </ButtonWithLoading>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne de l'inventaire */}
          <div className="lg:col-span-1">
            <div className="bg-black/30 p-6 rounded-lg border border-[--color-border-dark] sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <h2 className="text-2xl text-[--color-neon-cyan] font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🎒</span>
                Inventaire
              </h2>
              
              {playerInventory ? (
                <div className="space-y-6">
                  {/* Implants */}
                  {(playerInventory.installedImplants?.length || 0) > 0 && (
                    <div>
                      <h3 className="text-lg text-[--color-text-primary] font-bold mb-3 flex items-center gap-2">
                        <span>🔧</span>
                        Implants Disponibles
                      </h3>
                      <div className="space-y-2">
                        {playerInventory.installedImplants.map((implant, index) => (
                          <div 
                            key={index} 
                            className="bg-white/5 p-3 rounded border border-[--color-border-dark] hover:bg-white/10 transition-all cursor-move"
                            draggable
                            onDragStart={(e) => handleDragStart(e, { ...implant, category: 'implant' })}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="mb-2">
                              <span className="text-[--color-text-primary] text-sm font-medium">
                                {implant.program?.name || 'Implant inconnu'}
                              </span>
                            </div>
                            <div className={`text-xs ${getRarityColor(implant.program?.rarity)}`}>
                              {implant.program?.rarity?.toUpperCase()}
                            </div>
                            <p className="text-xs text-[--color-text-secondary] mt-2 line-clamp-2">
                              {implant.program?.description}
                            </p>
                            <div className="text-xs text-[--color-neon-cyan] mt-2">
                              Glisse sur un runner pour installer
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Programmes One-Shot */}
                  {(playerInventory.oneShotPrograms?.length || 0) > 0 && (
                    <div>
                      <h3 className="text-lg text-[--color-text-primary] font-bold mb-3 flex items-center gap-2">
                        <span>💊</span>
                        Programmes One-Shot
                      </h3>
                      <div className="space-y-2">
                        {playerInventory.oneShotPrograms.map((item, index) => (
                          <div key={index} className="bg-white/5 p-3 rounded border border-[--color-border-dark] hover:bg-white/10 transition-all cursor-move"
                            draggable
                            onDragStart={(e) => handleDragStart(e, { ...item, category: 'one_shot' })}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[--color-text-primary] text-sm font-medium">
                                {item.program?.name || 'Programme inconnu'}
                              </span>
                              <span className="text-[--color-neon-cyan] font-bold text-lg">x{item.quantity}</span>
                            </div>
                            <div className={`text-xs ${getRarityColor(item.program?.rarity)}`}>{item.program?.rarity?.toUpperCase()}</div>
                            <p className="text-xs text-[--color-text-secondary] mt-2 line-clamp-2">{item.program?.description}</p>
                            <div className="text-xs text-[--color-neon-cyan] mt-2">Glisse sur un runner pour utiliser</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inventaire vide */}
                  {((playerInventory.installedImplants?.length || 0) === 0 && 
                    (playerInventory.oneShotPrograms?.length || 0) === 0) && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">🎒</div>
                      <p className="text-[--color-text-secondary] text-sm">
                        Aucun implant disponible.
                      </p>
                      <p className="text-[--color-text-secondary] text-xs mt-1">
                        Va au marché noir pour t&apos;équiper.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-[--color-neon-cyan] border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-[--color-text-secondary] text-sm">
                    Chargement de l&apos;inventaire...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}