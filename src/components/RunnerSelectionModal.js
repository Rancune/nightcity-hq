'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function RunnerSelectionModal({ isOpen, onClose, runners, implant, onSelectRunner }) {
  const availableRunners = runners.filter(runner => runner.status === 'Disponible');

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        {/* L'arrière-plan semi-transparent */}
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-background p-6 text-left align-middle shadow-xl transition-all border-2 border-neon-cyan">
                <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-neon-cyan mb-4">
                  Installer l&apos;implant
                </Dialog.Title>

                <div className="mb-4">
                  <div className="bg-white/5 p-3 rounded border border-[--color-border-dark]">
                    <h4 className="text-lg text-[--color-text-primary] font-bold mb-2">
                      {implant?.program?.name || 'Implant inconnu'}
                    </h4>
                    <p className="text-sm text-[--color-text-secondary] mb-2">
                      {implant?.program?.description}
                    </p>
                    <div className="text-xs text-[--color-neon-cyan]">
                      Coût de pose: 2,000 €$
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-text-secondary mb-4">
                    Choisissez un runner disponible pour installer cet implant :
                  </p>
                  
                  {availableRunners.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-red-400 text-sm">Aucun runner disponible</p>
                      <p className="text-xs text-[--color-text-secondary] mt-1">
                        Tous vos runners sont en mission ou grillés
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {availableRunners.map(runner => (
                        <li key={runner._id}>
                          <button
                            onClick={() => onSelectRunner(runner._id)}
                            className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-[--color-border-dark] hover:border-neon-cyan"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold text-text-primary">{runner.name}</p>
                                <p className="text-xs text-text-secondary">
                                  Hacking: {runner.skills.hacking} | Stealth: {runner.skills.stealth} | Combat: {runner.skills.combat}
                                </p>
                                {runner.installedImplants && runner.installedImplants.length > 0 && (
                                  <p className="text-xs text-green-400 mt-1">
                                    {runner.installedImplants.length} implant(s) installé(s)
                                  </p>
                                )}
                              </div>
                              <span className="text-neon-lime font-bold text-lg">&rarr;</span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-6">
                  <button 
                    type="button" 
                    className="inline-flex justify-center rounded-md border border-transparent bg-white/10 px-4 py-2 text-sm font-medium text-neon-lime hover:bg-white/20" 
                    onClick={onClose}
                  >
                    Annuler
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 