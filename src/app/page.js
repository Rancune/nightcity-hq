// src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserButton, SignedIn, SignedOut, useAuth } from '@clerk/nextjs';
import AssignRunnerModal from '@/components/AssignRunnerModal';
import AcceptanceTimer from '@/components/AcceptanceTimer';
import MissionTimer from '@/components/MissionTimer';

export default function HomePage() {
  const [contrats, setContrats] = useState([]);
  const [runners, setRunners] = useState([]); // LA CORRECTION EST ICI
  const [erreur, setErreur] = useState(null);
  const [playerProfile, setPlayerProfile] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState(null);

  const { isSignedIn, isLoaded, userId } = useAuth();

  // On fusionne toute la logique de récupération de données ici
  const fetchAllData = async () => {
    try {
      setErreur(null);
      console.log("PAGE.JS: Début de la récupération de toutes les données.");

      // ÉTAPE 1 : On se synchronise et on récupère le profil
      const syncResponse = await fetch('/api/player/sync', { method: 'POST' });
      if (!syncResponse.ok) throw new Error("La synchronisation du joueur a échoué.");
      const profileData = await syncResponse.json();
      setPlayerProfile(profileData);
      console.log("PAGE.JS: Profil joueur synchronisé et mis à jour.", profileData);

      // ÉTAPE 2 : On récupère les contrats ET les runners en parallèle
      const [contractsRes, runnersRes] = await Promise.all([
        fetch('/api/contrats'),
        fetch('/api/netrunners')
      ]);
      if (!contractsRes.ok || !runnersRes.ok) throw new Error('Erreur réseau lors de la récupération des données.');
      
      const contractsData = await contractsRes.json();
      const runnersData = await runnersRes.json();
      
      setContrats(contractsData);
      setRunners(runnersData);
      console.log("PAGE.JS: Contrats et runners récupérés.");

    } catch (e) {
      console.error("PAGE.JS: ERREUR DANS fetchAllData:", e);
      setErreur(e.message);
    }
  };
  
  useEffect(() => {
    // On ne lance l'initialisation que si Clerk est chargé ET que l'utilisateur est connecté
    if (isLoaded && isSignedIn && userId) {
      fetchAllData();
    }
  }, [isLoaded, isSignedIn, userId]);

  const openAssignModal = (contractId) => {
    setSelectedContractId(contractId);
    setIsModalOpen(true);
  };

  const closeAssignModal = () => {
    setIsModalOpen(false);
    setSelectedContractId(null);
  };

  const handleAssignRunner = async (netrunnerId) => {
    if (!selectedContractId) return;

    try {
      const response = await fetch(`/api/contrats/${selectedContractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ netrunnerId }),
      });

      if (!response.ok) throw new Error("L'assignation a échoué");
      
      console.log("Assignation réussie !");
      closeAssignModal();
      fetchAllData();
    } catch (error) {
      console.error("Erreur lors de l'assignation:", error);
      setErreur(error.message);
    }
  };
  
  const handleGenerateContract = async () => {
      try {
        const reponse = await fetch('/api/contrats/generate', { method: 'POST' });
        if (!reponse.ok) throw new Error("La génération a échoué");
        await fetchAllData();
      } catch (error) {
        console.error("Erreur lors de la génération:", error);
      }
    };

  return (
    <>
      <main className="min-h-screen p-4">
        <header className="text-center mb-8 flex justify-between items-center">
          <h1 className="text-3xl text-[--color-neon-cyan] font-bold tracking-widest animate-pulse text-center">
            CONTRATS TERMINAL - FIXER-HQ - V 0.4
          </h1>
          <div className="flex gap-6 items-center">
            <div className="text-lg text-[--color-neon-pink] font-bold border-2 border-[--color-neon-pink] p-2 rounded">
                <span>{playerProfile ? `${playerProfile.eddies.toLocaleString()} €$` : '--- €$'}</span>
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
                    <span className="text-[--color-neon-pink]">[ {contrat.reward.eddies} €$ ]</span>
                    <span className="text-[--color-text-primary] ml-4">{contrat.title}</span>
                  </div>
                </Link>
                <div className="flex items-center flex-shrink-0">
                  {/* === NOUVELLE LOGIQUE D'AFFICHAGE DE STATUT/TIMER === */}
                    {
                      contrat.status === 'Proposé' && contrat.acceptance_deadline_trp > 0 ? (
                        <div className="text-center w-40">
                          <span className="text-xs text-text-secondary">Accepter avant </span>
                          <AcceptanceTimer duration={contrat.acceptance_deadline_trp} />
                        </div>
                      ) : 
                      contrat.status === 'Assigné' && contrat.initial_completion_duration_trp > 0 ? (
                        <div className="text-center w-32">
                          <span className="text-xs text-text-secondary">Mission en cours </span>
                          <MissionTimer 
                            totalDuration={contrat.initial_completion_duration_trp}
                            startTime={contrat.completion_timer_started_at}
                          />
                        </div>
                      ) : (
                        <span className="text-text-secondary italic w-32 text-center">
                          -- {contrat.status.toUpperCase()} --
                        </span>
                      )
                    }               
                    {contrat.status === 'Proposé' && (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        openAssignModal(contrat._id);
                      }}
                      className="bg-[--color-neon-pink] hover:opacity-80 text-white font-bold py-2 px-4 rounded"
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
        isOpen={isModalOpen}
        onClose={closeAssignModal}
        onAssign={handleAssignRunner}
        runners={runners.filter(r => r.status === 'Disponible')}
      />
    </>
  );
}