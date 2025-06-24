// src/components/ContractDetailsView.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Typewriter from './Typewriter';
import ButtonWithLoading from './ButtonWithLoading';

// Ce composant reçoit le contrat initial en tant que "prop"
export default function ContractDetailsView({ initialContract }) {
  const [contract, setContract] = useState(initialContract);
  const [playerInventory, setPlayerInventory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usedPrograms, setUsedPrograms] = useState([]);
  const [revealedSkills, setRevealedSkills] = useState([]);
  const [skillBonuses, setSkillBonuses] = useState({});
  const router = useRouter();

  // Récupérer l'inventaire du joueur
  useEffect(() => {
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

    fetchInventory();
  }, []);

  const handleUseProgram = async (program, category) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contrats/${contract._id}/use-program`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          programId: program.program._id,
          category: category 
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Mettre à jour l'état local
        setUsedPrograms(prev => [...prev, program.program._id]);
        
        // Appliquer les effets
        if (data.effects) {
          if (data.effects.reveal_skill && data.revealedSkill) {
            setRevealedSkills(prev => [...prev, data.revealedSkill]);
          }
          if (data.effects.add_bonus_roll) {
            setSkillBonuses(prev => ({
              ...prev,
              [data.skill]: (prev[data.skill] || 0) + data.effects.add_bonus_roll
            }));
          }
        }

        // Recharger l'inventaire
        const inventoryResponse = await fetch('/api/player/inventory');
        if (inventoryResponse.ok) {
          const inventory = await inventoryResponse.json();
          setPlayerInventory(inventory);
        }

        alert(`Programme ${program.program.name} utilisé avec succès !`);
      } else {
        const error = await response.text();
        alert(`Erreur: ${error}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'utilisation du programme:', error);
      alert('Erreur lors de l\'utilisation du programme');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    // La logique de résolution reste la même
    const response = await fetch(`/api/contrats/${contract._id}/resolve`, { method: 'POST' });
    if (response.ok) {
      const data = await response.json();
      alert(`Mission terminée ! Résultat : ${data.outcome}`);
      router.push('/'); // Redirige vers la page d'accueil
      router.refresh(); // Force le rafraîchissement des données
    } else {
      alert("Erreur lors de la résolution du contrat.");
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'one_shot': return '💊';
      case 'implant': return '🔧';
      case 'information': return '💾';
      case 'signature': return '⭐';
      default: return '📦';
    }
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

  if (!contract) return <div>Contrat introuvable.</div>;

  return (
    <main className="min-h-screen p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl text-[--color-neon-cyan] font-bold">{contract.title}</h1>
          <p className="text-[--color-text-secondary]">Statut : {contract.status}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale du contrat */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 p-6 rounded-lg mb-6">
              <h2 className="text-2xl text-[--color-text-primary] mb-4">Description du Contrat</h2>
              <Typewriter text={contract.description} speed={10} className="text-neon-vert whitespace-pre-wrap" />
            </div>

            <div className="bg-white/5 p-6 rounded-lg mb-6">
              <h2 className="text-2xl text-[--color-text-primary] mb-4">Récompense</h2>
              <p className="text-2xl text-[--color-neon-pink]">{contract.reward.eddies.toLocaleString()} €$</p>
            </div>

            {/* Compétences révélées */}
            {revealedSkills.length > 0 && (
              <div className="bg-green-900/20 p-6 rounded-lg border border-green-400 mb-6">
                <h3 className="text-lg text-green-400 font-bold mb-3">Compétences Révélées</h3>
                <div className="space-y-2">
                  {revealedSkills.map((skill, index) => (
                    <div key={index} className="text-green-300">
                      • {skill.name}: {skill.value} (Difficulté: {skill.difficulty})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bonus de compétences */}
            {Object.keys(skillBonuses).length > 0 && (
              <div className="bg-blue-900/20 p-6 rounded-lg border border-blue-400 mb-6">
                <h3 className="text-lg text-blue-400 font-bold mb-3">Bonus Actifs</h3>
                <div className="space-y-2">
                  {Object.entries(skillBonuses).map(([skill, bonus]) => (
                    <div key={skill} className="text-blue-300">
                      • {skill}: +{bonus} au jet
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Le bouton interactif vit ici, en sécurité dans un composant client */}
            {contract.status === 'Assigné' && (
              <div className="mt-8">
                <ButtonWithLoading
                  onClick={handleResolve}
                  isLoading={loading}
                  loadingText="RÉSOLUTION..."
                  className="bg-red-600 text-white font-bold p-4 rounded-lg animate-pulse hover:bg-red-500 w-full"
                >
                  TENTER LA RÉSOLUTION DU CONTRAT
                </ButtonWithLoading>
              </div>
            )}

            <Link href="/" className="mt-12 inline-block text-[--color-neon-cyan] hover:underline">
              &larr; Retour à la liste des contrats
            </Link>
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
                  {/* Programmes One-Shot */}
                  {(playerInventory.oneShotPrograms?.length || 0) > 0 && (
                    <div>
                      <h3 className="text-lg text-[--color-text-primary] font-bold mb-3 flex items-center gap-2">
                        <span>💊</span>
                        Programmes One-Shot
                      </h3>
                      <div className="space-y-2">
                        {playerInventory.oneShotPrograms.map((item, index) => (
                          <div key={index} className="bg-white/5 p-3 rounded border border-[--color-border-dark] hover:bg-white/10 transition-all">
                            <div className="mb-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[--color-text-primary] text-sm font-medium">
                                  {item.program?.name || 'Programme inconnu'}
                                </span>
                                <span className="text-[--color-neon-cyan] font-bold text-lg">x{item.quantity}</span>
                              </div>
                              <div className={`text-xs ${getRarityColor(item.program?.rarity)}`}>
                                {item.program?.rarity?.toUpperCase()}
                              </div>
                            </div>
                            <p className="text-xs text-[--color-text-secondary] mb-3 line-clamp-2">
                              {item.program?.description}
                            </p>
                            <ButtonWithLoading
                              onClick={() => handleUseProgram(item, 'one_shot')}
                              isLoading={loading}
                              loadingText="UTILISATION..."
                              disabled={usedPrograms.includes(item.program._id)}
                              className={`w-full text-xs font-bold py-2 px-3 rounded transition-all ${
                                usedPrograms.includes(item.program._id)
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  : 'bg-[--color-neon-cyan] text-background hover:bg-white'
                              }`}
                            >
                              {usedPrograms.includes(item.program._id) ? 'Utilisé' : 'Utiliser'}
                            </ButtonWithLoading>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Informations */}
                  {(playerInventory.information?.length || 0) > 0 && (
                    <div>
                      <h3 className="text-lg text-[--color-text-primary] font-bold mb-3 flex items-center gap-2">
                        <span>💾</span>
                        Informations
                      </h3>
                      <div className="space-y-2">
                        {playerInventory.information.map((info, index) => (
                          <div key={index} className="bg-white/5 p-3 rounded border border-[--color-border-dark] hover:bg-white/10 transition-all">
                            <div className="mb-2">
                              <span className="text-[--color-text-primary] text-sm font-medium">
                                {info.program?.name || 'Information inconnue'}
                              </span>
                            </div>
                            <p className="text-xs text-[--color-text-secondary] mb-3 line-clamp-2">
                              {info.program?.description}
                            </p>
                            <ButtonWithLoading
                              onClick={() => handleUseProgram(info, 'information')}
                              isLoading={loading}
                              loadingText="UTILISATION..."
                              disabled={usedPrograms.includes(info.program._id)}
                              className={`w-full text-xs font-bold py-2 px-3 rounded transition-all ${
                                usedPrograms.includes(info.program._id)
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-600 text-white hover:bg-blue-500'
                              }`}
                            >
                              {usedPrograms.includes(info.program._id) ? 'Utilisé' : 'Révéler'}
                            </ButtonWithLoading>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inventaire vide */}
                  {((playerInventory.oneShotPrograms?.length || 0) === 0 && 
                    (playerInventory.information?.length || 0) === 0) && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">🎒</div>
                      <p className="text-[--color-text-secondary] text-sm">
                        Aucun programme utilisable.
                      </p>
                      <p className="text-[--color-text-secondary] text-xs mt-1">
                        Va au marché noir pour t'équiper.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-[--color-neon-cyan] border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-[--color-text-secondary] text-sm">
                    Chargement de l'inventaire...
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