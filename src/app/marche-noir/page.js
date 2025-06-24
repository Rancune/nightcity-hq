'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Typewriter from '@/components/Typewriter';
import ButtonWithLoading from '@/components/ButtonWithLoading';

export default function MarcheNoirPage() {
  const [programs, setPrograms] = useState([]);
  const [playerInventory, setPlayerInventory] = useState(null);
  const [vendorMessage, setVendorMessage] = useState('');
  const [playerReputation, setPlayerReputation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState({});
  const [debugInfo, setDebugInfo] = useState(null);
  const { isSignedIn, isLoaded } = useAuth();

  const fetchMarketData = async () => {
    try {
      const [marketResponse, inventoryResponse] = await Promise.all([
        fetch('/api/market'),
        fetch('/api/player/inventory')
      ]);
      
      if (marketResponse.ok && inventoryResponse.ok) {
        const marketData = await marketResponse.json();
        const inventoryData = await inventoryResponse.json();
        
        setPrograms(marketData.programs);
        setPlayerInventory(inventoryData);
        setVendorMessage(marketData.vendorMessage);
        setPlayerReputation(marketData.playerReputation);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du marché:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceGenerateStock = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/market/debug');
      if (response.ok) {
        const data = await response.json();
        setDebugInfo(data);
        // Recharger les données du marché
        await fetchMarketData();
        alert(`Stock généré ! ${data.newPrograms?.length || 0} nouveaux programmes disponibles.`);
      }
    } catch (error) {
      console.error('Erreur lors de la génération du stock:', error);
      alert('Erreur lors de la génération du stock');
    } finally {
      setLoading(false);
    }
  };

  const initMarket = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/init-market');
      if (response.ok) {
        const data = await response.json();
        // Recharger les données du marché
        await fetchMarketData();
        alert(`Marché initialisé ! ${data.programsCreated} programmes créés.`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      alert('Erreur lors de l\'initialisation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchMarketData();
    }
  }, [isLoaded, isSignedIn]);

  const handlePurchase = async (programId) => {
    setPurchasing(prev => ({ ...prev, [programId]: true }));
    try {
      const response = await fetch('/api/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Recharger les données
        await fetchMarketData();
        // Notification de succès
        alert(`Achat réussi ! ${data.program.name} ajouté à ton inventaire.`);
      } else {
        const error = await response.text();
        alert(`Erreur: ${error}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'achat:', error);
      alert('Erreur lors de l\'achat');
    } finally {
      setPurchasing(prev => ({ ...prev, [programId]: false }));
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

  const getRarityBorder = (rarity) => {
    switch (rarity) {
      case 'common': return 'border-gray-400';
      case 'uncommon': return 'border-green-400';
      case 'rare': return 'border-blue-400';
      case 'legendary': return 'border-purple-400';
      default: return 'border-gray-400';
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

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[--color-neon-cyan] border-t-transparent rounded-full mx-auto"></div>
          <p className="text-[--color-text-secondary] mt-4">Connexion à l&apos;Intermédiaire...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* En-tête avec l'Intermédiaire */}
        <div className="mb-8">
          <div className="bg-black/50 p-6 rounded-lg border-2 border-[--color-neon-cyan]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[--color-neon-cyan] rounded-full flex items-center justify-center text-2xl">
                👤
              </div>
              <div>
                <h1 className="text-3xl text-[--color-neon-cyan] font-bold">L&apos;Intermédiaire</h1>
                <p className="text-[--color-text-secondary]">Contact mystérieux du marché noir</p>
              </div>
            </div>
            
            <div className="bg-black/30 p-4 rounded border border-[--color-neon-cyan]/30">
              <p className="text-[--color-text-primary] italic">
                <Typewriter text={vendorMessage} speed={40} />
              </p>
            </div>
            
            <div className="mt-4 flex gap-4 text-sm">
              <span className="text-[--color-neon-pink]">
                Réputation requise: {playerReputation} PR
              </span>
              <span className="text-[--color-text-secondary]">
                Stock disponible: {programs.length} items
              </span>
              <button
                onClick={initMarket}
                className="bg-green-600 text-white font-bold py-2 px-3 rounded text-xs hover:bg-green-500 transition-all"
              >
                Init Marché
              </button>
              <button
                onClick={forceGenerateStock}
                className="bg-[--color-neon-pink] text-white font-bold py-2 px-3 rounded text-xs hover:bg-white hover:text-background transition-all"
              >
                Debug: Générer Stock
              </button>
            </div>
          </div>
        </div>

        {/* Layout principal avec deux colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne du marché (2/3 de l'espace) */}
          <div className="lg:col-span-2">
            <div className="bg-black/30 p-6 rounded-lg border border-[--color-border-dark] mb-6">
              <h2 className="text-2xl text-[--color-neon-cyan] font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🛒</span>
                Marché Noir
              </h2>
              
              {/* Grille des programmes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programs.map((program) => (
                  <div 
                    key={program._id} 
                    className={`bg-white/5 p-4 rounded-lg border-2 ${getRarityBorder(program.rarity)} hover:border-[--color-neon-cyan] transition-all hover:bg-white/10`}
                  >
                    {/* En-tête du programme */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getCategoryIcon(program.category)}</span>
                        <div>
                          <h3 className="text-base text-[--color-text-primary] font-bold">{program.name}</h3>
                          <span className={`text-xs font-bold ${getRarityColor(program.rarity)}`}>
                            {program.rarity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      {program.isSignature && (
                        <span className="text-yellow-400 text-xs font-bold bg-yellow-400/20 px-2 py-1 rounded">
                          SIGNATURE
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-[--color-text-secondary] text-xs mb-3 line-clamp-2">
                      {program.description}
                    </p>

                    {/* Effets */}
                    <div className="mb-3">
                      <h4 className="text-xs text-[--color-neon-cyan] font-bold mb-1">Effets:</h4>
                      <div className="space-y-1 text-xs text-[--color-text-secondary]">
                        {program.effects.skip_skill_check && (
                          <div>• Garantit le succès d&apos;un test</div>
                        )}
                        {program.effects.add_bonus_roll > 0 && (
                          <div>• +{program.effects.add_bonus_roll} bonus au jet</div>
                        )}
                        {program.effects.reveal_skill && (
                          <div>• Révèle une compétence requise</div>
                        )}
                        {program.effects.reduce_difficulty > 0 && (
                          <div>• Réduit la difficulté de -{program.effects.reduce_difficulty}</div>
                        )}
                        {program.effects.permanent_skill_boost && (
                          <div>• +{program.effects.permanent_skill_boost.value} {program.effects.permanent_skill_boost.skill}</div>
                        )}
                        {program.effects.unlocks_contract && (
                          <div>• Débloque un contrat exclusif</div>
                        )}
                      </div>
                    </div>

                    {/* Prix et stock */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[--color-neon-pink] font-bold text-sm">
                        {program.price.toLocaleString()} €$
                      </div>
                      <div className="text-[--color-text-secondary] text-xs">
                        Stock: {program.stock}/{program.maxStock}
                      </div>
                    </div>

                    {/* Réputation requise */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[--color-text-secondary]">Réputation:</span>
                        <span className={`font-bold ${playerReputation >= program.reputationRequired ? 'text-green-400' : 'text-red-400'}`}>
                          {program.reputationRequired} PR
                        </span>
                      </div>
                    </div>

                    {/* Bouton d'achat */}
                    <ButtonWithLoading
                      onClick={() => handlePurchase(program._id)}
                      isLoading={purchasing[program._id] || false}
                      loadingText="ACHAT..."
                      disabled={playerReputation < program.reputationRequired || program.stock === 0}
                      className={`w-full font-bold py-2 px-3 rounded text-sm transition-all ${
                        playerReputation >= program.reputationRequired && program.stock > 0
                          ? 'bg-[--color-neon-cyan] text-background hover:bg-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {playerReputation < program.reputationRequired 
                        ? 'Réputation insuffisante' 
                        : program.stock === 0 
                          ? 'Stock épuisé' 
                          : 'Acheter'
                      }
                    </ButtonWithLoading>
                  </div>
                ))}
              </div>

              {/* Message si aucun programme */}
              {programs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-[--color-text-secondary] text-lg mb-4">
                    Aucun programme disponible pour le moment.
                  </p>
                  <p className="text-sm text-[--color-text-secondary]">
                    L&apos;Intermédiaire fait ses courses. Reviens plus tard.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Colonne de l'inventaire (1/3 de l'espace) */}
          <div className="lg:col-span-1">
            <div className="bg-black/30 p-6 rounded-lg border border-[--color-border-dark] sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <h2 className="text-2xl text-[--color-neon-cyan] font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🎒</span>
                Ton Inventaire
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Implants Installés */}
                  {(playerInventory.installedImplants?.length || 0) > 0 && (
                    <div>
                      <h3 className="text-lg text-[--color-text-primary] font-bold mb-3 flex items-center gap-2">
                        <span>🔧</span>
                        Implants Installés
                      </h3>
                      <div className="space-y-2">
                        {playerInventory.installedImplants.map((implant, index) => (
                          <div key={index} className="bg-white/5 p-3 rounded border border-[--color-border-dark] hover:bg-white/10 transition-all">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-[--color-text-primary] text-sm font-medium">Implant #{index + 1}</span>
                                <div className="text-xs text-[--color-text-secondary] mt-1">
                                  {implant.program?.name || 'Implant inconnu'}
                                </div>
                              </div>
                              <span className="text-green-400 text-sm">✓ Installé</span>
                            </div>
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
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-[--color-text-primary] text-sm font-medium">Info #{index + 1}</span>
                                <div className="text-xs text-[--color-text-secondary] mt-1">
                                  {info.program?.name || 'Information inconnue'}
                                </div>
                              </div>
                              <span className="text-blue-400 text-sm">📄</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inventaire vide */}
                  {((playerInventory.oneShotPrograms?.length || 0) === 0 && 
                    (playerInventory.installedImplants?.length || 0) === 0 && 
                    (playerInventory.information?.length || 0) === 0) && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">🎒</div>
                      <p className="text-[--color-text-secondary] text-sm">
                        Ton inventaire est vide.
                      </p>
                      <p className="text-[--color-text-secondary] text-xs mt-1">
                        Achète des programmes pour commencer.
                      </p>
                    </div>
                  )}

                  {/* Statistiques */}
                  <div className="bg-black/20 p-4 rounded border border-[--color-border-dark]">
                    <h4 className="text-sm text-[--color-neon-cyan] font-bold mb-3">Statistiques</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[--color-text-secondary]">Total dépensé:</span>
                        <span className="text-[--color-neon-pink] font-bold">
                          {playerInventory.totalSpent?.toLocaleString() || 0} €$
                        </span>
                      </div>
                      {(playerInventory.signatureItemsPurchased || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-[--color-text-secondary]">Items signature:</span>
                          <span className="text-yellow-400 font-bold">
                            {playerInventory.signatureItemsPurchased}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-[--color-text-secondary]">Total items:</span>
                        <span className="text-[--color-neon-cyan] font-bold">
                          {(playerInventory.oneShotPrograms?.length || 0) + 
                           (playerInventory.installedImplants?.length || 0) + 
                           (playerInventory.information?.length || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
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