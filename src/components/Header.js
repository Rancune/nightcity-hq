// src/components/Header.js
'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton, useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Notre composant gère maintenant ses propres données
export default function Header() {
  const [playerProfile, setPlayerProfile] = useState(null);
  const { isSignedIn, isLoaded, userId } = useAuth();
  const router = useRouter();

  const fetchPlayerProfile = async () => {
    if (!isSignedIn || !userId) return;
    
    try {
      const response = await fetch('/api/player/sync', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setPlayerProfile(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  };

  const handleGenerateContract = async () => {
    try {
      await fetch('/api/contrats/generate', { method: 'POST' });
      // Optionnel : rafraîchir les données après génération
      fetchPlayerProfile();
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la génération du contrat:', error);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchPlayerProfile();
    }
  }, [isLoaded, isSignedIn, userId]);

  return (
    <header className="relative w-full p-4 mb-8">
      {/* --- Zone d'Authentification (en haut à droite) --- */}
      <div className="absolute top-4 right-4 flex items-center gap-4 z-20">
        <SignedOut>
          <Link href="/sign-in" className="bg-neon-cyan text-background font-bold py-2 px-4 rounded hover:opacity-90">
            Connexion
          </Link>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/"/>
        </SignedIn>
      </div>

      {/* --- Titre Principal (centré) --- */}
      <div className="text-center">
        <h1 className="text-4xl text-[--color-neon-cyan] font-bold tracking-widest animate-pulse">
          FIXER-HQ
        </h1>
        <p className="text-sm text-[--color-text-secondary]">Terminal de Contrats Fixer - v0.5</p>
      </div>

      {/* --- Zone d'Actions (en dessous du titre, centrée) --- */}
      <div className="mt-20 flex justify-between items-center gap-6">
        
        {/* Menu principal avec les boutons */}
        <div className="flex items-center gap-4">
          <Link href="/netrunners">
            <button className="bg-[--color-neon-pink] text-white font-bold py-3 px-5 rounded transition-all duration-200 hover:bg-neon-cyan hover:text-background hover:shadow-[0_0_15px_var(--color-neon-pink)] glitch-on-hover">
              Mon Écurie
            </button>
          </Link>
          <button 
            onClick={handleGenerateContract}
            className="bg-[--color-neon-pink] text-white font-bold py-3 px-5 rounded transition-all duration-200 hover:bg-neon-cyan hover:text-background hover:shadow-[0_0_15px_var(--color-neon-pink)] glitch-on-hover"
          >
            Générer Contrat
          </button>
          <Link href="/marche-noir">
            <button className="bg-[--color-neon-pink] text-white font-bold py-3 px-5 rounded transition-all duration-200 hover:bg-neon-cyan hover:text-background hover:shadow-[0_0_15px_var(--color-neon-pink)] glitch-on-hover">
              Marché Noir
            </button>
          </Link>
        </div>

        {/* Le solde d'eddies est maintenant seul à droite */}
        <div className="text-lg text-[--color-neon-pink] font-bold border-2 border-[--color-neon-pink] p-2 rounded">
          <span>{playerProfile?.eddies?.toLocaleString() || '---'} €$</span>
        </div>

      </div>
    </header>
  );
}