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

export default function ContratsPage() {
  const [contrats, setContrats] = useState([]);
  const [netrunners, setNetrunners] = useState([]);
  const [playerInventory, setPlayerInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed, pending
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [loadingReports, setLoadingReports] = useState({});
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [showDebriefing, setShowDebriefing] = useState(false);
  const [debriefingContract, setDebriefingContract] = useState(null);
  const [debriefingReputationInfo, setDebriefingReputationInfo] = useState(null);
  const { isSignedIn, isLoaded } = useAuth();

  const fetchData = async () => {
    try {
      // Récupérer les contrats
      const contratsResponse = await fetch('/api/contrats');
      if (contratsResponse.ok) {
        const contratsData = await contratsResponse.json();
        console.log('[DEBUG] Contrats récupérés:', contratsData);
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
      await fetch(`/api/contrats/${contractId}/timesup`, { method: 'POST' });
      fetchData();
    } catch (error) {
      console.error('Erreur lors de la fin du timer:', error);
    }
  };

  const handleClaimReward = async (contractId) => {
    try {
      setLoadingReports(prev => ({ ...prev, [contractId]: true }));
      const response = await fetch(`/api/contrats/${contractId}/resolve`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setDebriefingContract(data.updatedContract);
        setDebriefingReputationInfo(data.reputationInfo);
        setShowDebriefing(true);

        // Log de débogage pour vérifier les données
        console.log('[DEBUG] Données de résolution:', data);

        // Recharger les données après résolution
        await fetchData();
      }
    } catch (error) {
      console.error('Erreur lors de la réclamation de la récompense:', error);
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
        return contrat.status === 'En cours' || contrat.status === 'Assigné';
      case 'completed':
        return contrat.status === 'Terminé';
      case 'pending':
        return contrat.status === 'En attente de rapport';
      case 'proposed':
        return contrat.status === 'Proposé';
      default:
        return true;
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'En cours':
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
    return FACTIONS[factionKey]?.name || factionKey;
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
      <main className="min-h-screen p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[--color-neon-cyan] border-t-transparent rounded-full mx-auto"></div>
          <p className="text-[--color-text-secondary] mt-4">Chargement des contrats...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête avec bouton de génération */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl text-[--color-neon-cyan] font-bold mb-2">Contrats</h1>
              <p className="text-[--color-text-secondary]">
                <Typewriter text="Gère tes contrats et surveille leur progression dans les rues de Night City." speed={50} />
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={testRewards}
                className="bg-[--color-neon-cyan] text-background font-bold py-3 px-4 rounded hover:bg-white transition-all text-sm"
              >
                Test Rewards
              </button>
              <ButtonWithLoading
                onClick={handleGenerateContract}
                isLoading={isGeneratingContract}
                loadingText="GÉNÉRATION..."
                className="bg-[--color-neon-pink] text-white font-bold py-3 px-6 rounded hover:bg-white hover:text-background transition-all"
              >
                Générer Contrat
              </ButtonWithLoading>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white/5 p-4 rounded-lg border border-[--color-border-dark] mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded font-bold transition-all ${
                filter === 'all' 
                  ? 'bg-[--color-neon-cyan] text-background' 
                  : 'bg-black/50 text-[--color-text-secondary] hover:bg-black/70'
              }`}
            >
              Tous ({contrats.length})
            </button>
            <button
              onClick={() => setFilter('proposed')}
              className={`px-4 py-2 rounded font-bold transition-all ${
                filter === 'proposed' 
                  ? 'bg-[--color-neon-cyan] text-background' 
                  : 'bg-black/50 text-[--color-text-secondary] hover:bg-black/70'
              }`}
            >
              Proposés ({contrats.filter(c => c.status === 'Proposé').length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded font-bold transition-all ${
                filter === 'active' 
                  ? 'bg-[--color-neon-cyan] text-background' 
                  : 'bg-black/50 text-[--color-text-secondary] hover:bg-black/70'
              }`}
            >
              En Cours ({contrats.filter(c => c.status === 'En cours' || c.status === 'Assigné').length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded font-bold transition-all ${
                filter === 'pending' 
                  ? 'bg-[--color-neon-cyan] text-background' 
                  : 'bg-black/50 text-[--color-text-secondary] hover:bg-black/70'
              }`}
            >
              En Attente ({contrats.filter(c => c.status === 'En attente de rapport').length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded font-bold transition-all ${
                filter === 'completed' 
                  ? 'bg-[--color-neon-cyan] text-background' 
                  : 'bg-black/50 text-[--color-text-secondary] hover:bg-black/70'
              }`}
            >
              Terminés ({contrats.filter(c => c.status === 'Terminé').length})
            </button>
          </div>
        </div>

        {/* Liste des contrats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredContrats.map((contrat) => (
            <div key={contrat._id} className="bg-white/5 p-6 rounded-lg border border-[--color-border-dark] hover:border-[--color-neon-cyan] transition-all">
              {/* En-tête du contrat */}
              <div className="mb-4">
                <h3 className="text-xl text-[--color-text-primary] font-bold mb-2">{contrat.title}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-bold ${getStatusColor(contrat.status)}`}>
                    {contrat.status}
                  </span>
                  <span className="text-[--color-text-secondary]">•</span>
                  <span className={`text-sm font-bold ${getDifficultyColor(contrat.difficulty)}`}>
                    {contrat.difficulty}
                  </span>
                </div>
              </div>

              {/* Informations du contrat */}
              <div className="mb-4 space-y-2 text-sm">
                {/* Donneur d'ordre */}
                <div className="flex justify-between">
                  <span className="text-[--color-text-secondary]">Donneur d'ordre:</span>
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
                    <div className="text-[--color-neon-pink] font-bold">
                      {calculateActualRewards(contrat).eddies.toLocaleString()} €$
                    </div>
                    <div className="text-[--color-neon-cyan] font-bold text-xs">
                      +{calculateActualRewards(contrat).reputation} PR
                    </div>
                  </div>
                </div>
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
              {contrat.status === 'Proposé' && (
                <ContractAnalyzer 
                  contract={contrat}
                  playerInventory={playerInventory}
                  onAnalyze={handleAnalyzeContract}
                />
              )}

              {/* Compétences révélées pour les contrats acceptés */}
              {contrat.status !== 'Proposé' && contrat.skillsRevealed && (
                <div className="mb-4 p-3 bg-black/30 rounded border border-green-500/50">
                  <p className="text-xs text-green-400 mb-2">🔍 Compétences révélées</p>
                  <div className="flex gap-2 text-xs">
                    {contrat.requiredSkills?.hacking > 0 && (
                      <span className="text-blue-400">Hacking: {contrat.requiredSkills.hacking}</span>
                    )}
                    {contrat.requiredSkills?.stealth > 0 && (
                      <span className="text-green-400">Infiltration: {contrat.requiredSkills.stealth}</span>
                    )}
                    {contrat.requiredSkills?.combat > 0 && (
                      <span className="text-red-400">Combat: {contrat.requiredSkills.combat}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-4">
                <p className="text-[--color-text-secondary] text-sm line-clamp-3">
                  <Typewriter text={contrat.description} speed={60} />
                </p>
              </div>

              {/* Timers et statuts spéciaux */}
              <div className="mb-4">
                {contrat.status === 'Proposé' && contrat.acceptance_deadline_trp > 0 && (
                  <div className="p-3 bg-black/30 rounded text-center">
                    <p className="text-xs text-[--color-text-secondary] mb-1">Accepter avant</p>
                    <AcceptanceTimer duration={contrat.acceptance_deadline_trp} />
                  </div>
                )}
                
                {contrat.status === 'Assigné' && contrat.initial_completion_duration_trp > 0 && (
                  <div className="p-3 bg-black/30 rounded text-center">
                    <p className="text-xs text-[--color-text-secondary] mb-1">Mission en cours</p>
                    <MissionTimer 
                      totalDuration={contrat.initial_completion_duration_trp}
                      startTime={contrat.completion_timer_started_at}
                      onTimerEnd={() => handleTimerEnd(contrat._id)}
                    />
                  </div>
                )}

                {contrat.status === 'En cours' && contrat.initial_completion_duration_trp > 0 && (
                  <div className="p-3 bg-black/30 rounded text-center">
                    <p className="text-xs text-[--color-text-secondary] mb-1">Mission en cours</p>
                    <MissionTimer 
                      totalDuration={contrat.initial_completion_duration_trp}
                      startTime={contrat.completion_timer_started_at}
                      onTimerEnd={() => handleTimerEnd(contrat._id)}
                    />
                  </div>
                )}
              </div>

              {/* Runner assigné */}
              {contrat.assignedRunner && (
                <div className="mb-4 p-3 bg-black/30 rounded">
                  <p className="text-sm text-[--color-text-secondary] mb-1">Runner assigné:</p>
                  <p className="text-[--color-text-primary] font-bold">{contrat.assignedRunner.name}</p>
                  <div className="flex gap-2 mt-1 text-xs">
                    <span className="text-blue-400">H: {contrat.assignedRunner.skills?.hacking || 0}</span>
                    <span className="text-green-400">S: {contrat.assignedRunner.skills?.stealth || 0}</span>
                    <span className="text-red-400">C: {contrat.assignedRunner.skills?.combat || 0}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Link href={`/contrats/${contrat._id}`}>
                  <button className="flex-1 bg-[--color-neon-cyan] text-background font-bold py-2 px-4 rounded text-sm hover:bg-white transition-all">
                    Détails
                  </button>
                </Link>
                
                {contrat.status === 'Proposé' && (
                  <button
                    onClick={() => openAssignModal(contrat._id)}
                    className="flex-1 bg-[--color-neon-pink] text-white font-bold py-2 px-4 rounded text-sm hover:bg-white hover:text-background transition-all"
                  >
                    Accepter
                  </button>
                )}
                
                {contrat.status === 'En attente de rapport' && (
                  <ButtonWithLoading
                    onClick={() => handleClaimReward(contrat._id)}
                    isLoading={loadingReports[contrat._id] || false}
                    loadingText="GÉNÉRATION RAPPORT..."
                    className={`flex-1 font-bold py-2 px-4 rounded text-sm transition-all ${getReportButtonColor(contrat)}`}
                  >
                    {contrat.resolution_outcome === 'Succès' ? 'Succès' : 
                     contrat.resolution_outcome === 'Échec' ? 'Échec' : 'Voir Rapport'}
                  </ButtonWithLoading>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Message si aucun contrat */}
        {filteredContrats.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[--color-text-secondary] text-lg mb-4">
              {filter === 'all' 
                ? "Aucun contrat disponible. Génère ton premier contrat !"
                : `Aucun contrat ${filter === 'active' ? 'en cours' : filter === 'pending' ? 'en attente' : filter === 'proposed' ? 'proposé' : 'terminé'}.`
              }
            </p>
            {filter === 'all' && (
              <ButtonWithLoading
                onClick={handleGenerateContract}
                isLoading={isGeneratingContract}
                loadingText="GÉNÉRATION..."
                className="bg-[--color-neon-pink] text-white font-bold py-3 px-6 rounded hover:bg-white hover:text-background transition-all"
              >
                Générer un Contrat
              </ButtonWithLoading>
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
      />
      
      <DebriefingModal
        isOpen={showDebriefing}
        contract={debriefingContract}
        reputationInfo={debriefingReputationInfo}
        onClose={() => {
          setShowDebriefing(false);
          setDebriefingContract(null);
          setDebriefingReputationInfo(null);
          // Recharger les données après fermeture de la modale
          setTimeout(() => {
            fetchData();
          }, 100);
        }}
      />
    </main>
  );
}