'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Typewriter from '@/components/Typewriter';

export default function FactionRelationsPage() {
  const [factionData, setFactionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const { isSignedIn, isLoaded } = useAuth();

  const fetchFactionRelations = async () => {
    try {
      const response = await fetch('/api/player/faction-relations');
      if (response.ok) {
        const data = await response.json();
        setFactionData(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des relations de faction:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchFactionRelations();
    }
  }, [isLoaded, isSignedIn]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Allié': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'Ami': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'Favorable': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30';
      case 'Neutre': return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
      case 'Hostile': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'Ennemi': return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'Mortel': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'megacorp': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'gang': return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'authority': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'political': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      case 'underground': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'other': return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getRelationBarColor = (value) => {
    if (value >= 500) return 'bg-gradient-to-r from-green-400 to-green-600';
    if (value >= 200) return 'bg-gradient-to-r from-blue-400 to-blue-600';
    if (value >= 50) return 'bg-gradient-to-r from-cyan-400 to-cyan-600';
    if (value >= -50) return 'bg-gradient-to-r from-gray-400 to-gray-600';
    if (value >= -200) return 'bg-gradient-to-r from-orange-400 to-orange-600';
    if (value >= -500) return 'bg-gradient-to-r from-red-400 to-red-600';
    return 'bg-gradient-to-r from-purple-400 to-purple-600';
  };

  const getThreatColor = (level) => {
    if (level <= 3) return 'text-green-400';
    if (level <= 6) return 'text-yellow-400';
    if (level <= 8) return 'text-orange-400';
    return 'text-red-400';
  };

  // Icônes SVG personnalisées pour chaque niveau de menace
  const ThreatIcons = {
    low: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(40, 167, 69)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    ),
    medium: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(255, 193, 7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    ),
    high: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(253, 126, 20)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="22" y1="12" x2="18" y2="12"></line>
        <line x1="6" y1="12" x2="2" y2="12"></line>
        <line x1="12" y1="6" x2="12" y2="2"></line>
        <line x1="12" y1="22" x2="12" y2="18"></line>
      </svg>
    ),
    max: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(220, 53, 69)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"></path>
        <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"></path>
        <path d="M12 18h.01"></path>
        <path d="M7 18h.01"></path>
        <path d="M17 18h.01"></path>
      </svg>
    )
  };

  // Fonction utilitaire pour l'icône de menace
  const getThreatIcon = (level) => {
    if (level >= 10) return <span title="Menace maximale">{ThreatIcons.max}</span>;
    if (level >= 7) return <span title="Menace élevée">{ThreatIcons.high}</span>;
    if (level >= 4) return <span title="Menace modérée">{ThreatIcons.medium}</span>;
    if (level >= 1) return <span title="Menace faible">{ThreatIcons.low}</span>;
    return null;
  };

  const factionTypes = [
    { key: 'all', label: 'Toutes', icon: '🌐' },
    { key: 'megacorp', label: 'Mégacorpos', icon: '🏢' },
    { key: 'gang', label: 'Gangs', icon: '⚔️' },
    { key: 'authority', label: 'Autorités', icon: '👮' },
    { key: 'political', label: 'Politique', icon: '🏛️' },
    { key: 'underground', label: 'Inframonde', icon: '🕵️' },
    { key: 'other', label: 'Autres', icon: '❓' }
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[--color-neon-cyan] border-t-transparent rounded-full mx-auto"></div>
          <p className="text-[--color-text-secondary] mt-6 text-lg">Analyse des réseaux de Night City...</p>
        </div>
      </main>
    );
  }

  if (!factionData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
        <div className="text-center">
          <p className="text-[--color-text-secondary] text-lg">Erreur lors du chargement des relations de faction.</p>
        </div>
      </main>
    );
  }

  const factionGroups = {
    megacorp: Object.entries(factionData.factionRelations).filter(([_, faction]) => faction.type === 'megacorp'),
    gang: Object.entries(factionData.factionRelations).filter(([_, faction]) => faction.type === 'gang'),
    authority: Object.entries(factionData.factionRelations).filter(([_, faction]) => faction.type === 'authority'),
    political: Object.entries(factionData.factionRelations).filter(([_, faction]) => faction.type === 'political'),
    underground: Object.entries(factionData.factionRelations).filter(([_, faction]) => faction.type === 'underground'),
    other: Object.entries(factionData.factionRelations).filter(([_, faction]) => faction.type === 'other')
  };

  const allFactions = Object.entries(factionData.factionRelations);
  const displayedFactions = selectedType === 'all' ? allFactions : factionGroups[selectedType] || [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête avec navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl text-[--color-neon-cyan] font-bold mb-2">
                Relations de Faction
              </h1>
              <p className="text-[--color-text-secondary] text-lg max-w-3xl">
                <Typewriter 
                  text="Night City est une toile de relations que vous tissez et déchirez par vos actions. Chaque contrat a des conséquences sur vos alliances et rivalités." 
                  speed={10} 
                />
              </p>
            </div>
            {/* Le lien Dashboard a été retiré ici */}
          </div>

          {/* Navigation par type */}
          <div className="flex flex-wrap gap-2 mb-6">
            {factionTypes.map((type) => (
              <button
                key={type.key}
                onClick={() => setSelectedType(type.key)}
                className={`px-4 py-2 rounded-lg border transition-all duration-300 flex items-center gap-2 ${
                  selectedType === type.key
                    ? 'bg-[--color-neon-cyan]/20 border-[--color-neon-cyan]/50 text-[--color-neon-cyan]'
                    : 'bg-white/5 border-white/10 text-[--color-text-secondary] hover:bg-white/10'
                }`}
              >
                <span>{type.icon}</span>
                <span className="hidden sm:inline">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Résumé global */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-green-400/10 to-green-600/10 border border-green-400/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">
              {allFactions.filter(([_, f]) => f.status === 'Allié' || f.status === 'Ami').length}
            </div>
            <div className="text-sm text-green-300">Alliés</div>
          </div>
          <div className="bg-gradient-to-r from-blue-400/10 to-blue-600/10 border border-blue-400/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">
              {allFactions.filter(([_, f]) => f.status === 'Neutre' || f.status === 'Favorable').length}
            </div>
            <div className="text-sm text-blue-300">Neutres</div>
          </div>
          <div className="bg-gradient-to-r from-red-400/10 to-red-600/10 border border-red-400/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">
              {allFactions.filter(([_, f]) => f.status === 'Hostile' || f.status === 'Ennemi' || f.status === 'Mortel').length}
            </div>
            <div className="text-sm text-red-300">Hostiles</div>
          </div>
          <div className="bg-gradient-to-r from-purple-400/10 to-purple-600/10 border border-purple-400/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">
              {allFactions.filter(([_, f]) => f.threatLevel > 5).length}
            </div>
            <div className="text-sm text-purple-300">Menaces</div>
          </div>
        </div>

        {/* Historique récent */}
        {factionData.history && factionData.history.length > 0 && (
          <div className="bg-gradient-to-r from-[--color-neon-pink]/10 to-[--color-neon-cyan]/10 p-6 rounded-lg border border-[--color-border-dark] mb-8">
            <h2 className="text-2xl text-[--color-neon-pink] font-bold mb-4 flex items-center">
              <span className="mr-3">📊</span>
              Activité Récente
            </h2>
            <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
              {factionData.history.slice(0, 10).map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      event.change > 0 ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'
                    }`}>
                      {event.change > 0 ? '+' : ''}{event.change}
                    </span>
                    <span className="text-[--color-neon-cyan] font-semibold">{event.faction}</span>
                  </div>
                  <span className="text-sm text-[--color-text-secondary]">{event.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liste des factions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedFactions.map(([factionKey, faction]) => (
            <div key={factionKey} className="group bg-gradient-to-br from-white/5 to-white/10 p-6 rounded-xl border border-white/20 hover:border-[--color-neon-cyan]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[--color-neon-cyan]/20">
              {/* En-tête de la carte */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl text-[--color-text-primary] font-bold group-hover:text-[--color-neon-cyan] transition-colors">
                      {faction.name}
                    </h3>
                    {/* Icône de menace */}
                    {getThreatIcon(faction.threatLevel)}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTypeColor(faction.type)}`}>
                    {faction.type === 'megacorp' ? 'Mégacorp' : 
                     faction.type === 'gang' ? 'Gang' : 
                     faction.type === 'authority' ? 'Autorité' : 
                     faction.type === 'political' ? 'Politique' :
                     faction.type === 'underground' ? 'Inframonde' : 'Autre'}
                  </span>
                </div>
                
                <p className="text-sm text-[--color-text-secondary] leading-relaxed mb-4">
                  {faction.description}
                </p>
              </div>

              {/* Informations clés */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-[--color-neon-cyan]/10 border border-[--color-neon-cyan]/30 rounded-lg p-3">
                  <div className="text-xs text-[--color-neon-cyan] font-bold mb-1">MONNAIE</div>
                  <div className="text-sm text-[--color-text-primary]">{faction.currency}</div>
                </div>
                <div className="bg-[--color-neon-pink]/10 border border-[--color-neon-pink]/30 rounded-lg p-3">
                  <div className="text-xs text-[--color-neon-pink] font-bold mb-1">RIPOSTE</div>
                  <div className="text-sm text-[--color-text-primary]">{faction.retaliation}</div>
                </div>
              </div>

              {/* Barre de relation */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(faction.status)}`}>
                    {faction.status}
                  </span>
                  <span className="text-sm text-[--color-text-secondary] font-mono">
                    {faction.relationValue}
                  </span>
                </div>
                <div className="w-full bg-black/50 rounded-full h-3 border border-gray-700 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full ${getRelationBarColor(faction.relationValue)} transition-all duration-500`}
                    style={{ 
                      width: `${Math.max(0, Math.min(100, (faction.relationValue + 1000) / 20))}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Conséquences et Opportunités */}
              <div className="space-y-3">
                {faction.consequences.length > 0 && (
                  <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-3">
                    <div className="text-sm text-red-400 font-bold mb-2 flex items-center">
                      <span className="mr-2">⚠️</span>
                      Conséquences
                    </div>
                    <ul className="text-xs text-red-300 space-y-1">
                      {faction.consequences.map((consequence, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2 mt-1">•</span>
                          <span>{consequence.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {faction.opportunities.length > 0 && (
                  <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-3">
                    <div className="text-sm text-green-400 font-bold mb-2 flex items-center">
                      <span className="mr-2">💎</span>
                      Opportunités
                    </div>
                    <ul className="text-xs text-green-300 space-y-1">
                      {faction.opportunities.map((opportunity, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2 mt-1">•</span>
                          <span>{opportunity.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Légende des niveaux de menace */}
        <div className="mt-10 max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col gap-2">
          <h4 className="text-lg font-bold text-[--color-neon-cyan] mb-2">Légende des niveaux de menace</h4>
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <div className="flex items-center gap-2">
              <span>{ThreatIcons.low}</span>
              <span className="text-sm text-green-400 font-semibold">1-3</span>
              <span className="text-xs text-[--color-text-secondary]">Surveillance (faible)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{ThreatIcons.medium}</span>
              <span className="text-sm text-yellow-400 font-semibold">4-6</span>
              <span className="text-xs text-[--color-text-secondary]">Avertissement (moyenne)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{ThreatIcons.high}</span>
              <span className="text-sm text-orange-400 font-semibold">7-9</span>
              <span className="text-xs text-[--color-text-secondary]">Chasse active (élevée)</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{ThreatIcons.max}</span>
              <span className="text-sm text-red-400 font-semibold">10</span>
              <span className="text-xs text-[--color-text-secondary]">Tuer à vue (max)</span>
            </div>
          </div>
        </div>

        {/* Bouton retour mobile */}
        <div className="text-center mt-8 md:hidden">
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-[--color-neon-cyan]/10 border border-[--color-neon-cyan]/30 rounded-lg hover:bg-[--color-neon-cyan]/20 transition-all duration-300 text-[--color-neon-cyan]"
          >
            <span className="mr-2">←</span>
            Retour au dashboard
          </Link>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 255, 0.5);
        }
      `}</style>
    </main>
  );
} 