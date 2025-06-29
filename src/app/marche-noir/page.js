'use client';
import { useState, useEffect } from 'react';
import ButtonWithLoading from '@/components/ButtonWithLoading';
import Typewriter from '@/components/Typewriter';

export default function MarcheNoirPage() {
  const [marketData, setMarketData] = useState(null);
  const [playerProfile, setPlayerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState({});
  const [activeVendor, setActiveVendor] = useState('charcudoc');
  const [vendorMessage, setVendorMessage] = useState('Bienvenue dans le Marché de l&apos;Ombre, Fixer. Choisis ton vendeur.');
  const [rotatingStock, setRotatingStock] = useState(false);
  const [timeUntilRestock, setTimeUntilRestock] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const fetchMarketData = async () => {
    try {
      const [marketResponse, profileResponse] = await Promise.all([
        fetch('/api/market/programs'),
        fetch('/api/player/profile')
      ]);

      if (marketResponse.ok) {
        const marketData = await marketResponse.json();
        setMarketData(marketData);
      }

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setPlayerProfile(profileData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown pour le restock
  useEffect(() => {
    const updateCountdown = () => {
      if (marketData?.marketState?.nextRotation) {
        const now = new Date().getTime();
        const nextRotation = new Date(marketData.marketState.nextRotation).getTime();
        const timeLeft = nextRotation - now;

        if (timeLeft > 0) {
          const hours = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
          
          setTimeUntilRestock({ hours, minutes, seconds });
        } else {
          setTimeUntilRestock({ hours: 0, minutes: 0, seconds: 0 });
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [marketData]);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const handlePurchase = async (itemId) => {
    setPurchasing(prev => ({ ...prev, [itemId]: true }));
    try {
      const response = await fetch('/api/market/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId }),
      });

      if (response.ok) {
        const result = await response.json();
        setVendorMessage(`Transaction réussie ! ${result.item.name} ajouté à ton inventaire.`);
        await fetchMarketData(); // Recharger les données
      } else {
        const error = await response.text();
        setVendorMessage(`Erreur: ${error}`);
      }
    } catch (error) {
      setVendorMessage('Erreur de connexion au réseau.');
    } finally {
      setPurchasing(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRotateStock = async () => {
    setRotatingStock(true);
    try {
      const response = await fetch('/api/market/rotate-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setVendorMessage(`Stock régénéré ! ${result.details.signatureStocksReset} stocks Signature et ${result.details.dailyLimitsReset} limites quotidiennes réinitialisées.`);
        await fetchMarketData(); // Recharger les données
      } else {
        const error = await response.text();
        setVendorMessage(`Erreur lors de la régénération: ${error}`);
      }
    } catch (error) {
      setVendorMessage('Erreur de connexion au réseau.');
    } finally {
      setRotatingStock(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'legendary': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getRarityBorder = (rarity) => {
    switch (rarity) {
      case 'common': return 'border-gray-400';
      case 'uncommon': return 'border-green-400';
      case 'rare': return 'border-blue-400';
      case 'legendary': return 'border-purple-400';
      default: return 'border-gray-400';
    }
  };

  const getVendorColor = (vendorKey) => {
    switch (vendorKey) {
      case 'charcudoc': return 'text-red-400';
      case 'netrunner_fantome': return 'text-cyan-400';
      case 'informatrice': return 'text-green-400';
      case 'anarchiste': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getVendorBgColor = (vendorKey) => {
    switch (vendorKey) {
      case 'charcudoc': return 'bg-red-400/10 border-red-400/30';
      case 'netrunner_fantome': return 'bg-cyan-400/10 border-cyan-400/30';
      case 'informatrice': return 'bg-green-400/10 border-green-400/30';
      case 'anarchiste': return 'bg-orange-400/10 border-orange-400/30';
      default: return 'bg-gray-400/10 border-gray-400/30';
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[--color-neon-cyan] border-t-transparent rounded-full mx-auto"></div>
          <p className="text-[--color-text-secondary] mt-4">Connexion au Marché de l&apos;Ombre...</p>
        </div>
      </main>
    );
  }

  if (!marketData || !playerProfile) {
    return (
      <main className="min-h-screen p-8">
        <div className="text-center">
          <p className="text-[--color-text-secondary]">Erreur de chargement du marché</p>
        </div>
      </main>
    );
  }

  const activeVendorData = marketData.market[activeVendor];
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <main className="page-container">
      <div className="content-wrapper">
        {/* En-tête */}
        <div className="page-header">
          <div className="card">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[--color-neon-cyan] rounded-full flex items-center justify-center text-2xl">
                🏪
              </div>
              <div>
                <h1 className="page-title">Le Marché de l&apos;Ombre</h1>
                <p className="page-subtitle">L&apos;arsenal du Fixer</p>
              </div>
            </div>
            
            <div className="bg-black/30 p-4 rounded border border-[--color-neon-cyan]/30">
              <p className="text-[--color-text-primary] italic">
                <Typewriter text={vendorMessage} speed={40} />
              </p>
            </div>
            
            {/* Timer countdown pour le restock */}
            {marketData.marketState && (
              <div className="mt-4 p-3 bg-gradient-to-r from-[--color-neon-cyan]/10 to-[--color-neon-pink]/10 rounded-lg border border-[--color-neon-cyan]/30">
                <div className="text-center">
                  <div className="text-xs text-[--color-text-secondary] mb-1">
                    ⏰ Prochain Restock
                  </div>
                  <div className="flex justify-center items-center gap-2 text-lg font-mono">
                    <div className="bg-black/50 px-2 py-1 rounded border border-[--color-neon-cyan]/50">
                      <span className="text-[--color-neon-cyan]">{String(timeUntilRestock.hours).padStart(2, '0')}</span>
                      <span className="text-[--color-text-secondary] text-xs ml-1">h</span>
                    </div>
                    <span className="text-[--color-text-secondary]">:</span>
                    <div className="bg-black/50 px-2 py-1 rounded border border-[--color-neon-cyan]/50">
                      <span className="text-[--color-neon-cyan]">{String(timeUntilRestock.minutes).padStart(2, '0')}</span>
                      <span className="text-[--color-text-secondary] text-xs ml-1">m</span>
                    </div>
                    <span className="text-[--color-text-secondary]">:</span>
                    <div className="bg-black/50 px-2 py-1 rounded border border-[--color-neon-cyan]/50">
                      <span className="text-[--color-neon-cyan]">{String(timeUntilRestock.seconds).padStart(2, '0')}</span>
                      <span className="text-[--color-text-secondary] text-xs ml-1">s</span>
                    </div>
                  </div>
                  <div className="text-xs text-[--color-text-secondary] mt-1">
                    Restock automatique à {marketData.marketState.config?.rotationHour || 3}h00
                  </div>
                </div>
              </div>
            )}

            {/* Bouton de régénération en développement */}
            {isDevelopment && (
              <div className="mt-4">
                <ButtonWithLoading
                  onClick={handleRotateStock}
                  isLoading={rotatingStock}
                  loadingText="RÉGÉNÉRATION..."
                  className="btn-primary"
                >
                  🔄 Régénérer Stocks & Limites (DEV)
                </ButtonWithLoading>
                <p className="text-xs text-orange-400 mt-1">
                  Réinitialise les stocks Signature et limites quotidiennes
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sélection des vendeurs */}
        <div className="section-spacing">
          <h2 className="card-title mb-4">Vendeurs</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(marketData.vendors).map(([vendorKey, vendor]) => (
              <button
                key={vendorKey}
                onClick={() => {
                  setActiveVendor(vendorKey);
                  setVendorMessage(`${vendor.name} : ${vendor.description}`);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeVendor === vendorKey 
                    ? getVendorBgColor(vendorKey) + ' border-opacity-100' 
                    : 'bg-black/30 border-[--color-border-dark] hover:border-opacity-50'
                }`}
              >
                <div className="text-2xl mb-2">{vendor.icon}</div>
                <h3 className={`font-bold ${getVendorColor(vendorKey)}`}>{vendor.name}</h3>
                <p className="text-xs text-[--color-text-secondary] mt-1">{vendor.specialty}</p>
                <p className="text-xs text-[--color-text-secondary] mt-2">
                  {marketData.market[vendorKey]?.items?.length || 0} items
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Catalogue du vendeur actif */}
        {activeVendorData && (
          <div>
            <div className="mb-6">
              <h2 className="card-title mb-2">
                {activeVendorData.icon} {activeVendorData.name}
              </h2>
              <p className="page-subtitle">{activeVendorData.description}</p>
            </div>

            {activeVendorData.items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏪</div>
                <p className="empty-state-text">
                  Aucun objet disponible pour ton niveau de Street Cred.
                </p>
              </div>
            ) : (
              <div className="items-grid">
                {activeVendorData.items.map((item) => {
                  const canAfford = playerProfile.eddies >= item.cost;
                  const hasStreetCred = playerProfile.reputationPoints >= item.streetCredRequired;
                  const isAvailable = !item.isSignature || (item.available !== false);
                  
                  return (
                    <div
                      key={item.id}
                      className={`card ${
                        getRarityBorder(item.rarity)
                      } ${!canAfford || !hasStreetCred || !isAvailable ? 'opacity-50' : 'hover:border-opacity-100'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg text-[--color-text-primary] font-bold">{item.name}</h3>
                        <span className={`badge ${getRarityColor(item.rarity)}`}>
                          {item.rarity.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-sm text-[--color-text-secondary] mb-4">
                        {item.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Prix:</span>
                          <span className={canAfford ? 'text-green-400' : 'text-red-400'}>
                            {item.cost.toLocaleString('en-US')} €$
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Street Cred requis:</span>
                          <span className={hasStreetCred ? 'text-green-400' : 'text-red-400'}>
                            {item.streetCredRequired} PR
                          </span>
                        </div>
                        {item.isSignature && (
                          <div className="flex justify-between text-sm">
                            <span>Stock:</span>
                            <span className={item.available ? 'text-green-400' : 'text-red-400'}>
                              {item.currentStock || 0} disponible
                            </span>
                          </div>
                        )}
                        {item.dailyLimit && (
                          <div className="flex justify-between text-sm">
                            <span>Limite quotidienne:</span>
                            <span className={item.dailyLimit.remaining > 0 ? 'text-green-400' : 'text-red-400'}>
                              {item.dailyLimit.current}/{item.dailyLimit.max} par jour
                            </span>
                          </div>
                        )}
                      </div>

                      <ButtonWithLoading
                        onClick={() => handlePurchase(item.id)}
                        isLoading={purchasing[item.id]}
                        loadingText="ACHAT..."
                        disabled={!canAfford || !hasStreetCred || !isAvailable || (item.dailyLimit && item.dailyLimit.remaining <= 0)}
                        className={`w-full font-bold py-2 px-4 rounded transition-all ${
                          canAfford && hasStreetCred && isAvailable && (!item.dailyLimit || item.dailyLimit.remaining > 0)
                            ? 'btn-primary'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {!canAfford ? 'Fonds insuffisants' : 
                         !hasStreetCred ? 'Street Cred insuffisant' : 
                         !isAvailable ? 'Stock épuisé' :
                         (item.dailyLimit && item.dailyLimit.remaining <= 0) ? 'Limite quotidienne atteinte' :
                         `Acheter (${item.cost.toLocaleString('en-US')} €$)`}
                      </ButtonWithLoading>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}