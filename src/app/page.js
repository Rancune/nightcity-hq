// src/app/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { UserButton, SignedIn, SignedOut, useAuth } from '@clerk/nextjs';
import AcceptanceTimer from '@/components/AcceptanceTimer';
import MissionTimer from '@/components/MissionTimer';
import AssignRunnerModal from '@/components/AssignRunnerModal';
import DebriefingModal from '@/components/DebriefingModal';

export default function HomePage() {
  // --- États du composant ---
  const [contrats, setContrats] = useState([]);
  const [runners, setRunners] = useState([]);
  const [playerProfile, setPlayerProfile] = useState(null);
  const [erreur, setErreur] = useState(null);
  
  // États pour la modale d'assignation
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(null);
  
  // États pour la modale de debriefing
  const [showDebriefing, setShowDebriefing] = useState(false);
  const [debriefingContract, setDebriefingContract] = useState(null);

  const { isSignedIn, isLoaded, userId } = useAuth();

  // --- LOGIQUE DE RÉCUPÉRATION DES DONNÉES ---
  const fetchData = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !userId) return;

    try {
      setErreur(null);
      const [contractsRes, runnersRes, profileRes] = await Promise.all([
        fetch('/api/contrats'),
        fetch('/api/netrunners'),
        fetch('/api/player/sync', { method: 'POST' })
      ]);

      if (!contractsRes.ok || !runnersRes.ok || !profileRes.ok) {
        throw new Error('Erreur réseau lors de la récupération des données.');
      }
      
      const [contractsData, runnersData, profileData] = await Promise.all([
        contractsRes.json(),
        runnersRes.json(),
        profileRes.json()
      ]);
      
      setContrats(contractsData);
      setRunners(runnersData);
      setPlayerProfile(profileData);
    } catch (e) {
      console.error("Erreur lors de la récupération des données:", e);
      setErreur(e.message);
    }
  }, [isLoaded, isSignedIn, userId]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- HANDLERS D'ACTIONS ---
  const openAssignModal = (contractId) => {
    setSelectedContractId(contractId);
    setIsAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedContractId(null);
  };

  const handleGenerateContract = async () => {
    await fetch('/api/contrats/generate', { method: 'POST' });
    fetchData();
  };

  const handleAssignRunner = async (netrunnerId) => {
    if (!selectedContractId) return;
    await fetch(`/api/contrats/${selectedContractId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ netrunnerId }),
    });
    closeAssignModal();
    fetchData();
  };
  
  const handleTimerEnd = async (contractId) => {
    await fetch(`/api/contrats/${contractId}/timesup`, { method: 'POST' });
    fetchData();
  };

  const handleClaimReward = async (contractId) => {
    const response = await fetch(`/api/contrats/${contractId}/resolve`, { method: 'POST' });
    if (response.ok) {
      const data = await response.json();
      setDebriefingContract(data.updatedContract);
      setShowDebriefing(true);
    } else {
      setErreur("Erreur lors de la réclamation de la récompense.");
    }
  };

  // --- AFFICHAGE JSX ---
  return (
    <>
      <main className="min-h-screen p-4">
        <header className="text-center mb-8 flex justify-between items-center">
          <h1 className="text-3xl text-[--color-neon-cyan] font-bold tracking-widest animate-pulse">
            TERMINAL DE CONTRATS - NIGHTCITY-HQ
          </h1>
          <div className="flex gap-6 items-center">
            <div className="text-lg text-[--color-neon-pink] font-bold border-2 border-[--color-neon-pink] p-2 rounded">
              <span>{playerProfile?.eddies?.toLocaleString() || '---'} €$</span>
            </div>
            <Link href="/netrunners">
              <button className="bg-[--color-neon-pink] hover:opacity-80 text-white font-bold py-2 px-4 rounded">
                Mon Écurie
              </button>
            </Link>
            <button 
              onClick={handleGenerateContract}
              className="bg-[--color-neon-pink] hover:opacity-80 text-white font-bold py-2 px-4 rounded"
            >
              Générer Contrat
            </button>
            <SignedOut>
              <Link href="/sign-in" className="bg-neon-cyan text-background font-bold py-2 px-4 rounded">Connexion</Link>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/"/>
            </SignedIn>
          </div>
        </header>
        
        <div>
          {erreur && (
            <div className="text-[--color-neon-pink] border border-[--color-neon-pink] p-4 my-4">
              <p>-- ERREUR SYSTÈME --</p>
              <p>{erreur}</p>
            </div>
          )}
          <ul className="border-t border-[--color-border-dark]">
            {contrats.map((contrat) => (
              <li key={contrat._id} className="flex justify-between items-center p-3 border-b border-[--color-border-dark] transition-all duration-200">
                <Link href={`/contrats/${contrat._id}`} className="flex-grow">
                  <div className="cursor-pointer hover:bg-white/5 p-2 rounded-l-lg">
                    <span className="text-[--color-neon-pink]">[ {contrat.reward?.eddies?.toLocaleString() || 0} €$ ]</span>
                    <span className="text-[--color-text-primary] ml-4">{contrat.title}</span>
                  </div>
                </Link>
                <div className="flex items-center flex-shrink-0 ml-4">
                  {
                    contrat.status === 'Proposé' && contrat.acceptance_deadline_trp > 0 ? (
                      <div className="text-center w-40">
                        <span className="text-xs text-text-secondary">Accepter avant</span>
                        <AcceptanceTimer duration={contrat.acceptance_deadline_trp} />
                      </div>
                    ) : 
                    contrat.status === 'Assigné' && contrat.initial_completion_duration_trp > 0 ? (
                      <div className="text-center w-32">
                        <span className="text-xs text-text-secondary">Mission en cours</span>
                        <MissionTimer 
                          totalDuration={contrat.initial_completion_duration_trp}
                          startTime={contrat.completion_timer_started_at}
                          onTimerEnd={() => handleTimerEnd(contrat._id)}
                        />
                      </div>
                    ) : 
                    contrat.status === 'En attente de rapport' ? (
                      <button onClick={(e) => { e.preventDefault(); handleClaimReward(contrat._id); }}
                        className={`font-bold py-2 px-4 rounded animate-pulse ${contrat.resolution_outcome === 'Succès' ? 'bg-green-500 hover:bg-green-400' : 'bg-red-600 hover:bg-red-500'}`}>
                        {contrat.resolution_outcome === 'Succès' ? 'VOIR RAPPORT' : 'VOIR RAPPORT'}
                      </button>
                    ) : (
                      <span className="text-text-secondary italic w-40 text-center">-- {contrat.status.toUpperCase()} --</span>
                    )
                  }
                  {contrat.status === 'Proposé' && (
                    <button 
                      onClick={(e) => { e.preventDefault(); openAssignModal(contrat._id); }}
                      className="bg-[--color-neon-cyan] hover:opacity-80 text-background font-bold py-1 px-3 rounded ml-4"
                    >
                      Accepter
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
      
      <AssignRunnerModal
        isOpen={isAssignModalOpen}
        onClose={closeAssignModal}
        onAssign={handleAssignRunner}
        runners={runners.filter(r => r.status === 'Disponible')}
      />
      
      <DebriefingModal
        isOpen={showDebriefing}
        contract={debriefingContract}
        onClose={() => {
          setShowDebriefing(false);
          fetchData();
        }}
      />
    </>
  );
}