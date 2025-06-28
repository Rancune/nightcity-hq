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
      <header className="bg-black/80 backdrop-blur-sm border-b border-[--color-border-dark] p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo et titre - collé à gauche */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl text-[--color-neon-cyan] font-bold hover:text-white transition-colors">
              NIGHT CITY HQ
            </Link>
          </div>

          {/* Menu principal avec les boutons - centré */}
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="bg-[--color-neon-pink] text-white font-bold py-3 px-5 rounded transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-pink)] glitch-on-hover">
                Dashboard
              </button>
            </Link>
            <Link href="/contrats">
              <button className="bg-[--color-neon-pink] text-white font-bold py-3 px-5 rounded transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-pink)] glitch-on-hover">
                Contrats
              </button>
            </Link>
            <Link href="/netrunners">
              <button className="bg-[--color-neon-pink] text-white font-bold py-3 px-5 rounded transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-pink)] glitch-on-hover">
                Mon Écurie
              </button>
            </Link>
            <Link href="/marche-noir">
              <button className="bg-[--color-neon-pink] text-white font-bold py-3 px-5 rounded transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-pink)] glitch-on-hover">
                Marché Noir
              </button>
            </Link>
            <Link href="/faction-relations">
              <button className="bg-[--color-neon-pink] text-white font-bold py-3 px-5 rounded transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-pink)] glitch-on-hover">
                Relations
              </button>
            </Link>
            <Link href="/profile">
              <button className="bg-[--color-neon-pink] text-white font-bold py-3 px-5 rounded transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-pink)] glitch-on-hover">
                Profil
              </button>
            </Link>
          </div>

          {/* Eddies, réputation et authentification - collés à droite */}
          <div className="flex items-center gap-4">
            <div className="text-lg text-[--color-neon-pink] font-bold border-2 border-[--color-neon-pink] p-2 rounded w-32 text-center">
              <span>{playerProfile?.eddies?.toLocaleString() || '---'} €$</span>
            </div>
            <div className="text-lg text-[--color-neon-cyan] font-bold border-2 border-[--color-neon-cyan] p-2 rounded w-32 text-center">
              <div className="text-sm">{playerProfile?.reputationTitle || 'Rumeur de la Rue'}</div>
              <div>{playerProfile?.reputationPoints?.toLocaleString() || '---'} PR</div>
            </div>
            <UserButton afterSignOutUrl="/" />
            <SignedOut>
              <a
                href={process.env.NEXT_PUBLIC_SIGN_IN_URL || 
                  (process.env.NODE_ENV === 'development' 
                    ? "http://localhost:3000/sign-in" 
                    : "https://accounts.fixer.rancune.games/sign-in"
                  )
                }
                className="bg-[--color-neon-cyan] text-black font-bold py-3 px-5 rounded transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-cyan)] glitch-on-hover"
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