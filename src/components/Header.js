// src/components/Header.js
'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton, useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingOverlay from './LoadingOverlay';
import ButtonWithLoading from './ButtonWithLoading';

// Notre composant gère maintenant ses propres données
export default function Header() {
  const [playerProfile, setPlayerProfile] = useState(null);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  const fetchPlayerProfile = async () => {
    try {
      const response = await fetch('/api/player/reputation');
      if (response.ok) {
        const data = await response.json();
        setPlayerProfile(data.playerProfile);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchPlayerProfile();
      // Recharger le profil toutes les 5 secondes pour les mises à jour
      const interval = setInterval(fetchPlayerProfile, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoaded, isSignedIn]);

  const handleGenerateContract = async () => {
    setIsGeneratingContract(true);
    try {
      const response = await fetch('/api/contrats/generate', { method: 'POST' });
      if (response.ok) {
        // Recharger le profil après génération
        await fetchPlayerProfile();
      }
    } catch (error) {
      console.error('Erreur lors de la génération du contrat:', error);
    } finally {
      setIsGeneratingContract(false);
    }
  };

  return (
    <>
      <header className="bg-black/80 backdrop-blur-sm border-b border-[--color-border-dark] p-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo et titre - collé à gauche */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl text-[--color-neon-cyan] font-bold hover:text-white transition-colors whitespace-nowrap">
              NIGHT CITY HQ
            </Link>
          </div>

          {/* Menu principal avec les boutons - centré */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            <Link href="/">
              <button className="bg-[--color-neon-pink] text-white font-bold py-2 px-4 rounded text-sm transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-pink)] glitch-on-hover min-w-[100px] whitespace-nowrap">
                Dashboard
              </button>
            </Link>
            <Link href="/contrats">
              <button className="bg-[--color-neon-pink] text-white font-bold py-2 px-4 rounded text-sm transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-pink)] glitch-on-hover min-w-[100px] whitespace-nowrap">
                Contrats
              </button>
            </Link>
            <Link href="/netrunners">
              <button className="bg-[--color-neon-pink] text-white font-bold py-2 px-4 rounded text-sm transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-pink)] glitch-on-hover min-w-[100px] whitespace-nowrap">
                Mon Écurie
              </button>
            </Link>
            <Link href="/marche-noir">
              <button className="bg-[--color-neon-pink] text-white font-bold py-2 px-4 rounded text-sm transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-pink)] glitch-on-hover min-w-[100px] whitespace-nowrap">
                Marché Noir
              </button>
            </Link>
            <Link href="/faction-relations">
              <button className="bg-[--color-neon-pink] text-white font-bold py-2 px-4 rounded text-sm transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-pink)] glitch-on-hover min-w-[100px] whitespace-nowrap">
                Relations
              </button>
            </Link>
            <Link href="/profile">
              <button className="bg-[--color-neon-pink] text-white font-bold py-2 px-4 rounded text-sm transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-pink)] glitch-on-hover min-w-[100px] whitespace-nowrap">
                Profil
              </button>
            </Link>
          </div>

          {/* Eddies, réputation et authentification - collés à droite */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Eddies avec design amélioré */}
            <div className="bg-gradient-to-r from-[--color-neon-pink]/20 to-[--color-neon-pink]/10 border border-[--color-neon-pink] rounded-lg p-2 min-w-[120px]">
              <div className="text-xs text-[--color-neon-pink]/70 uppercase tracking-wider font-semibold">
                Eddies
              </div>
              <div className="text-sm text-[--color-neon-pink] font-bold">
                <span className="text-[--color-neon-pink] font-bold">
                  {playerProfile?.eddies?.toLocaleString('en-US') || '---'} €$
                </span>
              </div>
            </div>

            {/* Réputation avec design amélioré */}
            <div className="bg-gradient-to-r from-[--color-neon-cyan]/20 to-[--color-neon-cyan]/10 border border-[--color-neon-cyan] rounded-lg p-2 min-w-[140px]">
              <div className="text-xs text-[--color-neon-cyan]/70 uppercase tracking-wider font-semibold truncate">
                {playerProfile?.reputationTitle || 'Rumeur de la Rue'}
              </div>
              <div className="text-sm text-[--color-neon-cyan] font-bold">
                <div className="flex items-center gap-2">
                  
                  <span className="text-[--color-neon-cyan] font-bold">
                    {playerProfile?.reputationPoints?.toLocaleString('en-US') || '---'} PR
                  </span>
                </div>
              </div>
            </div>

            {/* Bouton utilisateur */}
            <div className="flex-shrink-0">
              <UserButton afterSignOutUrl="/" />
            </div>

            {/* Bouton de connexion */}
            <SignedOut>
              <a
                href={process.env.NEXT_PUBLIC_SIGN_IN_URL || 
                  (process.env.NODE_ENV === 'development' 
                    ? "http://localhost:3000/sign-in" 
                    : "https://accounts.fixer.rancune.games/sign-in"
                  )
                }
                className="bg-[--color-neon-cyan] text-black font-bold py-2 px-4 rounded text-sm transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-cyan)] glitch-on-hover whitespace-nowrap"
              >
                Se connecter
              </a>
            </SignedOut>
          </div>
        </div>
      </header>
      
      {/* Loading Overlay pour la génération de contrats */}
      <LoadingOverlay 
        isVisible={isGeneratingContract} 
        message="GÉNÉRATION DE CONTRAT EN COURS..." 
      />
    </>
  );
}