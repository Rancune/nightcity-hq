// src/components/Header.js
'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton, useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingOverlay from './LoadingOverlay';
import ButtonWithLoading from './ButtonWithLoading';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

// Notre composant gère maintenant ses propres données
export default function Header() {
  const [playerProfile, setPlayerProfile] = useState(null);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

          {/* Menu burger mobile */}
          <div className="md:hidden flex items-center">
            <button
              aria-label="Ouvrir le menu"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded hover:bg-white/10 focus:outline-none"
            >
              <Bars3Icon className="w-7 h-7 text-cyan-300" />
            </button>
          </div>

          {/* Menu principal - caché sur mobile */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
            <Link href="/">
              <button className="bg-[--color-neon-pink] text-white font-bold py-2 px-4 rounded text-sm transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-pink)] glitch-on-hover min-w-[100px] whitespace-nowrap">
                Dashboard
              </button>
            </Link>
            <Link href="/map">
              <button className="bg-[--color-neon-pink] text-white font-bold py-2 px-4 rounded text-sm transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-pink)] glitch-on-hover min-w-[100px] whitespace-nowrap">
                Map
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
          <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-3 flex-shrink-0">
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
            {(() => {
              const level = playerProfile?.reputationLevel || 1;
              let borderColor = 'border-gray-200';
              let bgColor = 'bg-white/10';
              let textColor = 'text-gray-200';
              if (level === 2) {
                borderColor = 'border-green-400';
                bgColor = 'bg-green-400/10';
                textColor = 'text-green-400';
              } else if (level === 3) {
                borderColor = 'border-blue-400';
                bgColor = 'bg-blue-400/10';
                textColor = 'text-blue-400';
              } else if (level === 4) {
                borderColor = 'border-purple-500';
                bgColor = 'bg-purple-500/10';
                textColor = 'text-purple-500';
              } else if (level === 5) {
                borderColor = 'border-orange-400';
                bgColor = 'bg-orange-400/10';
                textColor = 'text-orange-400';
              }
              return (
                <div className={`${bgColor} ${borderColor} rounded-lg p-2 min-w-[140px] border`}>
                  <div className={`text-xs ${textColor}/70 uppercase tracking-wider font-semibold truncate`}>
                    {playerProfile?.reputationTitle || 'Rumeur de la Rue'}
                  </div>
                  <div className={`text-sm font-bold ${textColor}`}>
                    <div className="flex items-center gap-2">
                      <span className={textColor + ' font-bold'}>
                        {playerProfile?.reputationPoints?.toLocaleString('en-US') || '---'} PR
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

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

        {/* Menu mobile drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-[--color-border-dark]">
              <span className="text-xl text-[--color-neon-cyan] font-bold">Menu</span>
              <button
                aria-label="Fermer le menu"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded hover:bg-white/10 focus:outline-none"
              >
                <XMarkIcon className="w-7 h-7 text-cyan-300" />
              </button>
            </div>
            <nav className="flex flex-col gap-2 p-4">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full bg-[--color-neon-pink] text-white font-bold py-3 rounded text-base mb-1">Dashboard</button>
              </Link>
              <Link href="/map" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full bg-[--color-neon-pink] text-white font-bold py-3 rounded text-base mb-1">Map</button>
              </Link>
              <Link href="/contrats" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full bg-[--color-neon-pink] text-white font-bold py-3 rounded text-base mb-1">Contrats</button>
              </Link>
              <Link href="/netrunners" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full bg-[--color-neon-pink] text-white font-bold py-3 rounded text-base mb-1">Mon Écurie</button>
              </Link>
              <Link href="/marche-noir" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full bg-[--color-neon-pink] text-white font-bold py-3 rounded text-base mb-1">Marché Noir</button>
              </Link>
              <Link href="/faction-relations" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full bg-[--color-neon-pink] text-white font-bold py-3 rounded text-base mb-1">Relations</button>
              </Link>
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full bg-[--color-neon-pink] text-white font-bold py-3 rounded text-base mb-1">Profil</button>
              </Link>
              <div className="mt-4 flex flex-col gap-2">
                <div className="bg-gradient-to-r from-[--color-neon-pink]/20 to-[--color-neon-pink]/10 border border-[--color-neon-pink] rounded-lg p-2 min-w-[120px]">
                  <div className="text-xs text-[--color-neon-pink]/70 uppercase tracking-wider font-semibold">Eddies</div>
                  <div className="text-sm text-[--color-neon-pink] font-bold">
                    <span className="text-[--color-neon-pink] font-bold">{playerProfile?.eddies?.toLocaleString('en-US') || '---'} €$</span>
                  </div>
                </div>
                {/* Réputation mobile */}
                {(() => {
                  const level = playerProfile?.reputationLevel || 1;
                  let borderColor = 'border-gray-200';
                  let bgColor = 'bg-white/10';
                  let textColor = 'text-gray-200';
                  if (level === 2) {
                    borderColor = 'border-green-400';
                    bgColor = 'bg-green-400/10';
                    textColor = 'text-green-400';
                  } else if (level === 3) {
                    borderColor = 'border-blue-400';
                    bgColor = 'bg-blue-400/10';
                    textColor = 'text-blue-400';
                  } else if (level === 4) {
                    borderColor = 'border-purple-500';
                    bgColor = 'bg-purple-500/10';
                    textColor = 'text-purple-500';
                  } else if (level === 5) {
                    borderColor = 'border-orange-400';
                    bgColor = 'bg-orange-400/10';
                    textColor = 'text-orange-400';
                  }
                  return (
                    <div className={`${bgColor} ${borderColor} rounded-lg p-2 min-w-[140px] border`}>
                      <div className={`text-xs ${textColor}/70 uppercase tracking-wider font-semibold truncate`}>
                        {playerProfile?.reputationTitle || 'Rumeur de la Rue'}
                      </div>
                      <div className={`text-sm font-bold ${textColor}`}>
                        <div className="flex items-center gap-2">
                          <span className={textColor + ' font-bold'}>
                            {playerProfile?.reputationPoints?.toLocaleString('en-US') || '---'} PR
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex-shrink-0">
                  <UserButton afterSignOutUrl="/" />
                </div>
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
            </nav>
          </div>
        )}
      </header>
      
      {/* Loading Overlay pour la génération de contrats */}
      <LoadingOverlay 
        isVisible={isGeneratingContract} 
        message="GÉNÉRATION DE CONTRAT EN COURS..." 
      />
    </>
  );
}