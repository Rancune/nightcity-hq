// src/app/page.js
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Typewriter from '@/components/Typewriter';
import { getReputationLevelInfo } from '@/Lib/reputation';

export default function DashboardPage() {
  const [playerProfile, setPlayerProfile] = useState(null);
  const [netrunners, setNetrunners] = useState([]);
  const [contrats, setContrats] = useState([]);
  const { isSignedIn, isLoaded } = useAuth();
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Récupérer le profil du joueur
      const profileResponse = await fetch('/api/player/reputation');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setPlayerProfile(profileData.playerProfile);
      }

      // Récupérer les netrunners
      const runnersResponse = await fetch('/api/netrunners');
      if (runnersResponse.ok) {
        const runnersData = await runnersResponse.json();
        setNetrunners(runnersData);
      }

      // Récupérer les contrats
      const contratsResponse = await fetch('/api/contrats');
      if (contratsResponse.ok) {
        const contratsData = await contratsResponse.json();
        setContrats(contratsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchData();
    }
  }, [isLoaded, isSignedIn]);

  const getStatusCounts = () => {
    const counts = {
      active: contrats.filter(c => c.status === 'En cours').length,
      pending: contrats.filter(c => c.status === 'En attente de rapport').length,
      completed: contrats.filter(c => c.status === 'Terminé').length,
      failed: contrats.filter(c => c.status === 'Échoué').length
    };
    return counts;
  };

  const getRunnerStats = () => {
    const available = netrunners.filter(r => r.status === 'Disponible').length;
    const busy = netrunners.filter(r => r.status === 'En mission').length;
    const total = netrunners.length;
    return { available, busy, total };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="loading-text">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();
  const runnerStats = getRunnerStats();

  return (
    <main className="page-container">
      <div className="content-wrapper">
        {/* En-tête du tableau de bord */}
        <div className="page-header">
          <h1 className="page-title">Tableau de Bord</h1>
          <p className="page-subtitle">
            <Typewriter text={`Bienvenue, ${playerProfile.handle}. Voici l'état de tes opérations dans Night City.`} speed={10} />
          </p>
        </div>

        {/* Cartes de statistiques principales */}
        <div className="stats-grid">
          {/* Eddies */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg text-[--color-text-primary] font-bold">Eddies</h3>
              <span className="text-2xl">€$</span>
            </div>
            <div className="text-2xl text-[--color-neon-pink] font-bold">
              {playerProfile.eddies?.toLocaleString('en-US') || '0'} €$
            </div>
            <p className="text-sm text-[--color-text-secondary] mt-2">Monnaie de Night City</p>
          </div>

          {/* Réputation */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg text-[--color-text-primary] font-bold">Réputation</h3>
              <span className="text-2xl">PR</span>
            </div>
            <div className="bg-black/30 p-4 rounded-lg border border-[--color-border-dark]">
              <div className="text-sm text-[--color-text-secondary] mb-1">Réputation</div>
              <div className="text-2xl text-[--color-neon-cyan] font-bold">
                {playerProfile.reputationPoints?.toLocaleString('en-US') || '0'} PR
              </div>
            </div>
            <p className="text-sm text-[--color-text-secondary] mt-2">{playerProfile.reputationTitle}</p>
          </div>

          {/* Netrunners */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg text-[--color-text-primary] font-bold">Netrunners</h3>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-3xl text-green-400 font-bold">
              {runnerStats.available}/{runnerStats.total}
            </p>
            <p className="text-sm text-[--color-text-secondary] mt-2">
              {runnerStats.busy} en mission
            </p>
          </div>

          {/* Contrats */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg text-[--color-text-primary] font-bold">Contrats</h3>
              <span className="text-2xl">📋</span>
            </div>
            <p className="text-3xl text-yellow-400 font-bold">
              {statusCounts.active + statusCounts.pending}
            </p>
            <p className="text-sm text-[--color-text-secondary] mt-2">
              {statusCounts.completed} terminés
            </p>
          </div>
        </div>

        {/* Sections principales */}
        <div className="content-grid">
          {/* Section Netrunners */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Mon Écurie</h2>
              <Link href="/netrunners">
                <button className="text-[--color-neon-cyan] hover:underline text-sm">
                  Voir tout →
                </button>
              </Link>
            </div>
            
            <div className="card-content">
              {netrunners.length > 0 ? (
                <>
                  {netrunners.slice(0, 3).map((runner) => (
                    <div key={runner._id} className="flex items-center justify-between p-3 bg-black/30 rounded">
                      <div>
                        <p className="text-[--color-text-primary] font-bold">{runner.name}</p>
                        <p className="text-sm text-[--color-text-secondary]">
                          Niv. {runner.level} • {runner.status}
                        </p>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="text-blue-400">H:{runner.skills?.hacking || 0}</span>
                        <span className="text-green-400">S:{runner.skills?.stealth || 0}</span>
                        <span className="text-red-400">C:{runner.skills?.combat || 0}</span>
                      </div>
                    </div>
                  ))}
                  {netrunners.length > 3 && (
                    <p className="text-sm text-[--color-text-secondary] text-center">
                      +{netrunners.length - 3} autres runners
                    </p>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">👥</div>
                  <p className="empty-state-text">Aucun netrunner recruté</p>
                </div>
              )}
            </div>
          </div>

          {/* Section Contrats */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Contrats Actifs</h2>
              <Link href="/contrats">
                <button className="text-[--color-neon-cyan] hover:underline text-sm">
                  Voir tout →
                </button>
              </Link>
            </div>
            
            <div className="card-content">
              {contrats.length > 0 ? (
                <>
                  {contrats
                    .filter(c => c.status === 'En cours' || c.status === 'En attente de rapport')
                    .slice(0, 3)
                    .map((contrat) => (
                      <div key={contrat._id} className="p-3 bg-black/30 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[--color-text-primary] font-bold text-sm truncate">
                            {contrat.title}
                          </p>
                          <span className={`text-xs font-bold ${
                            contrat.status === 'En cours' ? 'text-yellow-400' : 'text-[--color-neon-cyan]'
                          }`}>
                            {contrat.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-[--color-text-secondary]">
                          <span>{contrat.reward?.eddies?.toLocaleString('en-US')} €$</span>
                          <span>+{contrat.reward?.reputation || 0} PR</span>
                        </div>
                      </div>
                    ))}
                  {contrats.filter(c => c.status === 'En cours' || c.status === 'En attente de rapport').length === 0 && (
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <p className="empty-state-text">Aucun contrat actif</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <p className="empty-state-text">Aucun contrat disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="card section-spacing">
          <h2 className="card-title mb-4">Actions Rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/contrats">
              <button className="btn-primary w-full">
                Gérer Contrats
              </button>
            </Link>
            
            <Link href="/netrunners">
              <button className="btn-secondary w-full">
                Mon Écurie
              </button>
            </Link>
            
            <Link href="/marche-noir">
              <button className="btn-primary w-full">
                Marché Noir
              </button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}