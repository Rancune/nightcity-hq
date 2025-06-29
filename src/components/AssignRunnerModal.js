// src/components/AssignRunnerModal.js
'use client';
import { useState } from 'react';
import Typewriter from './Typewriter';

export default function AssignRunnerModal({ isOpen, onClose, runners, onAssign, contract }) {
  const [selectedRunner, setSelectedRunner] = useState(null);
  const [assigning, setAssigning] = useState(false);

  if (!isOpen) return null;

  const availableRunners = runners.filter(r => r.status === 'Disponible');

  const handleAssignRunner = async () => {
    if (!selectedRunner) return;
    
    setAssigning(true);
    try {
      await onAssign(selectedRunner._id);
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
    } finally {
      setAssigning(false);
    }
  };

  const getSkillColor = (skill, value) => {
    if (value >= 8) return 'text-green-400';
    if (value >= 6) return 'text-blue-400';
    if (value >= 4) return 'text-yellow-400';
    return 'text-red-400';
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 p-6 rounded-lg border border-[--color-neon-cyan] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl text-[--color-neon-cyan] font-bold">
              🎯 Assigner un Netrunner
            </h3>
            <p className="text-[--color-text-secondary] mt-1">
              Sélectionne un agent disponible pour cette mission
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Informations du contrat */}
        {contract && (
          <div className="mb-6 p-4 bg-black/20 rounded border border-[--color-border-dark]">
            <h4 className="text-lg text-[--color-text-primary] font-bold mb-2">
              Mission: {contract.title}
            </h4>
            <p className="text-sm text-[--color-text-secondary] mb-2">
              <Typewriter text={contract.description} speed={10} />
            </p>
            <div className="flex gap-4 text-sm">
              <div className="text-[--color-neon-pink] font-bold">
                Récompense: {contract.reward?.eddies?.toLocaleString('en-US')} €$
              </div>
              <div className="text-[--color-neon-cyan]">
                +{contract.reward?.reputation} PR
              </div>
            </div>
          </div>
        )}

        {/* Runners disponibles */}
        <div className="mb-6">
          <h4 className="text-lg text-[--color-text-primary] font-bold mb-4">
            Agents Disponibles ({availableRunners.length})
          </h4>
          
          {availableRunners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {availableRunners.map((runner, index) => {
                const isSelected = selectedRunner?._id === runner._id;
                return (
                  <div 
                    key={index}
                    onClick={() => setSelectedRunner(runner)}
                    className={`bg-white/5 p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-[--color-neon-cyan] bg-[--color-neon-cyan]/10' 
                        : 'border-[--color-border-dark] hover:border-[--color-neon-cyan]/50'
                    }`}
                  >
                    {/* En-tête du runner */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="text-lg text-[--color-text-primary] font-bold">
                          {runner.name}
                        </h5>
                        <p className="text-xs text-[--color-text-secondary]">
                          Agent #{runner._id.slice(-4)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${runner.status === 'Disponible' ? 'text-green-400' : 'text-red-400'}`}>
                          {runner.status}
                        </div>
                        <div className="text-xs text-[--color-text-secondary]">
                          Commission: {runner.commission}%
                        </div>
                      </div>
                    </div>

                    {/* Compétences */}
                    <div className="mb-3">
                      <p className="text-xs text-[--color-text-secondary] mb-2">Compétences:</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className={`text-center p-2 rounded bg-black/30 ${getSkillColor('hacking', runner.skills.hacking)}`}>
                          <div className="text-xs font-bold">HACK</div>
                          <div className="text-lg font-bold">{runner.skills.hacking}</div>
                        </div>
                        <div className={`text-center p-2 rounded bg-black/30 ${getSkillColor('stealth', runner.skills.stealth)}`}>
                          <div className="text-xs font-bold">STEALTH</div>
                          <div className="text-lg font-bold">{runner.skills.stealth}</div>
                        </div>
                        <div className={`text-center p-2 rounded bg-black/30 ${getSkillColor('combat', runner.skills.combat)}`}>
                          <div className="text-xs font-bold">COMBAT</div>
                          <div className="text-lg font-bold">{runner.skills.combat}</div>
                        </div>
                      </div>
                    </div>

                    {/* Implants installés */}
                    {runner.installedImplants && runner.installedImplants.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-[--color-text-secondary] mb-1">Implants ({runner.installedImplants.length}):</p>
                        <div className="space-y-1">
                          {runner.installedImplants.slice(0, 2).map((implant, idx) => (
                            <div key={idx} className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded">
                              <div className="flex items-center gap-1">
                                <span>✓</span>
                                <span className="font-medium">{implant.program?.name || 'Implant'}</span>
                                {implant.program?.rarity && (
                                  <span className={`text-xs ${getRarityColor(implant.program.rarity)}`}>
                                    [{implant.program.rarity.toUpperCase()}]
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                          {runner.installedImplants.length > 2 && (
                            <div className="text-xs text-[--color-text-secondary]">
                              +{runner.installedImplants.length - 2} autres...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Statistiques */}
                    <div className="text-xs text-[--color-text-secondary]">
                      <div className="flex justify-between">
                        <span>Missions réussies:</span>
                        <span className="text-green-400">{runner.stats?.successfulMissions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Missions échouées:</span>
                        <span className="text-red-400">{runner.stats?.failedMissions || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">😵</div>
              <p className="text-[--color-text-secondary]">
                Aucun agent disponible.
              </p>
              <p className="text-[--color-text-secondary] text-sm mt-1">
                Tous vos runners sont en mission ou grillés.
              </p>
            </div>
          )}
        </div>

        {/* Résumé de la sélection */}
        {selectedRunner && (
          <div className="bg-[--color-neon-cyan]/10 border border-[--color-neon-cyan]/30 rounded-lg p-4 mb-6">
            <h4 className="text-[--color-neon-cyan] font-bold mb-2">
              Agent sélectionné: {selectedRunner.name}
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-[--color-text-secondary]">Hacking:</span>
                <span className={`ml-2 font-bold ${getSkillColor('hacking', selectedRunner.skills.hacking)}`}>
                  {selectedRunner.skills.hacking}
                </span>
              </div>
              <div>
                <span className="text-[--color-text-secondary]">Stealth:</span>
                <span className={`ml-2 font-bold ${getSkillColor('stealth', selectedRunner.skills.stealth)}`}>
                  {selectedRunner.skills.stealth}
                </span>
              </div>
              <div>
                <span className="text-[--color-text-secondary]">Combat:</span>
                <span className={`ml-2 font-bold ${getSkillColor('combat', selectedRunner.skills.combat)}`}>
                  {selectedRunner.skills.combat}
                </span>
              </div>
            </div>
            {selectedRunner.installedImplants && selectedRunner.installedImplants.length > 0 && (
              <div className="mt-2 text-sm text-green-400">
                {selectedRunner.installedImplants.length} implant(s) actif(s)
              </div>
            )}
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleAssignRunner}
            disabled={!selectedRunner || assigning}
            className="px-6 py-2 bg-[--color-neon-cyan] text-background font-bold rounded hover:bg-white hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assigning ? 'ASSIGNATION...' : `Assigner ${selectedRunner ? selectedRunner.name : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}