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
  const [showDeadRunnerModal, setShowDeadRunnerModal] = useState(false);
  const isDevelopment = process.env.NODE_ENV === 'development';
  const [isGeneratingPool, setIsGeneratingPool] = useState(false);

  // Ajout du cooldown pour le bouton 'Activer un contact'
  const COOLDOWN_HOURS = 3;
  const COOLDOWN_KEY = 'recruitment_cooldown_until';
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  // Initialisation du cooldown depuis le localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(COOLDOWN_KEY);
      if (stored) {
        setCooldownUntil(new Date(stored));
      }
    }
  }, []);

  // Timer pour mettre à jour le temps restant
  useEffect(() => {
    if (!cooldownUntil) return;
    const interval = setInterval(() => {
      const now = new Date();
      const left = new Date(cooldownUntil) - now;
      setCooldownLeft(left > 0 ? left : 0);
      if (left <= 0) {
        setCooldownUntil(null);
        localStorage.removeItem(COOLDOWN_KEY);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const handleGenerateRecruitmentWithCooldown = async () => {
    setIsGeneratingPool(true);
    await generateRecruitmentPool();
    const next = new Date(Date.now() + COOLDOWN_HOURS * 60 * 60 * 1000);
    setCooldownUntil(next);
    localStorage.setItem(COOLDOWN_KEY, next.toISOString());
    setIsGeneratingPool(false);
  };

  const handleDevGenerateRecruitment = async () => {
    setIsGeneratingPool(true);
    await generateRecruitmentPool();
    setIsGeneratingPool(false);
  };

  // Styles CSS pour le fond hachuré rouge (statique, sans animation)
  const grilledRunnerStyles = `
    .grilled-runner-card {
      position: relative;
      overflow: hidden;
    }
    
    .grilled-runner-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        rgba(239, 68, 68, 0.1) 10px,
        rgba(239, 68, 68, 0.1) 20px
      );
      pointer-events: none;
      z-index: 1;
    }
    
    .grilled-runner-card > * {
      position: relative;
      z-index: 2;
    }
  `;

  // Ajout d'une animation CSS pour le halo bleu
  const onMissionStyles = `
    .on-mission-anim {
      position: relative;
      display: inline-block;
    }
    .on-mission-anim::before {
      content: '';
      position: absolute;
      left: 50%;
      top: 50%;
      width: 2.5em;
      height: 2.5em;
      background: rgba(59,130,246,0.25); /* blue-500 */
      border-radius: 9999px;
      transform: translate(-50%, -50%);
      animation: pulse-blue 1.5s infinite;
      z-index: 0;
    }
    @keyframes pulse-blue {
      0% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
      70% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
    }
  `;

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

  const generateRecruitmentPool = async () => {
    try {
      const response = await fetch('/api/netrunners/recruitment-pool');
      if (response.ok) {
        const pool = await response.json();
        setRecruitmentPool(pool);
      } else {
        console.error('Erreur lors de la génération du pool de recrutement');
        // Fallback avec des noms prédéfinis
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
          const commission = Math.floor(totalPower * 50) + 200;
      
      pool.push({
        id: `recruit-${i}`,
        name,
            lore: null,
            skills: { hacking, stealth, combat },
            commission,
            totalPower
          });
        }
        setRecruitmentPool(pool);
      }
    } catch (error) {
      console.error('Erreur lors de la génération du pool de recrutement:', error);
      // Même fallback que ci-dessus
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
        const commission = Math.floor(totalPower * 50) + 200;
        
        pool.push({
          id: `recruit-${i}`,
          name,
          lore: null,
        skills: { hacking, stealth, combat },
        commission,
        totalPower
      });
    }
    setRecruitmentPool(pool);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchRunners();
      fetchInventory();
    }
  }, [isLoaded, isSignedIn]);

  // Timer pour mettre à jour les temps de récupération en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      // Force le re-render pour mettre à jour les timers
      setRunners(prev => [...prev]);
    }, 60000); // Mise à jour toutes les minutes

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'recrutement') {
      generateRecruitmentPool();
    }
  }, [activeTab]);

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
        // alert(errorMessage || "Erreur de recrutement");
      } else {
        fetchRunners();
        // On retire le runner recruté de la liste sans régénérer tout le pool
        setRecruitmentPool(prev => prev.filter(r => r !== recruit));
        // alert(`${recruit.name} a été recruté avec succès !`);
      }
    } catch (error) {
      console.error('Erreur lors du recrutement:', error);
      // alert('Erreur lors du recrutement');
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
      // alert(`Échec de l'opération : ${errorMessage}`);
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
      // alert('Aucun implant sélectionné');
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
    // alert(resultMessage);

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
  const EquipeTab = () => {
    // Fonction pour calculer le temps restant de récupération
    const getRecoveryTimeLeft = (recoveryUntil) => {
      if (!recoveryUntil) return null;
      const now = new Date();
      const recoveryDate = new Date(recoveryUntil);
      const timeLeft = recoveryDate - now;
      
      if (timeLeft <= 0) return "Prêt !";
      
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours}h ${minutes}m`;
    };

    return (
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Mon Équipe</h2>
          <span className="text-sm text-[--color-text-secondary]">
            {livingRunners.length} runner{livingRunners.length > 1 ? 's' : ''} actif{livingRunners.length > 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="card-content">
          {livingRunners.length > 0 ? (
            livingRunners.map((runner) => {
              const isGrilled = runner.status === 'Grillé';
              const isOnMission = runner.status === 'En mission';
              const recoveryTimeLeft = isGrilled ? getRecoveryTimeLeft(runner.recoveryUntil) : null;
              // Nouveau : passage auto en dispo si timer fini
              let displayStatus = runner.status;
              if (isGrilled && recoveryTimeLeft === 'Prêt !') {
                displayStatus = 'Disponible';
              }
              const isVisuallyGrilled = isGrilled && recoveryTimeLeft !== null && recoveryTimeLeft !== 'Prêt !';
              let cardClass = '';
              if (isVisuallyGrilled) {
                cardClass = 'bg-red-900/20 border-red-500/50 hover:border-red-500/70 grilled-runner-card';
              } else if (isOnMission) {
                cardClass = 'bg-blue-900/30 border-blue-400/60 opacity-70';
              } else {
                cardClass = 'bg-black/30 border-[--color-border-dark] hover:border-[--color-neon-cyan]/30';
              }
              return (
                <div 
                  key={runner._id} 
                  className={`p-4 rounded border transition-all ${cardClass}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {/* Pictogramme et animation si en mission */}
                        {isOnMission && (
                          <span className="on-mission-anim text-blue-400 text-xl relative z-10">🚀</span>
                        )}
                        <h3 className="text-lg text-[--color-text-primary] font-bold">{runner.name}</h3>
                      </div>
                      <p className="text-sm text-[--color-text-secondary]">
                        Niveau {runner.level} • {displayStatus}
                      </p>
                      {/* Affiche le timer ou la récupération uniquement si pas prêt */}
                      {isGrilled && recoveryTimeLeft && recoveryTimeLeft !== 'Prêt !' && (
                        <p className={`text-sm font-bold mt-1 text-red-400`}>
                          ⏰ Récupération dans {recoveryTimeLeft}
                        </p>
                      )}
                      <p className="text-xs text-[--color-neon-pink] mt-1">
                        Commission Fixer : {runner.fixerCommission?.toFixed(1) || '??'}%
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-[--color-neon-cyan] font-bold">
                        Puissance: {runner.skills.hacking + runner.skills.stealth + runner.skills.combat}
                      </div>
                      <div className="flex gap-2 text-xs mt-1">
                        <span className="text-blue-400">H:{runner.skills.hacking}</span>
                        <span className="text-green-400">S:{runner.skills.stealth}</span>
                        <span className="text-red-400">C:{runner.skills.combat}</span>
                      </div>
                    </div>
                  </div>

                  {/* Lore du runner */}
                  {runner.lore && (
                    <p className="text-sm text-[--color-text-secondary] mb-3 line-clamp-2">
                      {runner.lore}
                    </p>
                  )}

                  {/* Implants installés */}
                  {runner.implants && runner.implants.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-[--color-text-secondary] mb-1">Implants:</p>
                      <div className="flex flex-wrap gap-1">
                        {runner.implants.map((implant, index) => (
                          <span key={index} className="text-xs bg-[--color-neon-cyan]/20 text-[--color-neon-cyan] px-2 py-1 rounded">
                            {implant.program?.name || 'Implant'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Statistiques */}
                  <div className="mb-3 text-xs text-[--color-text-secondary]">
                    <span>Missions: {runner.missionsCompleted || 0} réussies, {runner.missionsFailed || 0} échouées</span>
                  </div>

                  {/* Barre d'expérience */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-[--color-text-secondary] mb-1">
                      <span>XP: {runner.xp || 0} / {runner.xpToNextLevel || 100}</span>
                      <span>Niveau {runner.level}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[--color-neon-cyan] to-[--color-neon-pink] h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, ((runner.xp || 0) / (runner.xpToNextLevel || 100)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/netrunners/${runner._id}`}>
                      <button className="btn-secondary flex-1 text-sm">
                        Détails
                      </button>
                    </Link>
                    
                    {runner.status === 'Blessé' && (
                      <ButtonWithLoading
                        onClick={() => handleHealRunner(runner._id)}
                        isLoading={loading}
                        loadingText="SOINS..."
                        className="btn-primary flex-1 text-sm"
                      >
                        Soigner
                      </ButtonWithLoading>
                    )}
                    
                    <button
                      onClick={() => handleOpenImplantModal(runner)}
                      className="btn-ghost text-sm"
                    >
                      🔧
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <p className="empty-state-text">Aucun netrunner dans ton équipe</p>
              <p className="empty-state-subtext">
                Va dans l&apos;onglet Recrutement pour engager des runners
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Composant pour l'onglet Recrutement
  const RecrutementTab = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Recrutement</h2>
        <div className="flex gap-2 items-center">
          <ButtonWithLoading
            onClick={handleGenerateRecruitmentWithCooldown}
            isLoading={isGeneratingPool}
            disabled={!!cooldownUntil && cooldownLeft > 0}
            className="btn-secondary text-sm"
          >
            {cooldownUntil && cooldownLeft > 0
              ? `Contact dispo dans ${Math.floor(cooldownLeft / 1000 / 60 / 60)}h ${Math.floor((cooldownLeft / 1000 / 60) % 60)}m`
              : 'Activer un contact'}
          </ButtonWithLoading>
          {isDevelopment && (
            <ButtonWithLoading
              onClick={handleDevGenerateRecruitment}
              isLoading={isGeneratingPool}
              className="btn-ghost text-xs"
            >
              Régénérer (DEV)
            </ButtonWithLoading>
          )}
        </div>
      </div>
      
      <div className="card-content">
        {isGeneratingPool ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[--color-neon-cyan] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[--color-text-secondary] text-lg font-bold text-center">Les contacts cherchent de nouveaux runners...</p>
          </div>
        ) : recruitmentPool.length > 0 ? (
          recruitmentPool.map((recruit, index) => (
            <div key={index} className="bg-black/30 p-4 rounded border border-[--color-border-dark] hover:border-[--color-neon-pink]/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg text-[--color-text-primary] font-bold">{recruit.name}</h3>
                  <p className="text-sm text-[--color-text-secondary]">
                    Niveau 1 • Candidat
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[--color-neon-pink] font-bold">
                    Puissance: {recruit.totalPower}
                  </div>
                  <div className="flex gap-2 text-xs mt-1">
                    <span className="text-blue-400">H:{recruit.skills.hacking}</span>
                    <span className="text-green-400">S:{recruit.skills.stealth}</span>
                    <span className="text-red-400">C:{recruit.skills.combat}</span>
                  </div>
                </div>
              </div>

              {recruit.lore && (
              <p className="text-sm text-[--color-text-secondary] mb-3 line-clamp-2">
                  {recruit.lore}
              </p>
              )}

              <div className="flex justify-between items-center">
                <div className="text-sm text-[--color-neon-pink] font-bold">
                  Commission Fixer: {(() => {
                    const totalPoints = recruit.skills.hacking + recruit.skills.stealth + recruit.skills.combat;
                    const commission = Math.max(0, Math.min(25 - (totalPoints * 0.5), 50));
                    return commission.toFixed(1);
                  })()}%
                </div>
                <ButtonWithLoading
                  onClick={() => handleRecruit(recruit)}
                  isLoading={loading}
                  loadingText="RECRUTEMENT..."
                  className="btn-primary text-sm"
                >
                  Recruter
                </ButtonWithLoading>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <p className="empty-state-text">Aucun candidat disponible</p>
            {cooldownUntil && cooldownLeft > 0 ? (
              <p className="empty-state-subtext text-center">
                Prochain contact possible dans <span className="text-[--color-neon-cyan] font-bold">{Math.floor(cooldownLeft / 1000 / 60 / 60)}h {Math.floor((cooldownLeft / 1000 / 60) % 60)}m</span>
              </p>
            ) : (
              <p className="empty-state-subtext text-center">
                Utilise le bouton <span className="text-[--color-neon-cyan] font-bold">Activer un contact</span> pour trouver de nouveaux runners.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Composant pour l'onglet Mur des Disparus
  const MurDesDisparusTab = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Mur des Disparus</h2>
        <span className="text-sm text-[--color-text-secondary]">
          {deadRunners.length} runner{deadRunners.length > 1 ? 's' : ''} disparu{deadRunners.length > 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="card-content">
        {deadRunners.length > 0 ? (
          deadRunners.map((runner) => (
            <div key={runner._id} className="bg-black/30 p-4 rounded border border-red-500/30 hover:border-red-500/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg text-red-400 font-bold">🕯️ {runner.name}</h3>
                  <p className="text-sm text-[--color-text-secondary]">
                    Niveau {runner.level} • Disparu
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-red-400 font-bold">
                    Puissance: {runner.skills.hacking + runner.skills.stealth + runner.skills.combat}
                  </div>
                  <div className="flex gap-2 text-xs mt-1">
                    <span className="text-blue-400">H:{runner.skills.hacking}</span>
                    <span className="text-green-400">S:{runner.skills.stealth}</span>
                    <span className="text-red-400">C:{runner.skills.combat}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-[--color-text-secondary] mb-3">
                Cause: {runner.deathCause || 'Inconnue'}
              </p>

              <div className="flex justify-between items-center">
                <div className="text-sm text-[--color-text-secondary]">
                  Missions: {runner.missionsCompleted || 0} réussies, {runner.missionsFailed || 0} échouées
                </div>
                <button
                  onClick={() => {
                    setSelectedDeadRunner(runner);
                    setShowDeadRunnerModal(true);
                  }}
                  className="btn-ghost text-sm"
                >
                  Détails
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🕯️</div>
            <p className="empty-state-text">Aucun runner disparu</p>
            <p className="empty-state-subtext">
              Garde tes runners en vie !
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <main className="page-container">
      <style jsx>{grilledRunnerStyles}</style>
      <style jsx>{onMissionStyles}</style>
      <div className="content-wrapper">
        {/* Onglets */}
        <div className="tab-container">
          <div className="tab-list">
            <button
              onClick={() => setActiveTab('equipe')}
              className={`tab-button ${
                activeTab === 'equipe' ? 'tab-button-active' : 'tab-button-inactive'
              }`}
            >
              👥 Équipe ({livingRunners.length})
            </button>
            <button
              onClick={() => setActiveTab('recrutement')}
              className={`tab-button ${
                activeTab === 'recrutement' ? 'tab-button-active' : 'tab-button-inactive'
              }`}
            >
              🎯 Recrutement
            </button>
            <button
              onClick={() => setActiveTab('disparus')}
              className={`tab-button ${activeTab === 'disparus' ? 'active' : ''}`}
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
            {activeTab === 'disparus' && <MurDesDisparusTab />}
          </div>

          {/* Colonne de l'inventaire (visible seulement pour l'équipe) */}
          {activeTab === 'equipe' && (
            <div className="lg:col-span-1">
              <div className="card sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
                <h2 className="card-title mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎒</span>
                  Inventaire
                </h2>
                
                {playerInventory ? (
                  <div className="item-spacing">
                    {/* Debug info */}
                    <div className="text-xs text-gray-500 mb-4">
                      <p>Debug - Implants: {playerInventory.implants?.length || 0}</p>
                    </div>
                    
                    {/* Implants */}
                    {(playerInventory.implants?.length || 0) > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg text-[--color-text-primary] font-bold mb-3 flex items-center gap-2">
                          <span>🔧</span>
                          Implants Disponibles
                        </h3>
                        <div className="item-spacing">
                          {playerInventory.implants.map((implant, index) => (
                            <div 
                              key={index} 
                              className="bg-white/5 p-3 rounded border border-[--color-border-dark] hover:bg-white/10 transition-all"
                            >
                              <div className="mb-2">
                                <span className="text-[--color-text-primary] text-sm font-medium">
                                  {implant.program?.name || 'Implant inconnu'}
                                </span>
                                {implant.quantity > 1 && (
                                  <span className="text-xs text-[--color-neon-pink] ml-2">
                                    x{implant.quantity}
                                  </span>
                                )}
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
                      <div className="empty-state">
                        <div className="empty-state-icon">🎒</div>
                        <p className="empty-state-text">Aucun implant disponible.</p>
                        <p className="empty-state-subtext">
                          Va au marché noir pour t&apos;équiper.
                        </p>
                        <button 
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/test/add-inventory-items', { method: 'POST' });
                              if (response.ok) {
                                // alert('Items de test ajoutés !');
                                fetchInventory();
                              }
                            } catch (error) {
                                console.error('Erreur lors de l&apos;ajout d&apos;items de test:', error);
                            }
                          }}
                          className="mt-4 btn-ghost text-xs"
                        >
                          Ajouter items de test
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="loading-spinner mb-4"></div>
                    <p className="empty-state-text">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {playerInventory?.implants?.map((implant, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded border cursor-pointer transition-all ${
                      selectedImplants.includes(implant)
                        ? 'bg-[--color-neon-cyan]/20 border-[--color-neon-cyan]'
                        : 'bg-black/30 border-[--color-border-dark] hover:border-[--color-neon-cyan]/50'
                    }`}
                    onClick={() => handleToggleImplantSelection(implant)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="text-[--color-text-primary] font-bold text-sm">
                        {implant.program?.name || 'Implant inconnu'}
                      </h5>
                      <input 
                        type="checkbox" 
                        checked={selectedImplants.includes(implant)}
                        onChange={() => handleToggleImplantSelection(implant)}
                        className="ml-2"
                      />
                    </div>
                    <div className={`text-xs ${getRarityColor(implant.program?.rarity)} mb-2`}>
                      {implant.program?.rarity?.toUpperCase()}
                    </div>
                    <p className="text-xs text-[--color-text-secondary] mb-2">
                      {implant.program?.description}
                    </p>
                    <div className="text-xs text-[--color-neon-cyan]">
                      Coût de pose: 2,000 €$
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Résumé et actions */}
            {selectedImplants.length > 0 && (
              <div className="bg-black/30 p-4 rounded-lg border border-[--color-border-dark] mb-6">
                <h4 className="text-lg text-[--color-text-primary] font-bold mb-3">
                  Résumé de l&apos;installation 
                </h4>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Implants sélectionnés:</span>
                    <span className="text-[--color-neon-cyan]">{selectedImplants.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Coût total:</span>
                    <span className="text-[--color-neon-pink] font-bold">
                      {((selectedImplants?.length || 0) * 2000).toLocaleString('en-US')} €$
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleInstallSelectedImplants}
                    className="btn-primary flex-1"
                  >
                    Installer {selectedImplants.length} implant{selectedImplants.length > 1 ? 's' : ''}
                  </button>
                  <button
                    onClick={() => setSelectedImplants([])}
                    className="btn-ghost"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            )}

            {/* Bouton de fermeture */}
            <div className="flex justify-end">
              <button
                onClick={handleCloseImplantModal}
                className="btn-ghost"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal des détails du runner mort */}
      {showDeadRunnerModal && selectedDeadRunner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-6 rounded-lg border border-red-500 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl text-red-400 font-bold">
                🕯️ {selectedDeadRunner.name}
              </h3>
              <button 
                onClick={() => setShowDeadRunnerModal(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-[--color-text-secondary]">
                Cause de la mort: {selectedDeadRunner.deathCause || 'Inconnue'}
              </p>
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
      )}
    </main>
  );
}