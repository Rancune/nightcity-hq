'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import Typewriter from '@/components/Typewriter';

export default function FactionRelationsPage() {
  const [factionData, setFactionData] = useState(null);
  const [loading, setLoading] = useState(true);
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
      case 'Allié': return 'text-green-400';
      case 'Ami': return 'text-blue-400';
      case 'Favorable': return 'text-cyan-400';
      case 'Neutre': return 'text-gray-400';
      case 'Hostile': return 'text-orange-400';
      case 'Ennemi': return 'text-red-400';
      case 'Mortel': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'megacorp': return 'text-yellow-400';
      case 'gang': return 'text-red-400';
      case 'authority': return 'text-blue-400';
      case 'political': return 'text-purple-400';
      case 'underground': return 'text-green-400';
      case 'other': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getRelationBarColor = (value) => {
    if (value >= 500) return 'bg-green-400';
    if (value >= 200) return 'bg-blue-400';
    if (value >= 50) return 'bg-cyan-400';
    if (value >= -50) return 'bg-gray-400';
    if (value >= -200) return 'bg-orange-400';
    if (value >= -500) return 'bg-red-400';
    return 'bg-purple-400';
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[--color-neon-cyan] border-t-transparent rounded-full mx-auto"></div>
          <p className="text-[--color-text-secondary] mt-4">Chargement des relations de faction...</p>
        </div>
      </main>
    );
  }

  if (!factionData) {
    return (
      <main className="min-h-screen p-8">
        <div className="text-center">
          <p className="text-[--color-text-secondary]">Erreur lors du chargement des relations de faction.</p>
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

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl text-[--color-neon-cyan] font-bold mb-4">Relations de Faction</h1>
          <p className="text-[--color-text-secondary]">
            <Typewriter text="Night City est une toile de relations que vous tissez et déchirez par vos actions. Chaque contrat a des conséquences sur vos alliances et rivalités." speed={30} />
          </p>
        </div>

        {/* Historique récent */}
        {factionData.history && factionData.history.length > 0 && (
          <div className="bg-white/5 p-6 rounded-lg border border-[--color-border-dark] mb-8">
            <h2 className="text-2xl text-[--color-neon-pink] font-bold mb-4">Historique Récent</h2>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {factionData.history.map((event, index) => (
                <div key={index} className="text-sm text-[--color-text-secondary]">
                  <span className="text-[--color-neon-cyan]">{event.faction}</span>: {event.change > 0 ? '+' : ''}{event.change} - {event.reason}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Relations par type */}
        {Object.entries(factionGroups).map(([type, factions]) => (
          <div key={type} className="mb-8">
            <h2 className={`text-2xl font-bold mb-4 ${getTypeColor(type)}`}>
              {type === 'megacorp' ? 'Mégacorpos' : 
               type === 'gang' ? 'Gangs' : 
               type === 'authority' ? 'Autorités' : 
               type === 'political' ? 'Instances Politiques' :
               type === 'underground' ? 'Inframonde & Civils' : 'Autres'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {factions.map(([factionKey, faction]) => (
                <div key={factionKey} className="bg-white/5 p-6 rounded-lg border border-[--color-border-dark]">
                  <div className="mb-4">
                    <h3 className="text-xl text-[--color-text-primary] font-bold mb-2">{faction.name}</h3>
                    <p className="text-sm text-[--color-text-secondary] mb-3">{faction.description}</p>
                    
                    {/* Monnaie et riposte */}
                    <div className="mb-3 text-xs">
                      <p className="text-[--color-neon-cyan] mb-1">
                        <strong>Monnaie:</strong> {faction.currency}
                      </p>
                      <p className="text-[--color-neon-pink] mb-1">
                        <strong>Riposte:</strong> {faction.retaliation}
                      </p>
                    </div>

                    {/* Barre de relation */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className={getStatusColor(faction.status)}>{faction.status}</span>
                        <span className="text-[--color-text-secondary]">{faction.relationValue}</span>
                      </div>
                      <div className="w-full bg-black/50 rounded-full h-2 border border-gray-700">
                        <div 
                          className={`h-2 rounded-full ${getRelationBarColor(faction.relationValue)}`}
                          style={{ 
                            width: `${Math.max(0, Math.min(100, (faction.relationValue + 1000) / 20))}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Niveau de menace */}
                    {faction.threatLevel > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-red-400">Niveau de menace: {faction.threatLevel}/10</p>
                      </div>
                    )}

                    {/* Conséquences */}
                    {faction.consequences.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-red-400 font-bold mb-1">Conséquences:</p>
                        <ul className="text-xs text-red-300 space-y-1">
                          {faction.consequences.map((consequence, idx) => (
                            <li key={idx}>• {consequence.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Opportunités */}
                    {faction.opportunities.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-green-400 font-bold mb-1">Opportunités:</p>
                        <ul className="text-xs text-green-300 space-y-1">
                          {faction.opportunities.map((opportunity, idx) => (
                            <li key={idx}>• {opportunity.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Bouton retour */}
        <div className="text-center mt-8">
          <Link href="/" className="text-[--color-neon-cyan] hover:underline">
            &larr; Retour au dashboard
          </Link>
        </div>
      </div>
    </main>
  );
} 