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
  const [expandedSkill, setExpandedSkill] = useState(null); // Pour afficher/masquer la liste des runners

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
      console.log(`[FRONTEND DEBUG] Utilisation du programme ${program.program.name} (${category})`);
      
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
        console.log(`[FRONTEND DEBUG] Réponse de l'API use-program:`, data);
        console.log(`[FRONTEND DEBUG] skill reçu:`, data.skill);
        console.log(`[FRONTEND DEBUG] activeEffects reçus:`, data.activeEffects);
        
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
          // Ne pas appliquer les bonus si le programme est utilisé pour révéler une compétence
          if (data.effects.add_bonus_roll && !data.effects.reveal_skill && !data.effects.reveal_all_skills) {
            console.log(`[FRONTEND DEBUG] Application du bonus +${data.effects.add_bonus_roll} à ${data.skill}`);
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
          console.log(`[FRONTEND DEBUG] Contrat rechargé après use-program:`, updated.activeProgramEffects);
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
        console.log(`[FRONTEND DEBUG] Effets actifs trouvés pour l'utilisateur ${userId}:`, entry?.effects);
        console.log(`[FRONTEND DEBUG] skillBonuses dans les effets:`, entry?.effects?.skillBonuses);
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
      console.log(`[FRONTEND DEBUG] Équipement de ${selectedPrograms.length} programmes:`, selectedPrograms);
      
      const response = await fetch(`/api/contrats/${contract._id}/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programs: selectedPrograms })
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`[FRONTEND DEBUG] Réponse de l'API prepare:`, data);
        console.log(`[FRONTEND DEBUG] activeEffects reçus:`, data.activeEffects);
        console.log(`[FRONTEND DEBUG] skillBonuses reçus:`, data.activeEffects?.skillBonuses);
        
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
          console.log(`[FRONTEND DEBUG] Contrat rechargé - activeProgramEffects:`, updated.activeProgramEffects);
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
  // MODIFICATION: Permettre les tests de debug sur tous les contrats
  const showLoadout = true; // contract.status === 'Assigné' || contract.status === 'Actif';

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

  // Debug logs pour les programmes disponibles
  useEffect(() => {
    console.log(`[FRONTEND DEBUG] Statut du contrat: ${contract.status}`);
    console.log(`[FRONTEND DEBUG] Programmes one-shot disponibles:`, oneShotPrograms.length);
    console.log(`[FRONTEND DEBUG] Programmes bonus disponibles:`, bonusPrograms.length);
    console.log(`[FRONTEND DEBUG] Programmes de révélation disponibles:`, revealPrograms.length);
    
    if (bonusPrograms.length > 0) {
      console.log(`[FRONTEND DEBUG] Détail des programmes bonus:`);
      bonusPrograms.forEach(item => {
        console.log(`   - ${item.program.name}: +${item.program.effects.add_bonus_roll} (skill: ${item.program.effects.skill || 'non spécifié'})`);
      });
    }
  }, [contract.status, oneShotPrograms, bonusPrograms, revealPrograms]);

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

      {/* Effets actifs - NOUVEAU DESIGN */}
      {activeEffects && (
        <div className="w-full max-w-4xl mx-auto bg-gradient-to-r from-cyan-900/20 to-purple-900/20 rounded-xl shadow-lg p-6 border border-cyan-400/40 mb-4" style={{maxWidth: '80rem'}}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-sm">⚡</span>
            </div>
            <h3 className="text-lg font-bold text-cyan-300">Effets Actifs sur cette Mission</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bonus de compétences */}
            {activeEffects.skillBonuses && Object.keys(activeEffects.skillBonuses).length > 0 && (
              <div className="bg-green-900/30 rounded-lg p-4 border border-green-400/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-400 text-lg">🎯</span>
                  <h4 className="font-bold text-green-300">Bonus de Compétence</h4>
                </div>
                <div className="space-y-2">
                  {Object.entries(activeEffects.skillBonuses)
                    .filter(([_, bonus]) => bonus > 0)
                    .map(([skill, bonus]) => (
                      <div key={skill} className="flex items-center gap-2">
                        <span className="text-green-200 font-mono">+{bonus}</span>
                        <span className="text-green-100">à la compétence</span>
                        <span className="px-2 py-1 bg-green-800/50 rounded text-xs font-bold text-green-200">
                          {skill === 'hacking' ? '💻 Hacking' : 
                           skill === 'stealth' ? '👁️ Infiltration' : 
                           skill === 'combat' ? '⚔️ Combat' : 
                           skill.toUpperCase()}
                        </span>
                      </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ancien format pour compatibilité */}
            {activeEffects.bonusRoll > 0 && !activeEffects.skillBonuses && (
              <div className="bg-green-900/30 rounded-lg p-4 border border-green-400/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-400 text-lg">🎯</span>
                  <h4 className="font-bold text-green-300">Bonus de Compétence</h4>
                </div>
                <div className="space-y-2">
                  {activeEffects.bonusSkill === 'all' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-green-200 font-mono">+{activeEffects.bonusRoll}</span>
                      <span className="text-green-100">à TOUTES les compétences testées</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-green-200 font-mono">+{activeEffects.bonusRoll}</span>
                      <span className="text-green-100">à la compétence</span>
                      <span className="px-2 py-1 bg-green-800/50 rounded text-xs font-bold text-green-200">
                        {activeEffects.bonusSkill === 'hacking' ? '💻 Hacking' : 
                         activeEffects.bonusSkill === 'stealth' ? '👁️ Infiltration' : 
                         activeEffects.bonusSkill === 'combat' ? '⚔️ Combat' : 
                         activeEffects.bonusSkill?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Réduction de difficulté */}
            {activeEffects.reduceDifficulty > 0 && (
              <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-400/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-400 text-lg">🛡️</span>
                  <h4 className="font-bold text-blue-300">Réduction de Difficulté</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-200 font-mono">-{activeEffects.reduceDifficulty}</span>
                  <span className="text-blue-100">à la difficulté de tous les tests</span>
                </div>
              </div>
            )}

            {/* Succès automatique */}
            {activeEffects.autoSuccess && (
              <div className="bg-yellow-900/30 rounded-lg p-4 border border-yellow-400/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-400 text-lg">⭐</span>
                  <h4 className="font-bold text-yellow-300">Succès Garanti</h4>
                </div>
                <p className="text-yellow-200 text-sm">
                  Le test de compétence le plus difficile sera automatiquement réussi
                </p>
              </div>
            )}

            {/* Programme signature */}
            {activeEffects.signature && (
              <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-400/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-purple-400 text-lg">👑</span>
                  <h4 className="font-bold text-purple-300">Programme Signature</h4>
                </div>
                <p className="text-purple-200 font-mono text-sm">
                  {activeEffects.signature}
                </p>
              </div>
            )}
          </div>

          {/* Résumé des effets */}
          <div className="mt-4 p-3 bg-black/20 rounded-lg border border-cyan-400/20">
            <p className="text-cyan-200 text-sm">
              <strong>Note :</strong> Ces effets seront appliqués lors de la résolution de la mission. 
              Les bonus de compétence s'appliquent uniquement aux tests correspondants.
            </p>
          </div>
        </div>
      )}

      {/* Loadout (onglets modernes) */}
      {showLoadout && (
        <div className="w-full max-w-4xl mx-auto bg-slate-900/80 rounded-xl shadow-lg p-6 border border-cyan-900/30 mb-4" style={{maxWidth: '80rem'}}>
          <h2 className="text-lg font-bold mb-4 text-cyan-200">Préparation de mission : Loadout</h2>
          
          {/* Debug info pour tous les contrats */}
          <div className="mb-4 p-3 bg-yellow-900/30 rounded border border-yellow-400/40">
            <p className="text-yellow-200 text-sm">
              <strong>Debug Mode:</strong> Tests autorisés sur tous les contrats (statut: {contract.status})
            </p>
          </div>
          
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

      {/* Section assignation multi-runners - NOUVEAU DESIGN */}
      {(contract.status === 'Proposé' || contract.status === 'Assigné') && (
        <div className="w-full max-w-4xl mx-auto bg-gradient-to-r from-slate-900/90 to-gray-900/90 rounded-xl shadow-lg p-6 border border-cyan-900/30 mb-4" style={{maxWidth: '80rem'}}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-lg">👥</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-cyan-200">Équipe de Mission</h2>
              <p className="text-sm text-cyan-300">Assemblez votre équipe de runners pour cette mission</p>
            </div>
          </div>

          {/* Compétences requises avec assignation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {testedSkills.map(({ skill, value }) => {
              const assignedRunnerId = selectedRunners[skill];
              const assignedRunner = availableRunners.find(r => r._id === assignedRunnerId);
              const isRevealed = revealedSkills.includes(skill) || allSkillsRevealed;
              
              return (
                <div key={skill} className="bg-black/40 rounded-lg p-4 border border-cyan-400/30 hover:border-cyan-400/60 transition-all duration-200">
                  {/* En-tête de la compétence */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {isRevealed ? (
                          skill === 'hacking' ? '💻' : skill === 'stealth' ? '👁️' : '⚔️'
                        ) : '❓'}
                      </span>
                      <div>
                        <h3 className="font-bold text-cyan-200">
                          {isRevealed ? (
                            skill === 'hacking' ? 'Hacking' : 
                            skill === 'stealth' ? 'Infiltration' : 'Combat'
                          ) : 'Compétence inconnue'}
                        </h3>
                        {isRevealed && (
                          <p className="text-xs text-cyan-300">
                            Difficulté: {value}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                    </div>
                  </div>

                  {/* Runner assigné ou sélection */}
                  {assignedRunner ? (
                    <div className="bg-green-900/30 rounded-lg p-3 border border-green-400/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-green-200">{assignedRunner.name}</span>
                        <button
                          onClick={() => setSelectedRunners(prev => ({ ...prev, [skill]: null }))}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="text-cyan-300">H</div>
                          <div className="font-bold text-cyan-200">{assignedRunner.skills.hacking}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-cyan-300">S</div>
                          <div className="font-bold text-cyan-200">{assignedRunner.skills.stealth}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-cyan-300">C</div>
                          <div className="font-bold text-cyan-200">{assignedRunner.skills.combat}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <span className="text-xs text-green-300 font-bold">
                          Performance: {Math.round((assignedRunner.skills[skill] / value) * 100)}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setExpandedSkill(expandedSkill === skill ? null : skill)}
                      className="w-full bg-gray-800/50 hover:bg-cyan-900/30 rounded-lg p-3 border border-gray-600/40 hover:border-cyan-400/40 min-h-[80px] flex items-center justify-center transition-all duration-200"
                    >
                      <div className="text-center">
                        <div className="text-gray-400 text-lg mb-1">➕</div>
                        <p className="text-xs text-gray-400">
                          {expandedSkill === skill ? 'Masquer les runners' : 'Sélectionner un runner'}
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Liste des runners disponibles pour cette compétence */}
                  {!assignedRunner && expandedSkill === skill && (
                    <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                      {availableRunners
                        .filter(runner => !Object.values(selectedRunners).includes(runner._id) || selectedRunners[skill] === runner._id)
                        .map(runner => (
                          <button
                            key={runner._id}
                            onClick={() => {
                              setSelectedRunners(prev => ({ ...prev, [skill]: runner._id }));
                              setExpandedSkill(null); // Fermer la liste après sélection
                            }}
                            className="w-full bg-gray-800/50 hover:bg-cyan-900/30 rounded p-2 text-left transition-all duration-200 border border-gray-600/40 hover:border-cyan-400/40"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-cyan-200 text-sm">{runner.name}</span>
                              <span className="text-xs text-cyan-300 font-bold">
                                {runner.skills[skill]}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Performance: {Math.round((runner.skills[skill] / value) * 100)}%
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Résumé et bouton d'assignation */}
          <div className="bg-black/30 rounded-lg p-4 border border-cyan-400/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-300">📊</span>
                  <span className="text-cyan-200 font-bold">
                    {Object.values(selectedRunners).filter(Boolean).length} / {testedSkills.length} compétences assignées
                  </span>
                </div>
                {Object.values(selectedRunners).filter(Boolean).length === testedSkills.length && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    <span className="text-green-300 text-sm font-bold">Équipe complète</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-cyan-300">Runners disponibles</div>
                <div className="text-cyan-200 font-bold">
                  {availableRunners.length - Object.values(selectedRunners).filter(Boolean).length}
                </div>
              </div>
            </div>

            {assignError && (
              <div className="mb-4 p-3 bg-red-900/30 rounded-lg border border-red-400/40">
                <div className="flex items-center gap-2">
                  <span className="text-red-400">⚠️</span>
                  <span className="text-red-200 text-sm">{assignError}</span>
                </div>
              </div>
            )}

            <button
              className="w-full py-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
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
              {assigning ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Assignation en cours...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>🚀</span>
                  <span>Lancer la mission avec {testedSkills.length} runner(s)</span>
                </div>
              )}
            </button>
          </div>
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