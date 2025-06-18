// src/app/page.js

'use client'; // Indispensable pour utiliser les hooks et l'interactivité.

import { useState, useEffect } from 'react';
import StatusCard from './components/StatusCard';
import MissionSummary from './components/MissionSummary';
import './globals.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserButton, SignedIn, SignedOut,useAuth } from '@clerk/nextjs';





export default function HomePage() {
  // --- GESTION DE L'ÉTAT ---
  // La mémoire de notre interface : stocke la liste des contrats et les erreurs.
  const [contrats, setContrats] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [playerProfile, setPlayerProfile] = useState(null);
  // === NOUVEAU HOOK ===
  // On récupère le statut de l'authentification
  const { isSignedIn, isLoaded, userId } = useAuth();

  //const argentActuel = 12500; // Valeur fictive, remplace par ta source réelle
  //const reputationActuelle = 78; // Idem
  //const missionsEnCours = 3;
  //const runnersEngages = 2;
  //const coutTotal = 1500;
  //const gainPotentiel = 3000;



//console.log("URL DE connard L'API UTILISÉE PAR LE SERVEUR:", process.env.NEXT_PUBLIC_API_URL);
  // --- EFFET AU CHARGEMENT ---
  // Cette fonction s'exécute une seule fois, quand le composant est affiché pour la première fois.
  useEffect(() => {
    const initializeSession = async () => {
      if (isLoaded && isSignedIn && userId) {
        await fetch('/api/player/sync', { method: 'POST' });
        await fetchContracts(); // On appelle notre nouvelle fonction
      }
    };
    initializeSession();
  }, [isLoaded, isSignedIn, userId]); // Se lance une seule fois au chargement


    // === NOUVELLE FONCTION POUR LE BOUTON ===
  const handleGenerateContract = async () => {
    try {
      const reponse = await fetch('/api/contrats/generate', { method: 'POST' });
      if (!reponse.ok) {
        throw new Error("La génération a échoué");
      }
      // Au lieu de recharger, on rafraîchit simplement la liste des contrats !
      await fetchContracts();
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
    }
  };


  // On isole la logique de récupération des contrats dans sa propre fonction
  const fetchContracts = async () => {
    try {
      console.log("Récupération de la liste des contrats...");
      const contractsResponse = await fetch('/api/contrats');
      if (!contractsResponse.ok) throw new Error('La réponse du réseau est corrompue...');
      const contractsData = await contractsResponse.json();
      setContrats(contractsData);
    } catch (e) {
      console.error("Erreur lors de la récupération des contrats:", e);
      setErreur(e.message);
    }
  };


  // --- LOGIQUE D'INTERACTION ---
  // Fonction appelée quand on clique sur le bouton "Accepter".
  const handleAcceptContract = async (contractId) => {
    try {
      // On envoie un ordre de mise à jour à notre API pour un contrat spécifique.
      const reponse = await fetch(`/api/contrats/${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'En cours' }), // Le nouveau statut à appliquer.
      });

      if (!reponse.ok) {
        throw new Error("Échec de la mise à jour du contrat");
      }
      
      const updatedContract = await reponse.json();

      // Pour une réactivité maximale, on met à jour notre liste de contrats localement
      // sans avoir à recharger toute la page.
      setContrats(currentContrats => 
        currentContrats.map(c => (c._id === contractId ? updatedContract : c))
      );

    } catch (error) {
      console.error("Erreur lors de l'acceptation du contrat:", error);
      setErreur(error.message);
    }
  };

  // --- AFFICHAGE (JSX) ---
  // C'est la structure visuelle de notre page, stylisée avec les variables de globals.css.
  return (
    <main className="min-h-screen p-4">
      <header className="text-center mb-8 flex justify-between items-center">
        <h1 className="text-3xl text-[--color-neon-cyan] font-bold tracking-widest animate-pulse">
          CONTRACTS TERMINAL - FIXER HQ
        </h1>
        <div className="flex gap-6 items-center">
            <div className="text-lg text-[--color-neon-pink] font-bold border-2 border-[--color-neon-pink] p-2 rounded">
                <span>{playerProfile ? `${playerProfile.eddies.toLocaleString()} €$` : '--- €$'}</span>
            </div>
            <button 
              onClick={handleGenerateContract}
              className="bg-[--color-neon-pink] hover:opacity-80 text-white font-bold py-2 px-4 rounded"
            >
              Générer Contrat
            </button>
            <SignedOut>
              <a href="/sign-in" className="bg-neon-cyan text-background font-bold py-2 px-4 rounded">Connexion</a>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/"/>
            </SignedIn>
        </div>
      </header>

      <div>
        {erreur && (
          <div className="text-[--color-neon-pink] border border-[--color-neon-pink] p-4">
            <p>-- ERREUR DE CONNEXION SYSTÈME --</p>
            <p>{erreur}</p>
          </div>
        )}
        <ul className="border-t border-[--color-border-dark]">
          {contrats.map((contrat) => (
            <Link href={`/contrats/${contrat._id}`} key={contrat._id}>
              <li className="flex justify-between items-center p-3 border-b border-[--color-border-dark] cursor-pointer transition-all duration-200 hover:bg-white/10 hover:-translate-y-0.5">
                <div className="flex-grow">
                  <span className="text-[--color-neon-pink]">[ {contrat.reward.eddies} €$ ]</span>
                  <span className="text-[--color-text-primary] ml-4">{contrat.title}</span>
                </div>
                <div className="flex items-center flex-shrink-0">
                  <span className="text-[--color-text-secondary] italic w-32 text-center">-- {contrat.status.toUpperCase()} --</span>
                  {contrat.status === 'Proposé' && (
                    <button 
                      onClick={(e) => {
                        e.preventDefault(); // Empêche la navigation quand on clique sur le bouton
                        handleAcceptContract(contrat._id);
                      }}
                      className="bg-[--color-neon-cyan] hover:opacity-80 text-[--color-background] font-bold py-1 px-3 rounded ml-4"
                    >
                      Accepter
                    </button>
                  )}
                </div>
              </li>
            </Link>
          ))}
        </ul>
      </div>
    </main>
  );
}