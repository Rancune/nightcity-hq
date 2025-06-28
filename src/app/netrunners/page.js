// src/app/netrunners/page.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import ButtonWithLoading from '@/components/ButtonWithLoading';
import RunnerSelectionModal from '@/components/RunnerSelectionModal';

export default function NetrunnersPage() {
  const [runners, setRunners] = useState([]);
  const [playerInventory, setPlayerInventory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('equipe');
  const [recruitmentPool, setRecruitmentPool] = useState([]);
  const [selectedDeadRunner, setSelectedDeadRunner] = useState(null);
  const [showImplantModal, setShowImplantModal] = useState(false);
  const [selectedRunner, setSelectedRunner] = useState(null);
  const [selectedImplants, setSelectedImplants] = useState([]);
  const [installingImplants, setInstallingImplants] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  const fetchRunners = async () => {
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
        console.log('[NETRUNNERS] Inventaire reçu:', inventory);
        console.log('[NETRUNNERS] Detailed inventory:', inventory.detailedInventory);
        setPlayerInventory(inventory.detailedInventory);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'inventaire:', error);
    }
  };

  const generateRecruitmentPool = () => {
    const names = [
      'Neo', 'Cipher', 'Ghost', 'Shadow', 'Echo', 'Void', 'Pulse', 'Static',
      'Flicker', 'Glitch', 'Phantom', 'Specter', 'Wraith', 'Shade', 'Mirage',
      'Raven', 'Crow', 'Vulture', 'Hawk', 'Falcon', 'Eagle', 'Owl', 'Bat',
      'Spider', 'Scorpion', 'Viper', 'Cobra', 'Python', 'Anaconda', 'Rattlesnake'
    ];
    
    const pool = [];
    for (let i = 0; i < 6; i++) {
      const name = names[Math.floor(Math.random() * names.length)];
      const hacking = Math.floor(Math.random() * 10) + 1;
      const stealth = Math.floor(Math.random() * 10) + 1;
      const combat = Math.floor(Math.random() * 10) + 1;
      const totalPower = hacking + stealth + combat;
      const commission = Math.floor(totalPower * 50) + 200; // Commission dynamique
      
      pool.push({
        id: `recruit-${i}`,
        name,
        skills: { hacking, stealth, combat },
        commission,
        totalPower
      });
    }
    setRecruitmentPool(pool);
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchRunners();
      fetchInventory();
      generateRecruitmentPool();
    }
  }, [isLoaded, isSignedIn]);

  const handleRecruit = async (recruit) => {
    setLoading(true);
    try {
      const response = await fetch('/api/netrunners', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: recruit.name,
          skills: recruit.skills,
          commission: recruit.commission
        })
      });
      
      if (!response.ok) {
        const errorMessage = await response.text();
        alert(errorMessage || "Erreur de recrutement");
      } else {
        fetchRunners();
        generateRecruitmentPool(); // Régénère le pool
        alert(`${recruit.name} a été recruté avec succès !`);
      }
    } catch (error) {
      console.error('Erreur lors du recrutement:', error);
      alert('Erreur lors du recrutement');
    } finally {
      setLoading(false);
    }
  };

  const handleHealRunner = async (runnerId) => {
    const response = await fetch(`/api/netrunners/${runnerId}/heal`, { method: 'POST' });
    if (response.ok) {
      fetchRunners();
    } else {
      const errorMessage = await response.text();
      alert(`Échec de l'opération : ${errorMessage}`);
    }
  };

  const handleOpenImplantModal = (runner) => {
    setSelectedRunner(runner);
    setSelectedImplants([]);
    setShowImplantModal(true);
  };

  const handleCloseImplantModal = () => {
    setShowImplantModal(false);
    setSelectedRunner(null);
    setSelectedImplants([]);
  };

  const handleToggleImplantSelection = (implant) => {
    setSelectedImplants(prev => {
      const isSelected = prev.some(selected => selected.program._id === implant.program._id);
      if (isSelected) {
        return prev.filter(selected => selected.program._id !== implant.program._id);
      } else {
        return [...prev, implant];
      }
    });
  };

  const handleInstallSelectedImplants = async () => {
    if (selectedImplants.length === 0) {
      alert('Aucun implant sélectionné');
      return;
    }

    setInstallingImplants(true);
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const implant of selectedImplants) {
      try {
        const response = await fetch(`/api/netrunners/${selectedRunner._id}/install-implant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ programId: implant.program._id })
        });
        
        if (response.ok) {
          const data = await response.json();
          results.push(`✅ ${implant.program.name} installé (Coût: ${data.installationCost} €$)`);
          successCount++;
        } else {
          const error = await response.text();
          results.push(`❌ ${implant.program.name}: ${error}`);
          errorCount++;
        }
      } catch (error) {
        results.push(`❌ ${implant.program.name}: Erreur de connexion`);
        errorCount++;
      }
    }

    // Afficher les résultats
    const resultMessage = `Installation terminée:\n\n${results.join('\n')}\n\nSuccès: ${successCount} | Erreurs: ${errorCount}`;
    alert(resultMessage);

    // Recharger les données
    await fetchRunners();
    await fetchInventory();
    
    setInstallingImplants(false);
    handleCloseImplantModal();
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

  // Filtrage des runners
  const livingRunners = runners.filter(r => r.status !== 'Mort');
  const deadRunners = runners.filter(r => r.status === 'Mort');

  // Composant pour l'onglet Équipe
  const EquipeTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {livingRunners.map(runner => {
        // Calcul de la commission basée sur la puissance totale
        const totalPower = runner.skills.hacking + runner.skills.stealth + runner.skills.combat;
        const commission = Math.floor(totalPower * 50) + 200;
        
        // Calcul du pourcentage de progression XP
        const xpProgress = Math.min((runner.xp / runner.xpToNextLevel) * 100, 100);
        
        return (
          <div 
            key={runner._id} 
            className="bg-white/5 p-4 rounded-lg border border-[--color-border-dark] hover:border-neon-cyan transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl text-[--color-text-primary] font-bold">{runner.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-[--color-neon-cyan] font-bold">Niveau {runner.level}</span>
                  <span className="text-sm text-[--color-neon-pink] font-bold">Commission Fixer : {runner.fixerCommission?.toFixed(1) ?? '??'}%</span>
                </div>
              </div>
              <p className={`text-sm font-bold ${
                runner.status === 'Disponible' ? 'text-green-400' : 
                runner.status === 'En mission' ? 'text-blue-400' : 'text-red-500'
              }`}>
                {runner.status}
              </p>
            </div>

            {/* XP et barre de progression */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm text-[--color-text-secondary]">XP: {runner.xp} / {runner.xpToNextLevel}</p>
                <p className="text-xs text-[--color-neon-cyan]">{Math.round(xpProgress)}%</p>
              </div>
              <div className="w-full bg-black/50 rounded-full h-3 border border-gray-700 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[--color-neon-cyan] to-[--color-neon-pink] h-3 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${xpProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Compétences */}
            <div className="mb-4 space-y-1">
              <p className="text-sm">Hacking : <span className="text-white">{runner.skills.hacking} / 10</span></p>
              <p className="text-sm">Stealth : <span className="text-white">{runner.skills.stealth} / 10</span></p>
              <p className="text-sm">Combat : <span className="text-white">{runner.skills.combat} / 10</span></p>
              <p className="text-sm text-[--color-neon-cyan] font-bold">Puissance totale: {totalPower}</p>
            </div>

            {/* Implants installés */}
            {runner.installedImplants && runner.installedImplants.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-[--color-neon-cyan] font-bold mb-2">Implants installés:</p>
                <div className="space-y-1">
                  {runner.installedImplants.map((implant, index) => (
                    <div key={index} className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded">
                      <div className="flex items-center gap-1">
                        <span>✓</span>
                        <span className="font-medium">{implant.program?.name || 'Implant inconnu'}</span>
                        {implant.program?.rarity && (
                          <span className={`text-xs ${getRarityColor(implant.program.rarity)}`}>
                            [{implant.program.rarity.toUpperCase()}]
                          </span>
                        )}
                      </div>
                      {implant.program?.description && (
                        <div className="text-gray-300 mt-1 text-xs opacity-75">
                          {implant.program.description}
                        </div>
                      )}
                      {implant.program?.effects?.permanent_skill_boost && (
                        <div className="text-blue-300 mt-1 text-xs">
                          +{implant.program.effects.permanent_skill_boost.value} {implant.program.effects.permanent_skill_boost.skill}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bouton Chrome pour ajouter des implants */}
            <div className="mb-3">
              <button 
                onClick={() => handleOpenImplantModal(runner)}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold py-2 px-4 rounded hover:from-yellow-300 hover:to-yellow-500 transition-all duration-300 text-sm flex items-center justify-center gap-2"
              >
                <span>🔧</span>
                Ajouter un Implant
              </button>
            </div>

            {/* Boutons d'action */}
            <div className="space-y-2">
              <Link href={`/netrunners/${runner._id}`}>
                <button className="w-full bg-[--color-neon-cyan] text-background font-bold py-2 px-4 rounded hover:bg-white hover:text-background transition-colors text-sm">
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
                  Payer Charcudoc (10,000 €$)
                </ButtonWithLoading>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Composant pour l'onglet Recrutement
  const RecrutementTab = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl text-[--color-neon-cyan] font-bold mb-4">🎯 Recrutement</h2>
        <p className="text-lg text-gray-300">
          Des runners talentueux cherchent du travail. Leur commission dépend de leur puissance.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recruitmentPool.map(recruit => (
          <div key={recruit.id} className="bg-white/5 p-4 rounded-lg border border-[--color-border-dark] hover:border-neon-cyan transition-colors">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl text-[--color-text-primary] font-bold">{recruit.name}</h3>
              <div className="text-right">
                <p className="text-lg text-[--color-neon-cyan] font-bold">Commission Fixer : {(() => {
                  const totalPower = recruit.skills.hacking + recruit.skills.stealth + recruit.skills.combat;
                  let fixerCommission = 25 - (totalPower * 0.5);
                  fixerCommission = Math.max(10, Math.min(fixerCommission, 50));
                  return fixerCommission.toFixed(1) + '%';
                })()}</p>
                <p className="text-xs text-gray-400">Commission</p>
              </div>
            </div>
            
            <div className="mb-4 space-y-1">
              <p className="text-sm">Hacking : <span className="text-white">{recruit.skills.hacking} / 10</span></p>
              <p className="text-sm">Stealth : <span className="text-white">{recruit.skills.stealth} / 10</span></p>
              <p className="text-sm">Combat : <span className="text-white">{recruit.skills.combat} / 10</span></p>
              <p className="text-sm text-[--color-neon-cyan]">Puissance totale: {recruit.totalPower}</p>
            </div>
            
            <ButtonWithLoading
              onClick={() => handleRecruit(recruit)}
              isLoading={loading}
              loadingText="RECRUTEMENT..."
              className="w-full bg-[--color-neon-pink] text-white font-bold py-2 px-4 rounded hover:bg-white hover:text-background transition-colors"
            >
              Recruter
            </ButtonWithLoading>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <button 
          onClick={generateRecruitmentPool}
          className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          🔄 Régénérer le pool
        </button>
      </div>
    </div>
  );

  // Composant pour l'onglet Mur des Disparus
  const MurDesDisparusTab = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl text-red-400 font-bold mb-4">🕯️ Mur des Disparus</h2>
        <p className="text-lg text-gray-300 italic">
          "Night City n'oublie jamais ses fantômes. Certains runners deviennent des légendes… d'autres, des lignes de code effacées."
        </p>
      </div>
      
      {deadRunners.length > 0 ? (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {deadRunners.map(runner => (
            <div 
              key={runner._id}
              onClick={() => setSelectedDeadRunner(runner)}
              className="relative group cursor-pointer"
            >
              <div className="w-16 h-16 bg-gray-800 rounded-full border-2 border-red-600 flex items-center justify-center text-white font-bold text-lg hover:border-red-400 transition-colors">
                {runner.name.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-xs">
                💀
              </div>
              
              {/* Tooltip au survol */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <p className="font-bold">{runner.name}</p>
                <p className="text-red-400">{runner.deathCause || 'Mort'}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🕯️</div>
          <p className="text-gray-400 text-lg">Le mur est vide pour l'instant.</p>
          <p className="text-gray-500 text-sm mt-2">Aucun runner n'a encore trouvé la mort.</p>
        </div>
      )}
      
      {/* Modal pour afficher les détails d'un runner mort */}
      {selectedDeadRunner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedDeadRunner(null)}>
          <div className="bg-gray-900 p-6 rounded-lg border border-red-600 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl text-red-300 font-bold">{selectedDeadRunner.name}</h3>
              <button onClick={() => setSelectedDeadRunner(null)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <p><span className="text-red-400">Cause de la mort:</span> {selectedDeadRunner.deathCause || 'Inconnue'}</p>
              <p><span className="text-red-400">Date:</span> {new Date(selectedDeadRunner.deathDate || selectedDeadRunner.updatedAt).toLocaleDateString()}</p>
              {selectedDeadRunner.epitaph && (
                <p className="text-gray-300 italic">"{selectedDeadRunner.epitaph}"</p>
              )}
              
              <div className="border-t border-gray-700 pt-3">
                <p className="text-sm text-gray-400 mb-2">Stats à la mort:</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>Hacking: <span className="text-white">{selectedDeadRunner.skills.hacking}</span></div>
                  <div>Stealth: <span className="text-white">{selectedDeadRunner.skills.stealth}</span></div>
                  <div>Combat: <span className="text-white">{selectedDeadRunner.skills.combat}</span></div>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Niveau: {selectedDeadRunner.level} | XP: {selectedDeadRunner.xp}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <main className="min-h-screen p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Onglets */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTab('equipe')}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                activeTab === 'equipe' 
                  ? 'bg-[--color-neon-cyan] text-background' 
                  : 'bg-white/10 text-[--color-text-primary] hover:bg-white/20'
              }`}
            >
              👥 Équipe ({livingRunners.length})
            </button>
            <button
              onClick={() => setActiveTab('recrutement')}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                activeTab === 'recrutement' 
                  ? 'bg-[--color-neon-pink] text-white' 
                  : 'bg-white/10 text-[--color-text-primary] hover:bg-white/20'
              }`}
            >
              🎯 Recrutement
            </button>
            <button
              onClick={() => setActiveTab('mur')}
              className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                activeTab === 'mur' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white/10 text-[--color-text-primary] hover:bg-white/20'
              }`}
            >
              🕯️ Mur des Disparus
            </button>
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2">
            {activeTab === 'equipe' && <EquipeTab />}
            {activeTab === 'recrutement' && <RecrutementTab />}
            {activeTab === 'mur' && <MurDesDisparusTab />}
          </div>

          {/* Colonne de l'inventaire (visible seulement pour l'équipe) */}
          {activeTab === 'equipe' && (
            <div className="lg:col-span-1">
              <div className="bg-black/30 p-6 rounded-lg border border-[--color-border-dark] sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
                <h2 className="text-2xl text-[--color-neon-cyan] font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎒</span>
                  Inventaire
                </h2>
                
                {playerInventory ? (
                  <div className="space-y-6">
                    {/* Debug info */}
                    <div className="text-xs text-gray-500 mb-4">
                      <p>Debug - Implants: {playerInventory.implants?.length || 0}</p>
                    </div>
                    
                    {/* Implants */}
                    {(playerInventory.implants?.length || 0) > 0 && (
                      <div>
                        <h3 className="text-lg text-[--color-text-primary] font-bold mb-3 flex items-center gap-2">
                          <span>🔧</span>
                          Implants Disponibles
                        </h3>
                        <div className="space-y-2">
                          {playerInventory.implants.map((implant, index) => (
                            <div 
                              key={index} 
                              className="bg-white/5 p-3 rounded border border-[--color-border-dark] hover:bg-white/10 transition-all"
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
                                Coût de pose: 2,000 €$
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inventaire vide */}
                    {(playerInventory.implants?.length || 0) === 0 && (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🎒</div>
                        <p className="text-[--color-text-secondary] text-sm">
                          Aucun implant disponible.
                        </p>
                        <p className="text-[--color-text-secondary] text-xs mt-1">
                          Va au marché noir pour t&apos;équiper.
                        </p>
                        <button 
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/test/add-inventory-items', { method: 'POST' });
                              if (response.ok) {
                                alert('Items de test ajoutés !');
                                fetchInventory();
                              }
                            } catch (error) {
                              console.error('Erreur lors de l\'ajout d\'items de test:', error);
                            }
                          }}
                          className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-colors text-xs"
                        >
                          Ajouter items de test
                        </button>
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
          )}
        </div>
      </div>

      {/* Modal d'installation d'implants */}
      {showImplantModal && selectedRunner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-6 rounded-lg border border-[--color-neon-cyan] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl text-[--color-neon-cyan] font-bold">
                  🔧 Installer des Implants
                </h3>
                <p className="text-[--color-text-secondary] mt-1">
                  Sélectionne les implants à installer sur {selectedRunner.name}
                </p>
              </div>
              <button 
                onClick={handleCloseImplantModal}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Informations du runner */}
            <div className="bg-black/30 p-4 rounded-lg border border-[--color-border-dark] mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-[--color-text-primary] font-bold">{selectedRunner.name}</h4>
                  <p className="text-sm text-[--color-text-secondary]">Niveau {selectedRunner.level}</p>
                </div>
                <div>
                  <p className="text-sm">Hacking: <span className="text-white">{selectedRunner.skills.hacking}/10</span></p>
                  <p className="text-sm">Stealth: <span className="text-white">{selectedRunner.skills.stealth}/10</span></p>
                </div>
                <div>
                  <p className="text-sm">Combat: <span className="text-white">{selectedRunner.skills.combat}/10</span></p>
                  <p className="text-sm text-[--color-neon-cyan]">Puissance: {selectedRunner.skills.hacking + selectedRunner.skills.stealth + selectedRunner.skills.combat}</p>
                </div>
              </div>
            </div>

            {/* Liste des implants disponibles */}
            <div className="mb-6">
              <h4 className="text-lg text-[--color-text-primary] font-bold mb-4">
                Implants Disponibles ({playerInventory?.implants?.length || 0})
              </h4>
              
              {playerInventory?.implants && playerInventory.implants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {playerInventory.implants.map((implant, index) => {
                    const isSelected = selectedImplants.some(selected => selected.program._id === implant.program._id);
                    return (
                      <div 
                        key={index}
                        onClick={() => handleToggleImplantSelection(implant)}
                        className={`bg-white/5 p-4 rounded-lg border cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-[--color-neon-cyan] bg-[--color-neon-cyan]/10' 
                            : 'border-[--color-border-dark] hover:border-[--color-neon-cyan]/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              isSelected 
                                ? 'bg-[--color-neon-cyan] border-[--color-neon-cyan]' 
                                : 'border-gray-400'
                            }`}>
                              {isSelected && <span className="text-black text-xs">✓</span>}
                            </div>
                            <span className="text-[--color-text-primary] font-medium">
                              {implant.program?.name || 'Implant inconnu'}
                            </span>
                          </div>
                          <span className={`text-xs font-bold ${getRarityColor(implant.program?.rarity)}`}>
                            {implant.program?.rarity?.toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-xs text-[--color-text-secondary] mb-2 line-clamp-2">
                          {implant.program?.description}
                        </p>
                        
                        {implant.program?.effects?.permanent_skill_boost && (
                          <div className="text-xs text-blue-300 mb-2">
                            +{implant.program.effects.permanent_skill_boost.value} {implant.program.effects.permanent_skill_boost.skill}
                          </div>
                        )}
                        
                        <div className="text-xs text-[--color-neon-cyan]">
                          Coût de pose: 2,000 €$
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🎒</div>
                  <p className="text-[--color-text-secondary]">
                    Aucun implant disponible.
                  </p>
                  <p className="text-[--color-text-secondary] text-sm mt-1">
                    Va au marché noir pour t'équiper.
                  </p>
                </div>
              )}
            </div>

            {/* Résumé de la sélection */}
            {selectedImplants.length > 0 && (
              <div className="bg-[--color-neon-cyan]/10 border border-[--color-neon-cyan]/30 rounded-lg p-4 mb-6">
                <h4 className="text-[--color-neon-cyan] font-bold mb-2">
                  Implants sélectionnés ({selectedImplants.length})
                </h4>
                <div className="space-y-1">
                  {selectedImplants.map((implant, index) => (
                    <div key={index} className="text-sm text-[--color-text-primary]">
                      • {implant.program?.name} ({implant.program?.rarity?.toUpperCase()})
                    </div>
                  ))}
                </div>
                <div className="text-sm text-[--color-neon-cyan] mt-2">
                  Coût total: {(selectedImplants.length * 2000).toLocaleString()} €$
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleCloseImplantModal}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded transition-colors"
              >
                Annuler
              </button>
              <ButtonWithLoading
                onClick={handleInstallSelectedImplants}
                isLoading={installingImplants}
                loadingText="INSTALLATION..."
                disabled={selectedImplants.length === 0}
                className="px-6 py-2 bg-[--color-neon-cyan] text-background font-bold rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Installer {selectedImplants.length > 0 ? `(${selectedImplants.length})` : ''}
              </ButtonWithLoading>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}