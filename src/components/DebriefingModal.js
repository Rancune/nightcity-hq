// src/components/DebriefingModal.js
'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Typewriter from './Typewriter';

export default function DebriefingModal({ isOpen, onClose, contract, reputationInfo, usedPrograms, financialSummary }) {
  // S'il n'y a pas de contrat, on n'affiche rien.
  if (!contract) return null;

  const isSuccess = contract.resolution_outcome === 'Succès';
  
  // Utiliser les données de l'API si disponibles, sinon calculer
  const commission = financialSummary?.commission || contract.assignedRunner?.fixerCommission || 20;
  const totalReward = financialSummary?.totalReward || contract.reward?.eddies || 0;
  const fixerShare = financialSummary?.fixerShare || Math.round(totalReward * (commission / 100));
  const runnerShare = financialSummary?.runnerShare || (totalReward - fixerShare);
  const totalProgramCost = financialSummary?.totalProgramCost || 0;
  const netGains = financialSummary?.netGains || (isSuccess ? fixerShare - totalProgramCost : -totalProgramCost);
  
  // Utiliser les programmes de l'API ou une liste vide
  const programCosts = usedPrograms || [];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Dialog.Panel className={`w-full max-w-2xl transform overflow-hidden rounded-lg bg-background p-6 text-left align-middle shadow-xl transition-all border-2 ${isSuccess ? 'border-neon-cyan' : 'border-neon-pink'}`}>
              <Dialog.Title as="h3" className={`text-2xl font-bold leading-6 ${isSuccess ? 'text-neon-cyan' : 'text-neon-pink'} mb-2`}>
                RAPPORT DE MISSION : {contract.title}
              </Dialog.Title>
              <p className="font-bold text-lg">{isSuccess ? "RÉSULTAT : SUCCÈS" : "RÉSULTAT : ÉCHEC"}</p>

              {/* Informations du runner */}
              <div className="mt-4 bg-black/30 p-4 rounded">
                <h4 className="font-bold text-neon-cyan mb-2">Runner assigné : {contract.assignedRunner?.name}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>Niveau : <span className="text-white">{contract.assignedRunner?.level}</span></p>
                    <p>Commission Fixer : <span className="text-neon-pink">{commission}%</span></p>
                  </div>
                  <div>
                    <p>XP gagnée : <span className="text-green-400">+{contract.assignedRunner?.xp || 0}</span></p>
                    <p>Nouveau niveau : <span className="text-neon-cyan">{contract.assignedRunner?.level}</span></p>
                  </div>
                </div>
              </div>

              {/* Rapport détaillé */}
              <div className="mt-4 bg-black/30 p-4 rounded">
                <p className="text-md text-text-primary italic">
                  &quot;<Typewriter text={contract.debriefing_log || 'Aucun rapport détaillé disponible.'} speed={10} />&quot;
                </p>
              </div>

              {/* Résultats financiers */}
              <div className="mt-4 bg-black/30 p-4 rounded">
                <h4 className="font-bold text-text-primary mb-3">Résultats financiers :</h4>
                
                {isSuccess && (
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between">
                      <span>Récompense totale :</span>
                      <span className="text-green-400">+{totalReward.toLocaleString('en-US')} €$</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Part du Fixer ({commission}%) :</span>
                      <span className="text-neon-cyan">+{fixerShare.toLocaleString('en-US')} €$</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Part du Runner :</span>
                      <span className="text-gray-400">+{runnerShare.toLocaleString('en-US')} €$</span>
                    </div>
                  </div>
                )}
                
                {/* Coûts des programmes */}
                {programCosts.length > 0 && (
                  <div className="border-t border-gray-600 pt-3 mb-3">
                    <h5 className="font-bold text-red-400 mb-2">Coûts engagés :</h5>
                    {programCosts.map((prog, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>Programme {prog.name} :</span>
                        <span className="text-red-400">-{prog.cost.toLocaleString('en-US')} €$</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold border-t border-gray-600 pt-2 mt-2">
                      <span>Total coûts :</span>
                      <span className="text-red-400">-{totalProgramCost.toLocaleString('en-US')} €$</span>
                    </div>
                  </div>
                )}
                
                {/* Gains nets */}
                <div className="flex justify-between font-bold text-lg border-t border-gray-600 pt-3">
                  <span>Gains nets :</span>
                  <span className={netGains >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {netGains >= 0 ? '+' : ''}{netGains.toLocaleString('en-US')} €$
                  </span>
                </div>
              </div>

              {/* Conséquences */}
              <div className="mt-4 bg-black/30 p-4 rounded">
                <h4 className="font-bold text-text-primary mb-2">Conséquences :</h4>
                <div className="space-y-1">
                  <p className="text-text-secondary">
                    <Typewriter 
                      text={isSuccess 
                        ? `+ ${reputationInfo?.gained || 0} Réputation` 
                        : `- ${reputationInfo?.lost || 0} Réputation`
                      } 
                      speed={25} 
                    />
                  </p>
                  {!isSuccess && (
                    <p className="text-red-400 text-sm">
                      Runner : {contract.assignedRunner?.status === 'Mort' ? 'Mort' : 'Grillé 24h'}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-white/10 px-4 py-2 text-sm font-medium text-neon-lime hover:bg-white/20" onClick={onClose}>
                  Fermer le dossier
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}