// src/components/AssignRunnerModal.js
'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';


export default function AssignRunnerModal({ isOpen, onClose, runners, onAssign }) {
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
                  Assigner un Netrunner
                </Dialog.Title>

                <div className="mt-2">
                  <p className="text-sm text-text-secondary mb-4">
                    Choisissez un agent disponible pour cette mission. Leurs compétences détermineront leurs chances de succès.
                  </p>
                  <ul className="space-y-3">
                    {runners.map(runner => (
                      <li key={runner._id}>
                        <button
                          onClick={() => onAssign(runner._id)}
                          className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex justify-between items-center"
                        >
                          <div>
                            <p className="font-bold text-text-primary">{runner.name}</p>
                            <p className="text-xs text-text-secondary">Hacking: {runner.skills.hacking} | Stealth: {runner.skills.stealth} | Combat: {runner.skills.combat}</p>
                          </div>
                          <span className="text-neon-lime font-bold text-lg">&rarr;</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6">
                  <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-white/10 px-4 py-2 text-sm font-medium text-neon-lime hover:bg-white/20" onClick={onClose}>
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