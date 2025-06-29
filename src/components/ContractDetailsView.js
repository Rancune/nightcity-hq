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

  // Effets actifs du joueur sur ce contrat
  let activeEffects = null;
  if (contract.activeProgramEffects && typeof window !== 'undefined' && window.Clerk) {
    const userId = window.Clerk.user?.id || window.Clerk.user?.primaryEmailAddress?.id;
    activeEffects = contract.activeProgramEffects.find(e => e.clerkId === userId)?.effects || null;
  }

  // Correction : calculer le niveau de menace si absent ou invalide
  let threatLevel = contract.threatLevel;
  if (!threatLevel || ![1,2,3,4,5].includes(threatLevel)) {
    threatLevel = determineThreatLevelFromSkills(contract.requiredSkills || {});
  }

  if (!contract) return <div>Contrat introuvable.</div>;

  return (
    <main className="min-h-screen p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-4xl text-[--color-neon-cyan] font-bold">{contract.title}</h1>
            <ThreatLevelBadge threatLevel={threatLevel} showDetails={true} />
          </div>
          <p className="text-[--color-text-secondary]">Statut : {contract.status}</p>
          <div className="flex flex-wrap gap-4 mt-2">
            <span className="bg-black/60 px-3 py-1 rounded text-xs text-[--color-neon-cyan] border border-[--color-neon-cyan]">Type de mission : <b>{contract.missionType}</b></span>
            <span className="bg-black/60 px-3 py-1 rounded text-xs text-[--color-neon-pink] border border-[--color-neon-pink]">Difficulté : <b>{contract.loreDifficulty}</b></span>
            {contract.employerFaction && <span className="bg-black/60 px-3 py-1 rounded text-xs text-yellow-400 border border-yellow-400">Employeur : {contract.employerFaction}</span>}
            {contract.targetFaction && <span className="bg-black/60 px-3 py-1 rounded text-xs text-red-400 border border-red-400">Cible : {contract.targetFaction}</span>}
            {contract.involvedFactions?.length > 0 && (
              <span className="bg-black/60 px-3 py-1 rounded text-xs text-blue-400 border border-blue-400">Factions impliquées : {contract.involvedFactions.join(', ')}</span>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale du contrat */}
          <div className="lg:col-span-2">
            {/* Informations sur le niveau de menace */}
            <div className="mb-6">
              <ThreatLevelInfo threatLevel={threatLevel} showFullDetails={true} />
            </div>

            <div className="bg-white/5 p-6 rounded-lg mb-6">
              <h2 className="text-2xl text-[--color-text-primary] mb-4">Description du Contrat</h2>
              <Typewriter text={contract.description} speed={10} className="text-neon-vert whitespace-pre-wrap" />
            </div>

            <div className="bg-white/5 p-6 rounded-lg mb-6">
              <h2 className="text-2xl text-[--color-text-primary] mb-4">Récompenses</h2>
              <div className="flex gap-8 items-center">
                <span className="text-2xl text-[--color-neon-pink] font-bold">
                  {rewardEddies.toLocaleString('en-US')} €$
                </span>
                <span className="text-xl text-[--color-neon-cyan] font-bold">+{rewardReputation} Réputation</span>
              </div>
            </div>

            {/* Compétences requises avec le nouveau composant */}
            <div className="bg-black/40 p-6 rounded-lg border border-[--color-neon-cyan] mb-6">
              <h3 className="text-lg text-[--color-neon-cyan] font-bold mb-3">Compétences Testées</h3>
              
              {/* Compétences cachées par défaut */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[--color-text-secondary]">Équipe requise:</span>
                  <span className="text-xs text-[--color-neon-cyan] font-semibold">
                    {Object.values(contract.requiredSkills || {}).filter(skill => skill > 0).length} runner{Object.values(contract.requiredSkills || {}).filter(skill => skill > 0).length > 1 ? 's' : ''}
                  </span>
                </div>
                
                {/* Compétences non révélées (cachées) */}
                <div className="space-y-2">
                  {testedSkills.map(({ skill, value }) => {
                    const isRevealed = revealedSkills.includes(skill) || allSkillsRevealed;
                    return (
                      <div
                        key={skill}
                        ref={el => { if (isRevealed) revealedRefs.current[skill] = el; }}
                        className={`p-3 rounded border transition-all duration-700 ease-out
                          ${isRevealed ? 'bg-green-400/20 border-green-400/50 animate-fadein-slide' : 'bg-black/30 border-[--color-border-dark]'}
                          ${lastRevealed === skill ? 'ring-4 ring-yellow-400/60' : ''}`}
                        style={{
                          opacity: isRevealed ? 1 : 0.7,
                          transform: lastRevealed === skill ? 'scale(1.05)' : 'none',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {isRevealed ? (skill === 'hacking' ? '💻' : skill === 'stealth' ? '👁️' : '⚔️') : '❓'}
                            </span>
                            <span className={`font-semibold ${isRevealed ? 'text-green-400' : 'text-[--color-text-secondary]'}`}>
                              {isRevealed ? (skill === 'hacking' ? 'Hacking' : skill === 'stealth' ? 'Infiltration' : 'Combat') : 'Compétence inconnue'}
                            </span>
                          </div>
                          <div className="text-right">
                            {isRevealed ? (
                              <span className="text-lg font-bold text-green-400">{value}</span>
                            ) : (
                              <span className="text-lg font-bold text-gray-500 tracking-widest">???</span>
                            )}
                          </div>
                        </div>
                        {isRevealed && (
                          <p className="text-xs text-green-300 mt-1">
                            {skill === 'hacking' ? 'Piratage de systèmes, contournement d\'ICE, extraction de données' :
                             skill === 'stealth' ? 'Discrétion, évitement des gardes, passage inaperçu' :
                             'Tir de précision, neutralisation d\'ennemis, survie'}
                          </p>
                        )}
                        {isRevealed && (
                          <span className="inline-block mt-2 text-xs text-green-400 font-bold bg-green-400/20 px-2 py-1 rounded">
                            Révélé
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Informations sur l'équipe */}
              <div className="mt-4 p-3 bg-black/20 rounded border border-[--color-border-dark]">
                <p className="text-xs text-[--color-text-secondary] mb-2">
                  <strong>Note:</strong> Chaque compétence requiert un runner spécialisé. 
                  {Object.values(contract.requiredSkills || {}).filter(skill => skill > 0).length === 1 ? 
                    ' Cette mission peut être accomplie par un seul agent.' :
                    Object.values(contract.requiredSkills || {}).filter(skill => skill > 0).length === 2 ?
                    ' Cette mission nécessite une équipe de deux agents.' :
                    ' Cette mission nécessite une équipe complète de trois agents.'
                  }
                </p>
                <p className="text-xs text-[--color-text-secondary]">
                  Les compétences non listées (valeur 0) ne sont pas testées dans cette mission.
                </p>
              </div>
              
              {canUseMouchard && (
                <div className="mt-4">
                  <ButtonWithLoading
                    onClick={handleUseMouchard}
                    isLoading={mouchardLoading}
                    loadingText="Analyse..."
                    className="bg-yellow-500 text-black font-bold py-2 px-4 rounded hover:bg-yellow-400 transition-all"
                  >
                    Utiliser un Mouchard pour révéler une compétence
                  </ButtonWithLoading>
                  <p className="text-xs text-yellow-300 mt-2">Révèle la compétence testée la plus facile. {mouchard?.quantity || 0} restant(s).</p>
                </div>
              )}
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

            {/* Effets actifs */}
            {activeEffects && (
              <div className="bg-yellow-900/20 p-6 rounded-lg border border-yellow-400 mb-6">
                <h3 className="text-lg text-yellow-400 font-bold mb-3">Effets Actifs</h3>
                <ul className="space-y-1 text-yellow-200 text-sm">
                  {activeEffects.autoSuccess && (
                    <li>• <b>Succès garanti</b> sur le prochain test de compétence (Brise-Glace, Zero Day, Blackwall...)</li>
                  )}
                  {activeEffects.bonusRoll > 0 && (
                    <li>• <b>+{activeEffects.bonusRoll}</b> sur le prochain test de <b>{activeEffects.bonusSkill?.toUpperCase()}</b> (Sandevistan, Blackwall...)</li>
                  )}
                  {activeEffects.reduceDifficulty > 0 && (
                    <li>• <b>-{activeEffects.reduceDifficulty}</b> à la difficulté de tous les tests (Décharge IEM, Blackwall...)</li>
                  )}
                  {activeEffects.signature && (
                    <li>• <b>Programme signature utilisé :</b> {activeEffects.signature}</li>
                  )}
                </ul>
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
                        {playerInventory.oneShotPrograms
                          .filter(item => canUseProgram(item.program?.name, contract.status))
                          .map((item, index) => (
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
                                  : 'bg-[--color-neon-cyan] text-background hover:bg-white hover:text-background'
                              }`}
                            >
                              {usedPrograms.includes(item.program._id) ? 'Utilisé' : 'Utiliser'}
                            </ButtonWithLoading>
                          </div>
                        ))}
                      </div>
                      {playerInventory.oneShotPrograms.filter(item => !canUseProgram(item.program?.name, contract.status)).length > 0 && (
                        <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-600">
                          <p className="text-xs text-gray-400">
                            Certains programmes ne sont disponibles que sur des contrats assignés.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Informations */}
                  {(playerInventory.purchasedInformation?.length || 0) > 0 && (
                    <div>
                      <h3 className="text-lg text-[--color-text-primary] font-bold mb-3 flex items-center gap-2">
                        <span>💾</span>
                        Informations
                      </h3>
                      <div className="space-y-2">
                        {playerInventory.purchasedInformation
                          .filter(info => canUseProgram(info.program?.name, contract.status))
                          .map((info, index) => (
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
                                  : 'bg-[--color-neon-cyan] text-background hover:bg-white hover:text-background'
                              }`}
                            >
                              {usedPrograms.includes(info.program._id) ? 'Utilisé' : 'Utiliser'}
                            </ButtonWithLoading>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Implants */}
                  {(playerInventory.implants?.length || 0) > 0 && (
                    <div>
                      <h3 className="text-lg text-[--color-text-primary] font-bold mb-3 flex items-center gap-2">
                        <span>🔧</span>
                        Implants
                      </h3>
                      <div className="space-y-2">
                        {playerInventory.implants
                          .filter(implant => canUseProgram(implant.program?.name, contract.status))
                          .map((implant, index) => (
                          <div key={index} className="bg-white/5 p-3 rounded border border-[--color-border-dark] hover:bg-white/10 transition-all">
                            <div className="mb-2">
                              <span className="text-[--color-text-primary] text-sm font-medium">
                                {implant.program?.name || 'Implant inconnu'}
                              </span>
                            </div>
                            <p className="text-xs text-[--color-text-secondary] mb-3 line-clamp-2">
                              {implant.program?.description}
                            </p>
                            <ButtonWithLoading
                              onClick={() => handleUseProgram(implant, 'implant')}
                              isLoading={loading}
                              loadingText="INSTALLATION..."
                              disabled={usedPrograms.includes(implant.program._id)}
                              className={`w-full text-xs font-bold py-2 px-3 rounded transition-all ${
                                usedPrograms.includes(implant.program._id)
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  : 'bg-[--color-neon-cyan] text-background hover:bg-white hover:text-background'
                              }`}
                            >
                              {usedPrograms.includes(implant.program._id) ? 'Installé' : 'Installer'}
                            </ButtonWithLoading>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[--color-text-secondary]">Chargement de l&apos;inventaire...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}