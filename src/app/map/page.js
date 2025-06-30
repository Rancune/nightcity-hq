'use client';
import { useState, useEffect } from 'react';
import CityMap from './CityMap';
import { useRouter } from 'next/navigation';

export default function ContractBoardPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Charger les contrats disponibles
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/contrats?status=Proposé&ownerId=null');
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des contrats');
        }
        
        const data = await response.json();
        setContracts(data.contrats || []);
      } catch (err) {
        console.error('Erreur:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  // Gérer l'acceptation d'un contrat
  const handleContractAccept = (acceptedContract) => {
    // Retirer le contrat accepté de la liste
    setContracts(prevContracts => 
      prevContracts.filter(contract => contract.id !== acceptedContract.id)
    );
    
    // Rediriger vers la page des contrats du joueur
    router.push('/contrats');
  };

  // Recharger les contrats
  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-pink mx-auto"></div>
          <p className="mt-4 text-neon-pink">Chargement de la carte de Night City...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Erreur</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="bg-neon-pink text-black px-4 py-2 rounded hover:bg-pink-400 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-neon-pink mb-2">
          🗺️ Carte des Contrats - Night City
        </h1>
        <p className="text-gray-300">
          Surveillez les opportunités qui apparaissent sur le réseau. 
          Interceptez les contrats avant qu'ils ne soient pris par d'autres Fixers.
        </p>
      </div>

      {/* Carte interactive */}
      <div className="mb-8">
        <CityMap 
          contracts={contracts}
          onContractAccept={handleContractAccept}
        />
      </div>
    </div>
  );
} 