// src/components/AssignRunnerModal.js
'use client';
import { useState } from 'react';
import Typewriter from './Typewriter';
import { useEffect } from 'react';

export default function AssignRunnerModal({ isOpen, onClose, runners, onAssign, contract, onAssigned }) {
  const [assignments, setAssignments] = useState({}); // { skill: runnerId }
  const [assigning, setAssigning] = useState(false);

  if (!isOpen) return null;

  const availableRunners = runners.filter(r => r.status === 'Disponible');
  const requiredSkills = Object.entries(contract?.requiredSkills || {}).filter(([_, v]) => v > 0).map(([k]) => k);

  // Utiliser les compétences révélées si elles existent, sinon générer des placeholders anonymes
  let assignSkills = [];
  if (contract?.userRevealedSkills && contract.userRevealedSkills.length > 0) {
    assignSkills = contract.userRevealedSkills;
  } else {
    // Générer des placeholders anonymes pour chaque compétence testée
    assignSkills = requiredSkills.map((_, i) => `unknown_${i + 1}`);
  }

  // Empêcher qu'un runner soit assigné à plusieurs skills
  const getAvailableForSkill = (skill) => {
    const usedRunnerIds = Object.entries(assignments)
      .filter(([s, _]) => s !== skill)
      .map(([_, id]) => id)
      .filter(Boolean);
    return availableRunners.filter(r => !usedRunnerIds.includes(r._id) || assignments[skill] === r._id);
  };

  const handleAssign = (skill, runnerId) => {
    setAssignments(prev => ({ ...prev, [skill]: runnerId }));
  };

  const handleAssignRunners = async () => {
    if (Object.keys(assignments).length !== assignSkills.length) return;
    setAssigning(true);
    try {
      await fetch(`/api/contrats/${contract._id}/assign-runners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments: assignSkills.map(skill => ({ skill, runnerId: assignments[skill] })) })
      });
      onClose();
      if (onAssigned) onAssigned();
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
    } finally {
      setAssigning(false);
    }
  };

  const getSkillLabel = (skill) => {
    if (skill === 'hacking') return '💻 Hacking';
    if (skill === 'stealth') return '👁️ Infiltration';
    if (skill === 'combat') return '⚔️ Combat';
    return skill;
  };

  // Fonction pour afficher le label (nom réel ou placeholder)
  const getSkillLabelMasked = (skill, idx) => {
    if (skill.startsWith('unknown_')) {
      return <span className="flex items-center gap-2"><span role="img" aria-label="hidden">❓</span> <span className="italic text-gray-400">Compétence inconnue #{idx + 1}</span></span>;
    }
    if (contract?.userRevealedSkills && !contract.userRevealedSkills.includes(skill)) {
      return <span className="flex items-center gap-2"><span role="img" aria-label="hidden">❓</span> <span className="italic text-gray-400">Compétence non révélée</span></span>;
    }
    return getSkillLabel(skill);
  };

  const getRunnerSkillsSummary = (runner) => (
    <span className="block text-xs text-gray-400 whitespace-pre font-mono">
      {`H:${runner.skills.hacking}\nS:${runner.skills.stealth}\nC:${runner.skills.combat}`}
    </span>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 p-6 rounded-lg border border-[--color-neon-cyan] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl text-[--color-neon-cyan] font-bold">
              🎯 Assigner les Netrunners
            </h3>
            <p className="text-[--color-text-secondary] mt-1">
              Sélectionnez un agent pour chaque compétence requise
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
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

        {/* Sélection par compétence */}
        <div className="space-y-4 mb-6">
          {assignSkills.map((skill, idx) => (
            <div key={skill} className="flex items-center gap-4">
              <span className="w-48 font-bold">{getSkillLabelMasked(skill, idx)}</span>
              <select
                className="p-2 rounded border text-base bg-gray-800 text-cyan-200 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all min-w-[260px]"
                value={assignments[skill] || ''}
                onChange={e => handleAssign(skill, e.target.value)}
              >
                <option value="" className="text-gray-400 bg-gray-900">Choisir un runner</option>
                {getAvailableForSkill(skill).map(runner => (
                  <option key={runner._id} value={runner._id} className="text-cyan-300 bg-gray-900 font-semibold">
                    {runner.name}  —  H:{runner.skills.hacking} S:{runner.skills.stealth} C:{runner.skills.combat}
                  </option>
                ))}
              </select>
              {/* Résumé vertical sous le select */}
              {assignments[skill] && (
                <div className="ml-2">{getRunnerSkillsSummary(availableRunners.find(r => r._id === assignments[skill]))}</div>
              )}
            </div>
          ))}
        </div>
        <button
          className="w-full py-3 rounded bg-cyan-600 text-white font-bold text-lg disabled:opacity-50"
          onClick={handleAssignRunners}
          disabled={Object.keys(assignments).length !== assignSkills.length || assigning}
        >
          {assigning ? 'Assignation...' : `Assigner ${assignSkills.length} runner(s)`}
        </button>
      </div>
    </div>
  );
}