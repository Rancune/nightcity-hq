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


  //const argentActuel = 12500; // Valeur fictive, remplace par ta source réelle
  //const reputationActuelle = 78; // Idem
  //const missionsEnCours = 3;
  //const runnersEngages = 2;
  //const coutTotal = 1500;
  //const gainPotentiel = 3000;

  // === NOUVEAU HOOK ===
  // On récupère le statut de l'authentification
  const { isSignedIn, isLoaded, userId } = useAuth();

//console.log("URL DE connard L'API UTILISÉE PAR LE SERVEUR:", process.env.NEXT_PUBLIC_API_URL);
  // --- EFFET AU CHARGEMENT ---
  // Cette fonction s'exécute une seule fois, quand le composant est affiché pour la première fois.
  useEffect(() => {
    const initializeSession = async () => {
      try {
        console.log("Synchronisation de la session du joueur...");
        const syncResponse = await fetch('/api/player/sync', { method: 'POST' });
        if (!syncResponse.ok) throw new Error("La synchronisation du joueur a échoué");
        const profileData = await syncResponse.json();
        setPlayerProfile(profileData);
        console.log("Synchronisation terminée avec succès pour le profil:", profileData);

        console.log("Récupération de la liste des contrats...");
        const contractsResponse = await fetch('/api/contrats');
        if (!contractsResponse.ok) throw new Error('La réponse du réseau des Fixers est corrompue...');
        const contractsData = await contractsResponse.json();
        setContrats(contractsData);
        console.log("Contrats récupérés.");

      } catch (e) {
        console.error("Erreur lors de l'initialisation:", e);
        setErreur(e.message);
      }
    };

    
    // On attend que Clerk soit chargé, que l'utilisateur soit connecté, ET que son ID soit disponible.
    if (isLoaded && isSignedIn && userId) {
      initializeSession();
    }

  // On ajoute userId au tableau des dépendances
  }, [isLoaded, isSignedIn, userId]); // Se lance une seule fois au chargement


    // === NOUVELLE FONCTION POUR LE BOUTON ===
  const handleGenerateContract = async () => {
    try {
      const reponse = await fetch('/api/contrats/generate', { method: 'POST' });
      if (!reponse.ok) {
        throw new Error("La génération a échoué");
      }
      // Pour rafraîchir la liste, on rappelle la fonction qui récupère les contrats.
      // Pour cela, il faut légèrement modifier notre useEffect.
      // C'est une petite refactorisation nécessaire.

      // Solution simple pour l'instant : on recharge la page pour voir le nouveau contrat.
      window.location.reload();

    } catch (error) {
      console.error("Erreur lors de la génération:", error);
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