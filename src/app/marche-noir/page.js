'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import Typewriter from '@/components/Typewriter';
import MarketTimer from '@/components/MarketTimer';

// Base de données des objets du marché
const MARKET_ITEMS = {
  equipment: [
    {
      id: 'cyberdeck-1',
      name: 'Cyberdeck Avancé',
      description: 'Améliore les capacités de hacking de vos runners.',
      price: 2000,
      type: 'equipment',
      effect: 'hacking_boost'
    },
    {
      id: 'stealth-suit-1',
      name: 'Stealth Suit',
      description: 'Augmente les chances de discrétion en mission.',
      price: 1500,
      type: 'equipment',
      effect: 'stealth_boost'
    },
    {
      id: 'combat-rig-1',
      name: 'Combat Rig',
      description: 'Améliore les capacités de combat de vos runners.',
      price: 1800,
      type: 'equipment',
      effect: 'combat_boost'
    },
    {
      id: 'neural-link-1',
      name: 'Neural Link Pro',
      description: 'Interface neuronale pour une meilleure coordination.',
      price: 2500,
      type: 'equipment',
      effect: 'all_boost'
    }
  ],
  consumables: [
    {
      id: 'stim-combat-1',
      name: 'Stimulant Combat',
      description: 'Boost temporaire des capacités de combat.',
      price: 300,
      type: 'consumable',
      effect: 'combat_temp'
    },
    {
      id: 'repair-kit-1',
      name: 'Kit de Réparation',
      description: 'Répare les dégâts subis par vos runners.',
      price: 500,
      type: 'consumable',
      effect: 'heal'
    },
    {
      id: 'hack-boost-1',
      name: 'Hack Booster',
      description: 'Améliore temporairement les capacités de hacking.',
      price: 400,
      type: 'consumable',
      effect: 'hacking_temp'
    },
    {
      id: 'stealth-boost-1',
      name: 'Stealth Booster',
      description: 'Améliore temporairement les capacités de discrétion.',
      price: 350,
      type: 'consumable',
      effect: 'stealth_temp'
    }
  ]
};

export default function MarcheNoirPage() {
  const [playerProfile, setPlayerProfile] = useState(null);
  const [marketItems, setMarketItems] = useState({
    equipment: [],
    consumables: []
  });
  const { isSignedIn, isLoaded } = useAuth();

  // Fonction pour générer un timer aléatoire entre 2 minutes et 6 heures
  const generateRandomTimer = () => {
    const minTime = 2 * 60 * 1000; // 2 minutes
    const maxTime = 6 * 60 * 60 * 1000; // 6 heures
    return new Date(Date.now() + Math.random() * (maxTime - minTime) + minTime);
  };

  // Fonction pour sélectionner des objets aléatoires
  const selectRandomItems = () => {
    const equipment = MARKET_ITEMS.equipment
      .sort(() => 0.5 - Math.random())
      .slice(0, 2)
      .map(item => ({
        ...item,
        endTime: generateRandomTimer()
      }));

    const consumables = MARKET_ITEMS.consumables
      .sort(() => 0.5 - Math.random())
      .slice(0, 2)
      .map(item => ({
        ...item,
        endTime: generateRandomTimer()
      }));

    return { equipment, consumables };
  };

  // Fonction pour régénérer un objet expiré
  const regenerateItem = (type, index) => {
    const availableItems = MARKET_ITEMS[type].filter(item => 
      !marketItems[type].some(existing => existing.id === item.id)
    );
    
    if (availableItems.length > 0) {
      const newItem = {
        ...availableItems[Math.floor(Math.random() * availableItems.length)],
        endTime: generateRandomTimer()
      };

      setMarketItems(prev => ({
        ...prev,
        [type]: prev[type].map((item, i) => i === index ? newItem : item)
      }));
    }
  };

  const fetchPlayerProfile = async () => {
    const response = await fetch('/api/player/sync', { method: 'POST' });
    if (response.ok) {
      const data = await response.json();
      setPlayerProfile(data);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchPlayerProfile();
      // Initialiser les objets du marché avec des timers
      setMarketItems(selectRandomItems());
    }
  }, [isLoaded, isSignedIn]);

  const handleBuyItem = async (item) => {
    if (playerProfile?.eddies >= item.price) {
      // Ici vous pourriez ajouter la logique d'achat
      alert(`Achat de ${item.name} pour ${item.price} €$`);
    } else {
      alert('Fonds insuffisants !');
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Section Équipement */}
        <div className="bg-white/5 p-6 rounded-lg border border-[--color-border-dark]">
          <h2 className="text-2xl text-[--color-neon-pink] font-bold mb-4">Équipement</h2>
          <div className="space-y-4">
            {marketItems.equipment.map((item, index) => (
              <div key={item.id} className="bg-black/30 p-4 rounded">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg text-[--color-text-primary] font-bold">{item.name}</h3>
                  <MarketTimer 
                    endTime={item.endTime} 
                    onExpire={() => regenerateItem('equipment', index)}
                  />
                </div>
                <p className="text-[--color-text-secondary] text-sm mb-2">
                  <Typewriter text={item.description} speed={30} />
                </p>
                <p className="text-[--color-neon-pink] font-bold">Prix: {item.price.toLocaleString()} €$</p>
                <button 
                  onClick={() => handleBuyItem(item)}
                  className="mt-2 bg-[--color-neon-cyan] text-background font-bold py-2 px-4 rounded transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-cyan)] glitch-on-hover"
                >
                  Acheter
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section Consommables */}
        <div className="bg-white/5 p-6 rounded-lg border border-[--color-border-dark]">
          <h2 className="text-2xl text-[--color-neon-pink] font-bold mb-4">Consommables</h2>
          <div className="space-y-4">
            {marketItems.consumables.map((item, index) => (
              <div key={item.id} className="bg-black/30 p-4 rounded">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg text-[--color-text-primary] font-bold">{item.name}</h3>
                  <MarketTimer 
                    endTime={item.endTime} 
                    onExpire={() => regenerateItem('consumables', index)}
                  />
                </div>
                <p className="text-[--color-text-secondary] text-sm mb-2">
                  <Typewriter text={item.description} speed={30} />
                </p>
                <p className="text-[--color-neon-pink] font-bold">Prix: {item.price.toLocaleString()} €$</p>
                <button 
                  onClick={() => handleBuyItem(item)}
                  className="mt-2 bg-[--color-neon-cyan] text-background font-bold py-2 px-4 rounded transition-all duration-200 hover:bg-white hover:text-background hover:shadow-[0_0_15px_var(--color-neon-cyan)] glitch-on-hover"
                >
                  Acheter
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section Informations */}
        <div className="bg-white/5 p-6 rounded-lg border border-[--color-border-dark]">
          <h2 className="text-2xl text-[--color-neon-pink] font-bold mb-4">Informations</h2>
          <div className="space-y-4">
            <div className="bg-black/30 p-4 rounded">
              <h3 className="text-lg text-[--color-text-primary] font-bold">Solde Actuel</h3>
              <p className="text-[--color-neon-pink] text-2xl font-bold">
                {playerProfile?.eddies?.toLocaleString() || '---'} €$
              </p>
            </div>

            <div className="bg-black/30 p-4 rounded">
              <h3 className="text-lg text-[--color-text-primary] font-bold">Note</h3>
              <p className="text-[--color-text-secondary] text-sm">
                <Typewriter text="Le marché noir propose des équipements illégaux mais efficaces. Les objets ont une durée de disponibilité limitée." speed={40} />
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 