// src/components/DebriefingModal.js
'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Typewriter from './Typewriter';

export default function DebriefingModal({ isOpen, onClose, contract, reputationInfo }) {
  // S'il n'y a pas de contrat, on n'affiche rien.
  if (!contract) return null;

  const isSuccess = contract.resolution_outcome === 'Succès';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Dialog.Panel className={`w-full max-w-lg transform overflow-hidden rounded-lg bg-background p-6 text-left align-middle shadow-xl transition-all border-2 ${isSuccess ? 'border-neon-cyan' : 'border-neon-pink'}`}>
              <Dialog.Title as="h3" className={`text-2xl font-bold leading-6 ${isSuccess ? 'text-neon-cyan' : 'text-neon-pink'} mb-2`}>
                RAPPORT DE MISSION : {contract.title}
              </Dialog.Title>
              <p className="font-bold text-lg">{isSuccess ? "RÉSULTAT : SUCCÈS" : "RÉSULTAT : ÉCHEC"}</p>

              <div className="mt-4 bg-black/30 p-4 rounded">
                <p className="text-md text-text-primary italic">
                  &quot;<Typewriter text={contract.debriefing_log || 'Aucun rapport détaillé disponible.'} speed={30} />&quot;
                </p>
              </div>

              <div className="mt-4">
                <h4 className="font-bold text-text-primary">Conséquences :</h4>
                <p className="text-text-secondary">
                  <Typewriter 
                    text={isSuccess 
                      ? `+ ${contract.reward.eddies.toLocaleString()} €$ | + ${reputationInfo?.gained || 0} Réputation` 
                      : `- ${reputationInfo?.lost || 0} Réputation | Runner Grillé 2h`
                    } 
                    speed={25} 
                  />
                </p>
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