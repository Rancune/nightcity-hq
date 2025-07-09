// src/components/DebriefingModal.js
'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Typewriter from './Typewriter';

export default function DebriefingModal({ isOpen, onClose, contract, reputationInfo, usedPrograms, financialSummary }) {
  // S'il n'y a pas de contrat, on n'affiche rien.
  if (!contract) return null;

  const isSuccess = contract.resolution_outcome === 'Succès';
  const runnerReports = contract.runnerReports || [];
  const totalReward = contract.reward?.eddies || 0;
  const totalReputation = contract.reward?.reputation || 0;
  const fixerShare = contract.playerShare || 0;
  // Calculer la perte de réputation si présente
  const reputationLoss = contract.reputationLoss || (contract.runnerReports ? contract.runnerReports.reduce((sum, r) => sum + (r.reputationLoss || 0), 0) : 0);

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

              {/* Rapport détaillé */}
              <div className="mt-4 bg-black/30 p-4 rounded">
                <p className="text-md text-text-primary italic">
                  &quot;<Typewriter text={contract.debriefing_log || 'Aucun rapport détaillé disponible.'} speed={10} />&quot;
                </p>
              </div>

              {/* Affichage par carte pour chaque runner */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {runnerReports.map((r, i) => {
                  // Log pour debug affichage du gain de niveau
                  console.log(`[MODAL] Runner: ${r.runner}, isSuccess: ${r.isSuccess}, levelUp: ${r.levelUp}`);
                  return (
                    <div key={i} className={`rounded-lg p-4 shadow bg-black/40 border-2 ${r.status === 'Mort' ? 'border-red-500' : r.status === 'Grillé' ? 'border-yellow-400' : 'border-cyan-400'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-cyan-200 text-lg">{r.runner}</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-xs px-2 py-1 rounded bg-cyan-900/60 text-cyan-200 mr-2">{r.skill}</span>
                        <span className={r.isSuccess ? 'text-green-400' : 'text-red-400'}>
                          {r.isSuccess ? '✔️ Succès' : '❌ Échec'}
                        </span>
                      </div>
                      <div className="text-sm mb-1">XP gagnée : <span className="text-green-400">+{isSuccess ? (r.xpGained || 0) : 0}</span></div>
                      {/* Affichage du gain de niveau */}
                      {isSuccess && r.levelUp && (
                        <div className="text-xs text-yellow-300 mb-1 font-bold">Gain de niveau !</div>
                      )}
                      <div className="text-sm mb-1">Statut : <span className={r.status === 'Disponible' ? 'text-green-400' : r.status === 'Grillé' ? 'text-yellow-400' : 'text-red-400'}>{r.status}</span></div>
                      {r.status === 'Mort' && r.deathCause && (
                        <div className="text-xs text-red-400 mb-1">Cause : {r.deathCause}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Résultats financiers globaux */}
              <div className="mt-4 bg-black/30 p-4 rounded">
                <h4 className="font-bold text-text-primary mb-3">Résultats financiers :</h4>
                <div className="flex justify-between">
                  <span>Paiement :</span>
                  <span className="text-green-400">+{totalReward.toLocaleString('en-US')} €$</span>
                </div>
                {runnerReports.map((r, i) => (
                  <div className="flex justify-between" key={i}>
                    <span>Part du Runner {r.runner} :</span>
                    <span className="text-cyan-200">
                      +{(r.eddies !== undefined ? r.eddies.toLocaleString('en-US') : '-')} €$
                      {typeof r.fixerCommission === 'number' &&
                        <span className="text-xs text-pink-400 ml-2">(commission {r.fixerCommission}%)</span>
                      }
                    </span>
                  </div>
                ))}
                <div className="flex justify-between mt-2">
                  <span>Part du Fixer :</span>
                  <span className="text-green-400 font-bold">+{fixerShare.toLocaleString('en-US')} €$</span>
                </div>
              </div>

              {/* Conséquences et réputation */}
              <div className="mt-4 bg-black/30 p-4 rounded">
                <h4 className="font-bold text-text-primary mb-2">Conséquences :</h4>
                <div className="space-y-1">
                  <p className="text-text-secondary">
                    <Typewriter 
                      text={isSuccess 
                        ? `+ ${totalReputation} Réputation` 
                        : `- ${reputationLoss} Réputation`
                      } 
                      speed={25} 
                    />
                  </p>
                  {/* Statut de chaque runner en cas d'échec */}
                  {!isSuccess && (
                    <ul className="text-red-400 text-sm mt-2">
                      {runnerReports.map((r, i) => (
                        <li key={i}>{r.runner} : {r.status}{r.status === 'Mort' && r.deathCause ? ` (${r.deathCause})` : ''}</li>
                      ))}
                    </ul>
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