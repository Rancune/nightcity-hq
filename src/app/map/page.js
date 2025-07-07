'use client';
import { useState, useEffect } from 'react';
import CityMap from './CityMap';
import { useRouter } from 'next/navigation';
import ButtonWithLoading from '@/components/ButtonWithLoading';

export default function ContractBoardPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const router = useRouter();

  // Charger les contrats disponibles
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        console.log('[MAP] Chargement des contrats...');
        const response = await fetch('/api/contrats?status=Proposé&ownerId=null');
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des contrats');
        }
        
        const data = await response.json();
        console.log('[MAP] Contrats récupérés:', data);
        console.log('[MAP] Nombre de contrats:', data.length);
        
        if (Array.isArray(data)) {
          data.forEach((contract, index) => {
            console.log(`[MAP] Contrat ${index}:`, {
              id: contract._id,
              title: contract.title,
              status: contract.status,
              ownerId: contract.ownerId
            });
          });
        }
        
        setContracts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erreur:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  // Générer un contrat
  const handleGenerateContract = async () => {
    setIsGeneratingContract(true);
    try {
      const response = await fetch('/api/contrats/generate', { method: 'POST' });
      if (response.ok) {
        // Recharger les contrats après génération
        const refreshed = await fetch('/api/contrats?status=Proposé&ownerId=null');
        if (refreshed.ok) {
          const data = await refreshed.json();
          setContracts(Array.isArray(data) ? data : []);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la génération du contrat:', error);
    } finally {
      setIsGeneratingContract(false);
    }
  };

  // Gérer l'acceptation d'un contrat
  const handleContractAccept = (acceptedContract) => {
    // Retirer le contrat accepté de la liste
    setContracts(prevContracts => 
      prevContracts.filter(contract => contract._id !== acceptedContract._id)
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
      {/* Bouton Générer Contrat */}
      <div className="flex justify-end mb-6">
        <ButtonWithLoading
          onClick={handleGenerateContract}
          isLoading={isGeneratingContract}
          loadingText="GÉNÉRATION..."
          className="btn-primary"
        >
          Générer Contrat
        </ButtonWithLoading>
      </div>

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