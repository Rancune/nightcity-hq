'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Typewriter from '@/components/Typewriter';
import ButtonWithLoading from '@/components/ButtonWithLoading';
import AcceptanceTimer from '@/components/AcceptanceTimer';
import MissionTimer from '@/components/MissionTimer';
import AssignRunnerModal from '@/components/AssignRunnerModal';
import DebriefingModal from '@/components/DebriefingModal';
import FactionBadge from '@/components/FactionBadge';
import { determineDifficulty, calculateReputationGain } from '@/Lib/reputation';
import { FACTIONS } from '@/Lib/factionRelations';
import ContractAnalyzer from '@/components/ContractAnalyzer';
import ThreatLevelBadge from '@/components/ThreatLevelBadge';
import { THREAT_LEVELS } from '@/Lib/threatLevels';
import LoadingOverlay from '@/components/LoadingOverlay';
import RequiredSkillsDisplay from '@/components/RequiredSkillsDisplay';

export default function ContratsPage() {
  const [contrats, setContrats] = useState([]);
  const [netrunners, setNetrunners] = useState([]);
  const [playerInventory, setPlayerInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('assigned'); // all, active, completed, pending
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [loadingReports, setLoadingReports] = useState({});
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [showDebriefing, setShowDebriefing] = useState(false);
  const [debriefingContract, setDebriefingContract] = useState(null);
  const [debriefingReputationInfo, setDebriefingReputationInfo] = useState(null);
  const [debriefingUsedPrograms, setDebriefingUsedPrograms] = useState([]);
  const [debriefingFinancialSummary, setDebriefingFinancialSummary] = useState(null);
  const { isSignedIn, isLoaded } = useAuth();

  // Vérifier si on est en environnement de développement
  const isDevelopment = process.env.NODE_ENV === 'development';

  const fetchData = async () => {
    try {
      // Récupérer les contrats du joueur (assignés et actifs)
      const contratsResponse = await fetch('/api/contrats?playerContracts=true');
      if (contratsResponse.ok) {
        const contratsData = await contratsResponse.json();
        console.log('[DEBUG] Contrats du joueur récupérés:', contratsData);
        // Log spécifique pour les contrats avec runner assigné
        contratsData.forEach(contrat => {
          if (contrat.assignedRunner) {
            console.log(`[DEBUG] Contrat ${contrat.title} - Runner assigné:`, {
              name: contrat.assignedRunner.name,
              skills: contrat.assignedRunner.skills
            });
          }
        });
        setContrats(contratsData);
      }

      // Récupérer les netrunners
      const runnersResponse = await fetch('/api/netrunners');
      if (runnersResponse.ok) {
        const runnersData = await runnersResponse.json();
        setNetrunners(runnersData);
      }

      // Récupérer l'inventaire du joueur
      const inventoryResponse = await fetch('/api/player/inventory');
      if (inventoryResponse.ok) {
        const inventoryData = await inventoryResponse.json();
        setPlayerInventory(inventoryData.inventory || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchData();
    }
  }, [isLoaded, isSignedIn]);

  const handleGenerateContract = async () => {
    setIsGeneratingContract(true);
    try {
      const response = await fetch('/api/contrats/generate', { method: 'POST' });
      if (response.ok) {
        // Recharger les données après génération
        await fetchData();
      }
    } catch (error) {
      console.error('Erreur lors de la génération du contrat:', error);
    } finally {
      setIsGeneratingContract(false);
    }
  };

  const openAssignModal = (contractId) => {
    setSelectedContractId(contractId);
    setIsAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedContractId(null);
  };

  // Fonction pour récupérer le contrat sélectionné
  const getSelectedContract = () => {
    return contrats.find(contract => contract._id === selectedContractId);
  };

  const handleAssignRunner = async (netrunnerId) => {
    if (!selectedContractId) return;
    try {
      const response = await fetch(`/api/contrats/${selectedContractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ netrunnerId }),
      });
      if (response.ok) {
        closeAssignModal();
        fetchData();
      } else {
        const errorMessage = await response.text();
        console.error(`[ASSIGN] Erreur lors de l'assignation : ${errorMessage}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
    }
  };

  const handleTimerEnd = async (contractId) => {
    try {
      console.log(`[TIMER] Tentative de fin de timer pour le contrat ${contractId}`);
      const contract = contrats.find(c => c._id === contractId);
      if (!contract) {
        console.error(`[TIMER] Contrat ${contractId} non trouvé dans la liste locale`);
        return;
      }
      console.log(`[TIMER] Statut du contrat: ${contract.status}`);
      console.log(`[TIMER] Runner assigné:`, contract.assignedRunner);
      const response = await fetch(`/api/contrats/${contractId}/timesup`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`[TIMER] Réponse du serveur: ${response.status} ${response.statusText}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`[TIMER] Données reçues:`, data);
        // Ne pas ouvrir la modal, juste mettre à jour les données
        await fetchData();
      } else {
        const errorText = await response.text();
        console.error(`[TIMER] Erreur ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('[TIMER] Erreur lors de la fin du timer:', error);
    }
  };

  const handleClaimReward = async (contractId) => {
    try {
      setLoadingReports(prev => ({ ...prev, [contractId]: true }));
      // Étape 1 : POST pour résoudre le contrat et mettre à jour le statut
      const resolveResponse = await fetch(`/api/contrats/${contractId}/resolve`, { method: 'POST' });
      if (!resolveResponse.ok) {
        const errorMessage = await resolveResponse.text();
        console.error(`[CLAIM] Erreur lors de la résolution du contrat: ${errorMessage}`);
        setLoadingReports(prev => ({ ...prev, [contractId]: false }));
        return;
      }
      // Étape 2 : GET pour récupérer le contrat à jour
      const response = await fetch(`/api/contrats/${contractId}`);
      if (response.ok) {
        const contract = await response.json();
        // Log pour debug complet du mapping runnerReports
        if (contract.runnerReports) {
          contract.runnerReports.forEach((r, i) => {
            console.log(`[CLAIM] runnerReports[${i}]:`, r);
          });
        }
        setDebriefingContract({ ...contract });
        setDebriefingReputationInfo(null);
        setDebriefingUsedPrograms([]);
        setDebriefingFinancialSummary(null);
        setShowDebriefing(true);
        // Rafraîchir immédiatement la liste des contrats pour mettre à jour le statut
        await fetchData();
      } else {
        const errorMessage = await response.text();
        console.error(`[CLAIM] Erreur lors de la récupération du rapport: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport:', error);
    } finally {
      setLoadingReports(prev => ({ ...prev, [contractId]: false }));
    }
  };

  const testRewards = async () => {
    try {
      const response = await fetch('/api/test-rewards');
      if (response.ok) {
        const data = await response.json();
        console.log('[TEST] Données de récompenses:', data);
        alert(`Test des récompenses:\n\nJoueur: ${data.player.eddies} €$, ${data.player.reputationPoints} PR (${data.player.reputationTitle})\n\nContrats en attente: ${data.contracts.length}`);
      }
    } catch (error) {
      console.error('Erreur lors du test des récompenses:', error);
    }
  };

  const handleAnalyzeContract = async (contractId) => {
    try {
      const response = await fetch(`/api/contrats/${contractId}/analyze`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        console.log('[ANALYZE] Contrat analysé:', data);
        
        // Mettre à jour la liste des contrats
        setContrats(prevContrats => 
          prevContrats.map(contract => 
            contract._id === contractId 
              ? { ...contract, skillsRevealed: true }
              : contract
          )
        );
        
        // Recharger l'inventaire pour refléter la consommation de l'Analyseur
        const inventoryResponse = await fetch('/api/player/inventory');
        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json();
          setPlayerInventory(inventoryData.inventory || []);
        }
      } else {
        const errorMessage = await response.text();
        console.error(`[ANALYZE] Erreur lors de l'analyse: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse du contrat:', error);
    }
  };

  const filteredContrats = contrats.filter(contrat => {
    switch (filter) {
      case 'active':
        return contrat.status === 'Actif' || contrat.status === 'Assigné';
      case 'completed':
        return contrat.status === 'Terminé';
      case 'pending':
        return contrat.status === 'En attente de rapport';
      case 'assigned':
        return contrat.status === 'Assigné';
      default:
        return true;
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Actif':
        return 'text-yellow-400';
      case 'Assigné':
        return 'text-orange-400';
      case 'Terminé':
        return 'text-green-400';
      case 'En attente de rapport':
        return 'text-[--color-neon-cyan]';
      case 'Échoué':
        return 'text-red-400';
      case 'Proposé':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Facile':
        return 'text-green-400';
      case 'Moyenne':
        return 'text-yellow-400';
      case 'Difficile':
        return 'text-orange-400';
      case 'Très Difficile':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  // Fonction pour calculer les vraies récompenses selon la difficulté
  const calculateActualRewards = (contract) => {
    const difficulty = determineDifficulty(contract.requiredSkills);
    const actualReputation = calculateReputationGain(difficulty);
    return {
      eddies: contract.reward?.eddies || 0,
      reputation: actualReputation
    };
  };

  const getReportButtonColor = (contract) => {
    if (contract.resolution_outcome === 'Succès') {
      return 'bg-green-600 hover:bg-green-500 text-white';
    } else if (contract.resolution_outcome === 'Échec') {
      return 'bg-red-600 hover:bg-red-500 text-white';
    } else {
      return 'bg-[--color-neon-cyan] hover:bg-white hover:text-background text-background';
    }
  };

  const getFactionName = (factionKey) => {
    const factionNames = {
      'corpo': 'Corporation',
      'street': 'Street Gang',
      'nomad': 'Nomad Clan',
      'government': 'Government',
      'fixer': 'Fixer Network'
    };
    return factionNames[factionKey] || factionKey;
  };

  const getRequiredRunnersCount = (requiredSkills) => {
    if (!requiredSkills || !Array.isArray(requiredSkills)) return 1;
    
    // Compter le nombre de compétences uniques requises
    const uniqueSkills = new Set();
    requiredSkills.forEach(skill => {
      if (skill && skill.name) {
        uniqueSkills.add(skill.name);
      }
    });
    
    // Si plus de 3 compétences différentes, il faut plusieurs runners
    return uniqueSkills.size > 3 ? Math.ceil(uniqueSkills.size / 3) : 1;
  };

  const getRequiredSkillsList = (requiredSkills) => {
    if (!requiredSkills || !Array.isArray(requiredSkills)) return [];
    
    // Retourner les compétences uniques
    const uniqueSkills = [];
    const seenSkills = new Set();
    
    requiredSkills.forEach(skill => {
      if (skill && skill.name && !seenSkills.has(skill.name)) {
        uniqueSkills.push(skill);
        seenSkills.add(skill.name);
      }
    });
    
    return uniqueSkills;
  };

  const formatSkills = (skills) => {
    const skillNames = {
      hacking: 'Hacking',
      stealth: 'Infiltration', 
      combat: 'Combat'
    };
    
    return Object.entries(skills)
      .filter(([_, value]) => value > 0)
      .map(([skill, value]) => `${skillNames[skill]}: ${value}`)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="loading-text">Chargement des contrats...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="page-container">
      <div className="content-wrapper">
        {/* En-tête avec bouton de génération */}
        <div className="page-header">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="page-title">Contrats</h1>
              <p className="page-subtitle">
                <Typewriter text="Gère tes contrats et surveille leur progression dans les rues de Night City." speed={10} />
              </p>
            </div>
            <div className="flex gap-2">
              {isDevelopment && (
                <button
                  onClick={testRewards}
                  className="btn-secondary text-sm"
                >
                  Test Rewards
                </button>
              )}
              {isDevelopment && (
                <ButtonWithLoading
                  onClick={handleGenerateContract}
                  isLoading={isGeneratingContract}
                  loadingText="GÉNÉRATION..."
                  className="btn-primary"
                >
                  Générer Contrat
                </ButtonWithLoading>
              )}
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="filter-container">
          <div className="filter-list">
            <button
              onClick={() => setFilter('assigned')}
              className={`filter-button ${
                filter === 'assigned' ? 'filter-button-active' : 'filter-button-inactive'
              }`}
            >
              Pris en charge ({contrats.filter(c => c.status === 'Assigné').length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`filter-button ${
                filter === 'active' ? 'filter-button-active' : 'filter-button-inactive'
              }`}
            >
              Actifs ({contrats.filter(c => c.status === 'Actif' || c.status === 'Assigné').length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`filter-button ${
                filter === 'pending' ? 'filter-button-active' : 'filter-button-inactive'
              }`}
            >
              En Attente ({contrats.filter(c => c.status === 'En attente de rapport').length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`filter-button ${
                filter === 'completed' ? 'filter-button-active' : 'filter-button-inactive'
              }`}
            >
              Terminés ({contrats.filter(c => c.status === 'Terminé').length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`filter-button ${
                filter === 'all' ? 'filter-button-active' : 'filter-button-inactive'
              }`}
            >
              Tous ({contrats.length})
            </button>
          </div>
        </div>

        {/* Liste des contrats */}
        <div className="items-grid">
          {filteredContrats.map((contrat) => (
            <div key={contrat._id} className="card">
              {/* En-tête du contrat */}
              <div className="mb-4">
                <h3 className="text-xl text-[--color-text-primary] font-bold mb-2">{contrat.title}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`badge ${getStatusColor(contrat.status)}`}>
                    {contrat.status}
                  </span>
                  <span className="text-[--color-text-secondary]">•</span>
                  <span className={`badge ${getDifficultyColor(contrat.difficulty)}`}>
                    {contrat.difficulty}
                  </span>
                </div>
              </div>

              {/* Informations du contrat */}
              <div className="mb-4 space-y-2 text-sm">
                {/* Donneur d'ordre */}
                <div className="flex justify-between">
                  <span className="text-[--color-text-secondary]">Donneur d&apos;ordre:</span>
                  <span className="text-[--color-text-primary] font-bold">
                    {contrat.employerFaction ? getFactionName(contrat.employerFaction) : 'Contact anonyme'}
                  </span>
                </div>
                
                {/* Cible */}
                <div className="flex justify-between">
                  <span className="text-[--color-text-secondary]">Cible:</span>
                  <span className="text-[--color-text-primary] font-bold">
                    {contrat.targetFaction ? getFactionName(contrat.targetFaction) : 'Cible non spécifiée'}
                  </span>
                </div>
                
                {/* Récompense */}
                <div className="flex justify-between">
                  <span className="text-[--color-text-secondary]">Récompense:</span>
                  <div className="text-right">
                    <div className="text-sm text-[--color-neon-pink] font-bold">
                      {contrat.reward?.eddies?.toLocaleString('en-US')} €$
                    </div>
                    <div className="text-xs text-[--color-neon-cyan]">
                      +{contrat.reward?.reputation} PR
                    </div>
                  </div>
                </div>
              </div>

              {/* Timers */}
              <div className="mb-4">
                {/* Timer d'acceptation pour les contrats assignés (si pas encore de runner) */}
                {contrat.status === 'Assigné' && !contrat.assignedRunner && contrat.acceptance_deadline_trp > 0 && (
                  <div className="p-3 bg-black/30 rounded border border-[--color-border-dark] mb-3">
                    <div className="text-center">
                      <p className="text-xs text-[--color-text-secondary] mb-1">⏰ Assigner un runner avant</p>
                      <AcceptanceTimer duration={contrat.acceptance_deadline_trp} />
                    </div>
                  </div>
                )}
                
                {/* Timer de mission pour les contrats actifs */}
                {contrat.status === 'Actif' && contrat.initial_completion_duration_trp > 0 && (
                  <div className="p-3 bg-black/30 rounded border border-[--color-border-dark] mb-3">
                    <div className="text-center">
                      <p className="text-xs text-[--color-text-secondary] mb-1">⏰ Mission en cours</p>
                      <MissionTimer 
                        totalDuration={contrat.initial_completion_duration_trp}
                        startTime={contrat.completion_timer_started_at}
                        onTimerEnd={() => handleTimerEnd(contrat._id)}
                      />
                    </div>
                  </div>
                )}

                {/* Runner assigné */}
                {contrat.assignedRunner && (
                  <div className="p-3 bg-black/30 rounded border border-[--color-border-dark]">
                    <p className="text-sm text-[--color-text-secondary] mb-1">Runner assigné:</p>
                    <p className="text-[--color-text-primary] font-bold">{contrat.assignedRunner.name}</p>
                    <div className="flex gap-2 mt-1 text-xs">
                      <span className="text-blue-400">H: {contrat.assignedRunner.skills?.hacking || 0}</span>
                      <span className="text-green-400">S: {contrat.assignedRunner.skills?.stealth || 0}</span>
                      <span className="text-red-400">C: {contrat.assignedRunner.skills?.combat || 0}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Factions impliquées */}
              {contrat.involvedFactions && contrat.involvedFactions.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-[--color-text-secondary] mb-2">Factions impliquées:</p>
                  <div className="flex flex-wrap">
                    {contrat.involvedFactions.map((faction) => (
                      <FactionBadge key={faction} factionKey={faction} />
                    ))}
                  </div>
                </div>
              )}

              {/* Compétences requises - Remplacé par ContractAnalyzer */}
              {contrat.status === 'Assigné' && !contrat.assignedRunner && (
                <ContractAnalyzer 
                  contract={contrat}
                  playerInventory={playerInventory}
                  onAnalyze={handleAnalyzeContract}
                />
              )}

              {/* Informations sur l'équipe requise */}
              <div className="mb-4 p-3 bg-black/20 rounded border border-[--color-border-dark]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[--color-text-secondary]">Équipe requise:</span>
                  <span className="text-xs text-[--color-neon-cyan] font-semibold">
                    {getRequiredRunnersCount(contrat.requiredSkills)} runner{getRequiredRunnersCount(contrat.requiredSkills) > 1 ? 's' : ''}
                  </span>
                </div>
                
                {/* Compétences cachées par défaut */}
                <div className="flex flex-wrap gap-2">
                  {getRequiredSkillsList(contrat.requiredSkills).map((skill, index) => (
                    <div key={index} className="text-xs font-semibold px-2 py-1 rounded bg-black/30 border border-[--color-border-dark] text-[--color-text-secondary]">
                      ???: ???
                    </div>
                  ))}
                </div>
                
                {/* Note sur les compétences cachées */}
                <p className="text-xs text-[--color-text-secondary] mt-2">
                  Les compétences requises sont cachées jusqu&apos;à l&apos;analyse du contrat.
                </p>
              </div>

              {/* Actions du contrat */}
              <div className="flex gap-2">
                <Link href={`/contrats/${contrat._id}`}>
                  <button className="btn-secondary flex-1 text-sm">
                    Détails
                  </button>
                </Link>
                {/* Bouton Assigner Runner : seulement pour Assigné sans runners assignés */}
                {contrat.status === 'Assigné' && !contrat.assignedRunner && (
                  <button
                    onClick={() => openAssignModal(contrat._id)}
                    className="btn-primary flex-1 text-sm"
                  >
                    Assigner Runner
                  </button>
                )}
                {/* Bouton Rapport : seulement pour En attente de rapport */}
                {contrat.status === 'En attente de rapport' && (
                  <ButtonWithLoading
                    onClick={() => handleClaimReward(contrat._id)}
                    isLoading={loadingReports[contrat._id]}
                    loadingText="RAPPORT..."
                    className={`flex-1 text-sm ${
                      contrat.resolution_outcome === 'Succès'
                        ? 'btn-success'
                        : contrat.resolution_outcome === 'Échec'
                        ? 'bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 lg:py-3 lg:px-6 rounded transition-all duration-200'
                        : 'btn-primary'
                    }`}
                  >
                    {contrat.resolution_outcome === 'Succès' ? '✅ Succès' : 
                     contrat.resolution_outcome === 'Échec' ? '❌ Échec' : 
                     '📋 Rapport'}
                  </ButtonWithLoading>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* État vide */}
        {filteredContrats.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">
                          {filter === 'all' ? 'Aucun contrat disponible' : 
             filter === 'assigned' ? 'Aucun contrat pris en charge' :
             filter === 'active' ? 'Aucun contrat actif' :
             filter === 'pending' ? 'Aucun contrat en attente' :
             'Aucun contrat terminé'}
            </p>
            {filter === 'all' && (
              <p className="empty-state-subtext">
                Génère un nouveau contrat pour commencer
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      <AssignRunnerModal
        isOpen={isAssignModalOpen}
        onClose={closeAssignModal}
        onAssign={handleAssignRunner}
        runners={netrunners.filter(r => r.status === 'Disponible')}
        contract={getSelectedContract()}
        onAssigned={fetchData}
      />
      
      <DebriefingModal
        isOpen={showDebriefing}
        contract={debriefingContract}
        reputationInfo={debriefingReputationInfo}
        usedPrograms={debriefingUsedPrograms}
        financialSummary={debriefingFinancialSummary}
        onClose={() => {
          setShowDebriefing(false);
          setDebriefingContract(null);
          setDebriefingReputationInfo(null);
          setDebriefingUsedPrograms([]);
          setDebriefingFinancialSummary(null);
          // Recharger les données après fermeture de la modale
          setTimeout(() => {
            fetchData();
          }, 100);
        }}
      />
    </main>
  );
}