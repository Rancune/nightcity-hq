'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Typewriter from '@/components/Typewriter';
import { getReputationLevelInfo, generateReputationReport } from '@/Lib/reputation';

export default function ProfilePage() {
  const [playerProfile, setPlayerProfile] = useState(null);
  const [reputationReport, setReputationReport] = useState(null);
  const { isSignedIn, isLoaded } = useAuth();

  const fetchPlayerProfile = async () => {
    const response = await fetch('/api/player/reputation');
    if (response.ok) {
      const data = await response.json();
      setPlayerProfile(data.playerProfile);
      setReputationReport(data.reputationReport);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchPlayerProfile();
    }
  }, [isLoaded, isSignedIn]);

  if (!playerProfile || !reputationReport) {
    return (
      <main className="min-h-screen p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[--color-neon-cyan] border-t-transparent rounded-full mx-auto"></div>
          <p className="text-[--color-text-secondary] mt-4">Chargement du profil...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* En-tête du profil */}
        <div className="bg-white/5 p-6 rounded-lg border border-[--color-border-dark] mb-8">
          <h1 className="text-3xl text-[--color-neon-cyan] font-bold mb-2">{playerProfile.handle}</h1>
          <p className="text-[--color-text-secondary]">Fixer de Night City</p>
        </div>

        {/* Informations de réputation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Niveau actuel */}
          <div className="bg-white/5 p-6 rounded-lg border border-[--color-border-dark]">
            <h2 className="text-2xl text-[--color-neon-pink] font-bold mb-4">Niveau de Réputation</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl text-[--color-text-primary] font-bold">{reputationReport.currentLevel.title}</h3>
                <p className="text-[--color-text-secondary] text-sm mt-1">
                  <Typewriter text={reputationReport.currentLevel.description} speed={10} />
                </p>
              </div>
              
              <div>
                <div className="text-2xl text-[--color-neon-pink] font-bold">
                  {playerProfile.reputationPoints.toLocaleString('en-US')} PR
                </div>
                {reputationReport.currentLevel.nextLevel && (
                  <div className="mt-2">
                    <div className="text-sm text-[--color-text-secondary]">
                      Prochain niveau: {reputationReport.currentLevel.nextLevel.toLocaleString('en-US')} PR
                    </div>
                    <div className="w-full bg-black/50 rounded-full h-2 mt-1 border border-gray-700">
                      <div 
                        className="bg-[--color-neon-cyan] h-2 rounded-full" 
                        style={{ width: `${reputationReport.progressToNext}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-[--color-text-secondary] mt-1">
                      {reputationReport.progressToNext}% vers le niveau suivant
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="bg-white/5 p-6 rounded-lg border border-[--color-border-dark]">
            <h2 className="text-2xl text-[--color-neon-pink] font-bold mb-4">Statistiques</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[--color-text-secondary]">Missions réussies:</span>
                <span className="text-[--color-text-primary] font-bold">{reputationReport.statistics.missionsCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[--color-text-secondary]">Missions échouées:</span>
                <span className="text-[--color-text-primary] font-bold">{reputationReport.statistics.missionsFailed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[--color-text-secondary]">Taux de réussite:</span>
                <span className="text-[--color-text-primary] font-bold">{reputationReport.statistics.successRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[--color-text-secondary]">PR gagnés:</span>
                <span className="text-green-400 font-bold">+{reputationReport.statistics.totalGained.toLocaleString('en-US')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[--color-text-secondary]">Perdus:</span>
                <span className="text-red-400 font-bold">-{reputationReport.statistics.totalLost.toLocaleString('en-US')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Avantages du niveau */}
        <div className="bg-white/5 p-6 rounded-lg border border-[--color-border-dark] mb-8">
          <h2 className="text-2xl text-[--color-neon-pink] font-bold mb-4">Avantages du Niveau</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg text-[--color-text-primary] font-bold mb-2">Types de Missions</h3>
              <p className="text-[--color-text-secondary]">
                <Typewriter text={reputationReport.currentLevel.missions} speed={10} />
              </p>
            </div>
            <div>
              <h3 className="text-lg text-[--color-text-primary] font-bold mb-2">Équipement Disponible</h3>
              <p className="text-[--color-text-secondary]">
                <Typewriter text={reputationReport.currentLevel.equipment} speed={10} />
              </p>
            </div>
          </div>
        </div>

        {/* Échelle de réputation */}
        <div className="bg-white/5 p-6 rounded-lg border border-[--color-border-dark] mb-8">
          <h2 className="text-2xl text-[--color-neon-pink] font-bold mb-4">L&apos;Échelle de Night City</h2>
          <div className="space-y-4">
            {[
              getReputationLevelInfo(0),
              getReputationLevelInfo(151),
              getReputationLevelInfo(501),
              getReputationLevelInfo(1200)
            ].map((tier) => (
              <div key={tier.level} className={`flex items-center justify-between p-3 rounded ${reputationReport.currentLevel.level === tier.level ? 'bg-[--color-neon-cyan]/10 border border-[--color-neon-cyan]' : 'bg-black/30'}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${tier.level === 1 ? 'text-gray-400' : tier.level === 2 ? 'text-blue-400' : tier.level === 3 ? 'text-purple-400' : 'text-yellow-400'}`}>Niv. {tier.level}</span>
                  <span className={`font-bold ${tier.level === 1 ? 'text-gray-400' : tier.level === 2 ? 'text-blue-400' : tier.level === 3 ? 'text-purple-400' : 'text-yellow-400'}`}>{tier.title}</span>
                </div>
                <span className="text-[--color-text-secondary] text-sm">
                  {tier.level === 1 && '0 - 150 PR'}
                  {tier.level === 2 && '151 - 500 PR'}
                  {tier.level === 3 && '501 - 1199 PR'}
                  {tier.level === 4 && '1200+ PR'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 