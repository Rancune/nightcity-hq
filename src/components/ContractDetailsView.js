// src/components/ContractDetailsView.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Typewriter from './Typewriter';
import ButtonWithLoading from './ButtonWithLoading';
import ThreatLevelBadge from './ThreatLevelBadge';
import ThreatLevelInfo from './ThreatLevelInfo';
import RequiredSkillsDisplay from './RequiredSkillsDisplay';
import { determineThreatLevelFromSkills } from '@/Lib/threatLevels';
import DebriefingModal from './DebriefingModal';

// Ce composant reçoit le contrat initial en tant que "prop"
export default function ContractDetailsView({ initialContract }) {
  const [contract, setContract] = useState(initialContract);
  const [playerInventory, setPlayerInventory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usedPrograms, setUsedPrograms] = useState([]);
  const [revealedSkills, setRevealedSkills] = useState([]);
  const [skillBonuses, setSkillBonuses] = useState({});
  const [mouchardLoading, setMouchardLoading] = useState(false);
  const router = useRouter();
  const revealedRefs = useRef({});
  const [lastRevealed, setLastRevealed] = useState(null);
  const [showDebriefing, setShowDebriefing] = useState(false);
  const [debriefingContract, setDebriefingContract] = useState(null);

  // --- LOADOUT (Préparation de mission) ---
  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [loadoutLoading, setLoadoutLoading] = useState(false);
  const [loadoutMessage, setLoadoutMessage] = useState(null);
  const [activeEffects, setActiveEffects] = useState(null);
  const [loadoutTab, setLoadoutTab] = useState('bonus'); // 'bonus' ou 'reveal'

  // Ajout d'un état pour afficher/masquer l'inventaire
  const [showInventory, setShowInventory] = useState(false);

  // --- Section assignation multi-runners intégrée ---
  const [availableRunners, setAvailableRunners] = useState([]);
  const [selectedRunners, setSelectedRunners] = useState({}); // Changed to object for skill mapping
  const [assigning, setAssigning] = useState(false);
  const requiredSkillsCount = Object.values(contract?.requiredSkills || {}).filter(v => v > 0).length;
  const [assignError, setAssignError] = useState(null);

  // Récupérer l'inventaire du joueur
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch('/api/player/inventory');
        if (response.ok) {
          const inventory = await response.json();
          setPlayerInventory(inventory.detailedInventory || inventory); // compatibilité
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'inventaire:', error);
      }
    };
    fetchInventory();
  }, []);

  // Récupérer les compétences révélées pour ce joueur
  useEffect(() => {
    if (!contract) return;
    
    // Utiliser userRevealedSkills si disponible (depuis l'API), sinon utiliser revealedSkillsByPlayer
    if (contract.userRevealedSkills) {
      setRevealedSkills(contract.userRevealedSkills);
    } else if (contract.revealedSkillsByPlayer && typeof window !== 'undefined' && window.Clerk) {
      const userId = window.Clerk.user?.id || window.Clerk.user?.primaryEmailAddress?.id;
      if (userId) {
        const entry = contract.revealedSkillsByPlayer.find(e => e.clerkId === userId);
        setRevealedSkills(entry?.skills || []);
      }
    }
  }, [contract]);

  // Scroll automatique sur la dernière compétence révélée
  useEffect(() => {
    if (lastRevealed && revealedRefs.current[lastRevealed]) {
      revealedRefs.current[lastRevealed].scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setLastRevealed(null), 1000); // Reset pour l'animation
    }
  }, [lastRevealed]);

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
            setRevealedSkills(prev => {
              setLastRevealed(data.revealedSkill); // Pour l'animation et le scroll
              return [...prev, data.revealedSkill];
            });
          }
          if (data.effects.add_bonus_roll) {
            setSkillBonuses(prev => ({
              ...prev,
              [data.skill]: (prev[data.skill] || 0) + data.effects.add_bonus_roll
            }));
          }
        }

        // Recharger le contrat pour garder la persistance des compétences révélées
        const contractRes = await fetch(`/api/contrats/${contract._id}`);
        if (contractRes.ok) {
          const updated = await contractRes.json();
          setContract(updated);
        }
        // Recharger l'inventaire
        const inventoryResponse = await fetch('/api/player/inventory');
        if (inventoryResponse.ok) {
          const inventory = await inventoryResponse.json();
          setPlayerInventory(inventory.detailedInventory || inventory);
        }
      } else {
        const error = await response.text();
        console.error('Erreur: ', error);
      }
    } catch (error) {
      console.error('Erreur lors de l\'utilisation du programme:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    // La logique de résolution reste la même
    const response = await fetch(`/api/contrats/${contract._id}/resolve`, { method: 'POST' });
    if (response.ok) {
      const data = await response.json();
      router.push('/'); // Redirige vers la page d'accueil
      router.refresh(); // Force le rafraîchissement des données
    } else {
      const errorMessage = await response.text();
      console.error('Erreur lors de la résolution du contrat :', errorMessage);
    }
  };

  // Liste des compétences testées
  const testedSkills = Object.entries(contract.requiredSkills || {})
    .filter(([_, v]) => v > 0)
    .map(([k, v]) => ({ skill: k, value: v }));

  // Possède-t-on un Mouchard ?
  const mouchard = playerInventory?.oneShotPrograms?.find(item => item.program?.name === "Logiciel 'Mouchard'" && item.quantity > 0);
  const canUseMouchard = contract.status === 'Proposé' && mouchard && revealedSkills.length < testedSkills.length;

  // Utiliser un Mouchard
  const handleUseMouchard = async () => {
    setMouchardLoading(true);
    try {
      const response = await fetch(`/api/contrats/${contract._id}/reveal-skill`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        
        // Mettre à jour l'état local avec la nouvelle compétence révélée
        setRevealedSkills(data.revealedSkills);
        
        // Déclencher l'animation pour la nouvelle compétence révélée
        if (data.revealedSkill) {
          setLastRevealed(data.revealedSkill);
        }
        
        // Recharger le contrat pour garder la persistance
        const contractRes = await fetch(`/api/contrats/${contract._id}`);
        if (contractRes.ok) {
          const updated = await contractRes.json();
          setContract(updated);
        }
        
        // Recharger l'inventaire
        const invRes = await fetch('/api/player/inventory');
        if (invRes.ok) {
          const inventory = await invRes.json();
          setPlayerInventory(inventory.detailedInventory || inventory);
        }
      } else {
        const error = await response.text();
        console.error('Erreur: ', error);
      }
    } catch (error) {
      console.error('Erreur lors de l\'utilisation du Mouchard:', error);
    } finally {
      setMouchardLoading(false);
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

  // Fonction pour filtrer les programmes selon le statut du contrat
  const canUseProgram = (programName, contractStatus) => {
    const canUseOnProposed = [
      "Logiciel 'Mouchard'",
      "Analyseur de Contrat",
    ];

    const canUseOnAssigned = [
      "Brise-Glace",
      "Sandevistan", 
      "Décharge IEM",
      "Zero Day",
      "Blackwall",
    ];

    if (contractStatus === 'Proposé') {
      return canUseOnProposed.includes(programName);
    } else if (contractStatus === 'Assigné') {
      return canUseOnAssigned.includes(programName) || canUseOnProposed.includes(programName);
    }
    return false;
  };

  // Récompenses
  const rewardEddies = contract.reward?.eddies || 0;
  const rewardReputation = contract.reward?.reputation || 0;

  // L'analyseur de contrat révèle tout ?
  const allSkillsRevealed = revealedSkills.length === testedSkills.length;

  // Récupérer les effets actifs pour ce joueur
  useEffect(() => {
    if (!contract || !contract.activeProgramEffects) return;
    if (typeof window !== 'undefined' && window.Clerk) {
      const userId = window.Clerk.user?.id || window.Clerk.user?.primaryEmailAddress?.id;
      if (userId) {
        const entry = contract.activeProgramEffects.find(e => e.clerkId === userId);
        setActiveEffects(entry?.effects || null);
      }
    }
  }, [contract]);

  // Sélectionner/désélectionner un programme pour le loadout
  const toggleSelectProgram = (programId, category) => {
    setSelectedPrograms(prev => {
      const exists = prev.find(p => p.programId === programId);
      if (exists) {
        return prev.filter(p => p.programId !== programId);
      } else {
        return [...prev, { programId, category }];
      }
    });
  };

  // Équiper les programmes sélectionnés (batch)
  const handleBatchEquip = async () => {
    setLoadoutLoading(true);
    setLoadoutMessage(null);
    try {
      const response = await fetch(`/api/contrats/${contract._id}/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programs: selectedPrograms })
      });
      if (response.ok) {
        const data = await response.json();
        setLoadoutMessage('Programmes équipés avec succès !');
        setActiveEffects(data.activeEffects);
        setSelectedPrograms([]);
        // Recharger l'inventaire et le contrat
        const [invRes, contractRes] = await Promise.all([
          fetch('/api/player/inventory'),
          fetch(`/api/contrats/${contract._id}`)
        ]);
        if (invRes.ok) {
          const inventory = await invRes.json();
          setPlayerInventory(inventory.detailedInventory || inventory);
        }
        if (contractRes.ok) {
          const updated = await contractRes.json();
          setContract(updated);
        }
      } else {
        const error = await response.text();
        setLoadoutMessage('Erreur : ' + error);
      }
    } catch (err) {
      setLoadoutMessage('Erreur réseau');
    } finally {
      setLoadoutLoading(false);
    }
  };

  // Affichage de la section préparation de mission (loadout)
  const showLoadout = contract.status === 'Assigné' || contract.status === 'Actif';

  // Correction : calculer le niveau de menace si absent ou invalide
  let threatLevel = contract.threatLevel;
  if (!threatLevel || ![1,2,3,4,5].includes(threatLevel)) {
    threatLevel = determineThreatLevelFromSkills(contract.requiredSkills || {});
  }

  // Trie les programmes one-shot selon leur usage
  const oneShotPrograms = (playerInventory?.oneShotPrograms || []).filter(item => item.quantity > 0);
  const revealPrograms = oneShotPrograms.filter(item => item.program?.effects?.reveal_skill === true || ["Logiciel 'Mouchard'", 'Analyseur de Contrat'].includes(item.program?.name));
  const bonusPrograms = oneShotPrograms.filter(item =>
    (item.program?.effects?.skip_skill_check || item.program?.effects?.add_bonus_roll || item.program?.effects?.reduce_difficulty) && !item.program?.effects?.reveal_skill && !["Logiciel 'Mouchard'", 'Analyseur de Contrat'].includes(item.program?.name)
  );

  // Utilisation immédiate d'un programme de révélation
  const [revealLoading, setRevealLoading] = useState(null); // id du programme en cours
  const handleUseRevealProgram = async (item) => {
    setRevealLoading(item.program._id);
    try {
      const response = await fetch(`/api/contrats/${contract._id}/use-program`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId: item.program._id, category: 'one_shot' })
      });
      if (response.ok) {
        setLoadoutMessage('Compétence révélée !');
        // Recharger le contrat et l'inventaire
        const [invRes, contractRes] = await Promise.all([
          fetch('/api/player/inventory'),
          fetch(`/api/contrats/${contract._id}`)
        ]);
        if (invRes.ok) {
          const inventory = await invRes.json();
          setPlayerInventory(inventory.detailedInventory || inventory);
        }
        if (contractRes.ok) {
          const updated = await contractRes.json();
          setContract(updated);
          // Forcer la mise à jour de revealedSkills depuis le contrat rechargé
          if (updated.revealedSkillsByPlayer && typeof window !== 'undefined' && window.Clerk) {
            const userId = window.Clerk.user?.id || window.Clerk.user?.primaryEmailAddress?.id;
            if (userId) {
              const entry = updated.revealedSkillsByPlayer.find(e => e.clerkId === userId);
              setRevealedSkills(entry?.skills || []);
            }
          }
        }
      } else {
        const error = await response.text();
        setLoadoutMessage('Erreur : ' + error);
      }
    } catch (err) {
      setLoadoutMessage('Erreur réseau');
    } finally {
      setRevealLoading(null);
    }
  };

  // Charger les runners disponibles si le contrat n'est pas encore assigné
  useEffect(() => {
    if (contract.status === 'Proposé' || contract.status === 'Assigné') {
      fetch('/api/player/runners')
        .then(res => res.json())
        .then(data => setAvailableRunners(data.runners || []));
    }
  }, [contract.status]);

  const handleAssignRunners = async (assignments) => {
    setAssigning(true);
    setAssignError(null);
    try {
      const response = await fetch(`/api/contrats/${contract._id}/assign-runners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments })
      });
      if (response.ok) {
        const data = await response.json();
        setContract(data.contract);
        setSelectedRunners({}); // Reset selectedRunners to empty object
      } else {
        const error = await response.text();
        setAssignError(error);
      }
    } catch (err) {
      setAssignError('Erreur réseau');
    } finally {
      setAssigning(false);
    }
  };

  // Fonction pour ouvrir la modal de rapport (toujours avec données fraîches)
  const openDebriefing = async () => {
    const res = await fetch(`/api/contrats/${contract._id}`);
    if (res.ok) {
      const updated = await res.json();
      setDebriefingContract(updated);
      setShowDebriefing(true);
    }
  };
  const closeDebriefing = () => {
    setShowDebriefing(false);
    setDebriefingContract(null);
  };

  if (!contract) return <div>Contrat introuvable.</div>;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8" style={{maxWidth: '80rem'}}>
      {/* Header : titre, badges */}
      <header className="w-full max-w-4xl mx-auto flex flex-col gap-2 mb-2" style={{maxWidth: '80rem'}}>
        <h1 className="text-4xl font-extrabold text-cyan-400 drop-shadow-[0_0_8px_#22d3ee] tracking-tight mb-2">{contract.title}</h1>
        <div className="flex flex-wrap gap-2">
          <span className="bg-cyan-900/80 text-cyan-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-cyan-400/40">{contract.status}</span>
          <span className="bg-cyan-800/80 text-cyan-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-cyan-400/40">{contract.missionType}</span>
          <span className="bg-pink-900/80 text-pink-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-pink-400/40">{contract.loreDifficulty}</span>
          {contract.employerFaction && <span className="bg-yellow-900/80 text-yellow-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-yellow-400/40">Employeur : {contract.employerFaction}</span>}
          {contract.targetFaction && <span className="bg-red-900/80 text-red-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-red-400/40">Cible : {contract.targetFaction}</span>}
          {contract.involvedFactions?.length > 0 && (
            <span className="bg-blue-900/80 text-blue-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-400/40">Factions : {contract.involvedFactions.join(', ')}</span>
          )}
        </div>
      </header>

      {/* Menace */}
      <div className="w-full max-w-4xl mx-auto bg-cyan-950/80 rounded-xl shadow-lg p-6 border border-cyan-900/30 flex items-center gap-4 mb-4" style={{maxWidth: '80rem'}}>
        <ThreatLevelInfo threatLevel={threatLevel} showFullDetails={true} />
      </div>

      {/* Description */}
      <div className="w-full max-w-4xl mx-auto bg-white/5 rounded-xl shadow-lg p-6 border border-cyan-900/30 mb-4" style={{maxWidth: '80rem'}}>
        <h2 className="text-xl font-bold text-cyan-300 mb-2">Description du Contrat</h2>
        <Typewriter text={contract.description} speed={10} className="text-cyan-100 whitespace-pre-wrap" />
      </div>

      {/* Récompenses */}
      <div className="w-full max-w-4xl mx-auto bg-white/5 rounded-xl shadow-lg p-6 border border-cyan-900/30 mb-4 flex flex-col sm:flex-row items-center gap-6" style={{maxWidth: '80rem'}}>
        <div className="flex items-center gap-2 text-2xl text-pink-400 font-bold">
          <span aria-label="Eddies" role="img">💰</span>
          {rewardEddies.toLocaleString('en-US')} €$
        </div>
        <div className="flex items-center gap-2 text-xl text-cyan-400 font-bold">
          <span aria-label="Réputation" role="img">⭐</span>
          +{rewardReputation} Réputation
        </div>
      </div>

      {/* Compétences testées */}
      <div className="w-full max-w-4xl mx-auto bg-black/40 rounded-xl shadow-lg p-6 border border-cyan-400/40 mb-4" style={{maxWidth: '80rem'}}>
        <h3 className="text-lg text-cyan-300 font-bold mb-3">Compétences Testées</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {testedSkills.map(({ skill, value }) => {
            const isRevealed = revealedSkills.includes(skill) || allSkillsRevealed;
            return (
              <span key={skill} className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider border transition-all duration-300 ${isRevealed ? 'bg-green-900/80 text-green-300 border-green-400/40' : 'bg-gray-800/80 text-gray-400 border-gray-600/40'}`}>{isRevealed ? (skill === 'hacking' ? '💻 Hacking' : skill === 'stealth' ? '👁️ Infiltration' : '⚔️ Combat') : '❓ Compétence inconnue'}</span>
            );
          })}
        </div>
        <div className="text-xs text-cyan-200 mt-2">
          <strong>Note :</strong> Chaque compétence requiert un runner spécialisé. Les compétences non listées (valeur 0) ne sont pas testées dans cette mission.
        </div>
      </div>

      {/* Effets actifs */}
      {activeEffects && (
        <div className="w-full max-w-4xl mx-auto bg-yellow-900/20 rounded-xl shadow-lg p-6 border border-yellow-400/40 mb-4" style={{maxWidth: '80rem'}}>
          <h3 className="text-lg text-yellow-300 font-bold mb-3">Effets Actifs</h3>
          <ul className="space-y-1 text-yellow-200 text-sm">
            {activeEffects.autoSuccess && (
              <li>• <b>Succès garanti</b> sur le prochain test de compétence</li>
            )}
            {activeEffects.bonusRoll > 0 && (
              <li>• <b>+{activeEffects.bonusRoll}</b> sur le prochain test de <b>{activeEffects.bonusSkill?.toUpperCase()}</b></li>
            )}
            {activeEffects.reduceDifficulty > 0 && (
              <li>• <b>-{activeEffects.reduceDifficulty}</b> à la difficulté de tous les tests</li>
            )}
            {activeEffects.signature && (
              <li>• <b>Programme signature utilisé :</b> {activeEffects.signature}</li>
            )}
          </ul>
        </div>
      )}

      {/* Loadout (onglets modernes) */}
      {showLoadout && (
        <div className="w-full max-w-4xl mx-auto bg-slate-900/80 rounded-xl shadow-lg p-6 border border-cyan-900/30 mb-4" style={{maxWidth: '80rem'}}>
          <h2 className="text-lg font-bold mb-4 text-cyan-200">Préparation de mission : Loadout</h2>
          <div className="flex gap-2 mb-6">
            <button
              className={`px-4 py-2 rounded-t transition-all duration-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/60 ${loadoutTab === 'bonus' ? 'bg-cyan-700 text-white shadow' : 'bg-gray-800 text-gray-300 hover:bg-cyan-900/60'}`}
              onClick={() => setLoadoutTab('bonus')}
              aria-label="Onglet Bonus de mission"
            >
              Bonus de mission
            </button>
            <button
              className={`px-4 py-2 rounded-t transition-all duration-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/60 ${loadoutTab === 'reveal' ? 'bg-cyan-700 text-white shadow' : 'bg-gray-800 text-gray-300 hover:bg-cyan-900/60'}`}
              onClick={() => setLoadoutTab('reveal')}
              aria-label="Onglet Révélation"
            >
              Révélation
            </button>
          </div>
          {loadoutTab === 'bonus' && (
            <>
              <p className="mb-2 text-sm text-cyan-300">Sélectionnez les programmes à bonus pour cette mission. Ils seront consommés lors de la résolution.</p>
              <div className="flex flex-wrap gap-4 mb-4">
                {bonusPrograms.length > 0 ? (
                  bonusPrograms.map(item => (
                    <label key={item.program._id} className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-all duration-200 ${selectedPrograms.find(p => p.programId === item.program._id) ? 'border-cyan-400 bg-cyan-950/80 shadow' : 'border-gray-700 bg-gray-800/80'}`}>
                      <input
                        type="checkbox"
                        checked={!!selectedPrograms.find(p => p.programId === item.program._id)}
                        onChange={() => toggleSelectProgram(item.program._id, 'one_shot')}
                        disabled={item.quantity <= 0 || loadoutLoading}
                        aria-label={`Sélectionner ${item.program.name}`}
                      />
                      <span className="font-mono text-sm">{item.program.name}</span>
                      <span className="text-xs text-gray-400">x{item.quantity}</span>
                    </label>
                  ))
                ) : (
                  <span className="text-gray-500">Aucun programme bonus disponible.</span>
                )}
              </div>
              <button
                className="px-4 py-2 bg-cyan-600 text-white rounded font-bold disabled:opacity-50 transition-all duration-200 shadow hover:bg-cyan-500"
                onClick={handleBatchEquip}
                disabled={selectedPrograms.length === 0 || loadoutLoading}
                aria-label="Équiper pour la mission"
              >
                {loadoutLoading ? 'Équipement...' : 'Équiper pour la mission'}
              </button>
            </>
          )}
          {loadoutTab === 'reveal' && (
            <>
              <p className="mb-2 text-sm text-cyan-300">Utilisez un programme de révélation pour dévoiler une compétence testée immédiatement.</p>
              <div className="flex flex-wrap gap-4 mb-4">
                {revealPrograms.length > 0 ? (
                  revealPrograms.map(item => (
                    <div key={item.program._id} className="flex items-center gap-2 px-3 py-2 rounded border border-gray-700 bg-gray-800/80 shadow">
                      <span className="font-mono text-sm">{item.program.name}</span>
                      <span className="text-xs text-gray-400">x{item.quantity}</span>
                      <button
                        className="ml-2 px-2 py-1 bg-yellow-500 text-black rounded text-xs font-bold disabled:opacity-50 transition-all duration-200 shadow hover:bg-yellow-400"
                        onClick={() => handleUseRevealProgram(item)}
                        disabled={item.quantity <= 0 || revealLoading === item.program._id}
                        aria-label={`Révéler avec ${item.program.name}`}
                      >
                        {revealLoading === item.program._id ? 'Analyse...' : 'Révéler'}
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500">Aucun programme de révélation disponible.</span>
                )}
              </div>
            </>
          )}
          {loadoutMessage && <div className="mt-2 text-sm text-yellow-200">{loadoutMessage}</div>}
        </div>
      )}

      {/* Exemple d'affichage du statut de résolution */}
      {contract.resolution_outcome && (
        <div className={`text-lg font-bold mb-4 ${contract.resolution_outcome === 'Succès' ? 'text-green-400' : 'text-red-400'}`}
          >
          Résultat : {contract.resolution_outcome}
        </div>
      )}

      {/* Bouton pour ouvrir la modal de rapport si le contrat est résolu */}
      {contract.resolution_outcome && (
        <button
          className="px-4 py-2 bg-green-700 text-white rounded font-bold mb-4"
          onClick={openDebriefing}
        >
          Voir le rapport de mission
        </button>
      )}

      {/* Section assignation multi-runners visible en permanence */}
      {(contract.status === 'Proposé' || contract.status === 'Assigné') && (
        <div className="w-full max-w-4xl mx-auto bg-gray-900/80 rounded-xl shadow-lg p-6 border border-cyan-900/30 mb-4">
          <h2 className="text-lg font-bold mb-4 text-cyan-200">Assigner les runners à la mission</h2>
          <p className="mb-2 text-sm text-cyan-300">Cliquez sur une case pour assigner un runner à une compétence.</p>
          <table className="table-auto border-collapse w-full mb-4">
            <thead>
              <tr>
                <th className="px-2 py-1"></th>
                {testedSkills.map(({ skill }) => (
                  <th key={skill} className="px-4 py-2 text-cyan-300 font-bold text-center">
                    {skill === 'hacking' ? '💻 Hacking' : skill === 'stealth' ? '👁️ Infiltration' : '⚔️ Combat'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {availableRunners.map(runner => (
                <tr key={runner._id}>
                  <td className="font-bold px-2 text-cyan-200 text-center">
                    {runner.name}
                    <div className="block text-xs text-gray-400 whitespace-pre font-mono mt-1">
                      {`H:${runner.skills.hacking}\nS:${runner.skills.stealth}\nC:${runner.skills.combat}`}
                    </div>
                  </td>
                  {testedSkills.map(({ skill }) => {
                    const isAssigned = selectedRunners[skill] === runner._id;
                    const isRunnerUsed = Object.values(selectedRunners).includes(runner._id) && !isAssigned;
                    return (
                      <td key={skill} className="text-center">
                        <button
                          className={`px-2 py-1 rounded ${isAssigned ? 'bg-cyan-500 text-white' : isRunnerUsed ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-cyan-200'}`}
                          disabled={isRunnerUsed}
                          onClick={() => setSelectedRunners(prev => ({ ...prev, [skill]: isAssigned ? null : runner._id }))}
                        >
                          {isAssigned ? '✅' : isRunnerUsed ? '—' : 'Assigner'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mb-2 text-sm text-cyan-300 font-bold">
            {Object.keys(selectedRunners).length} / {testedSkills.length} compétences assignées
          </div>
          {assignError && <div className="mb-2 text-sm text-red-400">{assignError}</div>}
          <button
            className="w-full py-3 rounded bg-cyan-600 text-white font-bold text-lg disabled:opacity-50"
            onClick={async () => {
              setAssigning(true);
              setAssignError(null);
              try {
                const assignments = testedSkills.map(({ skill }) => ({ skill, runnerId: selectedRunners[skill] }));
                await handleAssignRunners(assignments);
              } catch (err) {
                setAssignError('Erreur réseau');
              } finally {
                setAssigning(false);
              }
            }}
            disabled={Object.values(selectedRunners).filter(Boolean).length !== testedSkills.length || assigning}
          >
            {assigning ? 'Assignation...' : `Assigner ${testedSkills.length} runner(s)`}
          </button>
        </div>
      )}
      <DebriefingModal
        isOpen={showDebriefing}
        onClose={closeDebriefing}
        contract={debriefingContract}
        reputationInfo={null}
        usedPrograms={[]}
        financialSummary={null}
      />
    </div>
  );
}