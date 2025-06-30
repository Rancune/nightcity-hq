'use client';
import { useState, useEffect } from 'react';
import ContractMarker from './ContractMarker';
import MissionBriefing from './MissionBriefing';
import styles from './CityMap.module.css';

// Fonction pour générer une position aléatoire sur la carte
function getRandomPositionOnMap() {
  // Zone centrale de la carte (éviter les bords)
  const x = Math.random() * 80 + 10; // 10% à 90% de la largeur
  const y = Math.random() * 80 + 10; // 10% à 90% de la hauteur
  
  return { x: `${x}%`, y: `${y}%` };
}

// Composant principal de la carte
export default function CityMap({ contracts = [], onContractAccept }) {
  const [selectedContract, setSelectedContract] = useState(null);
  const [hoveredContract, setHoveredContract] = useState(null);

  // Fonction pour gérer le clic sur un marqueur
  const handleContractClick = (contract) => {
    setSelectedContract(contract);
  };

  // Fonction pour gérer l'acceptation d'un contrat
  const handleContractAccept = async (contract) => {
    try {
      const response = await fetch(`/api/contrats/${contract.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Le contrat a été accepté avec succès
        if (onContractAccept) {
          onContractAccept(contract);
        }
        setSelectedContract(null);
      } else {
        throw new Error('Erreur lors de l\'acceptation du contrat');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'acceptation du contrat');
    }
  };

  // Fonction pour fermer le briefing
  const handleCloseBriefing = () => {
    setSelectedContract(null);
  };

  return (
    <div className={styles.cityMapContainer}>
      {/* Image de fond de Night City */}
      <div className={styles.mapBackground}>
        <img 
          src="/nightcity-generic-map.jpg" 
          alt="Night City Map" 
          className={styles.cityImage}
        />
      </div>

      {/* Effets holographiques */}
      <div className={styles.scanlines}></div>
      <div className={styles.noise}></div>
      <div className={styles.glitch}></div>
      <div className={styles.holographicOverlay}></div>

      {/* Contrôles */}
      <div className={styles.controls}>
        <button className={styles.controlButton}>
          FILTRES
        </button>
        <button className={styles.controlButton}>
          ZOOM
        </button>
      </div>

      {/* Informations de la carte */}
      <div className={styles.mapInfo}>
        <h3>NIGHT CITY - CARTE TACTIQUE</h3>
        <p>Contrats actifs: {contracts.length}</p>
        <p>Statut: EN LIGNE</p>
        <p>Mise à jour: {new Date().toLocaleTimeString()}</p>
      </div>

      {/* Marqueurs de contrats */}
      <div className={styles.markersContainer}>
        {contracts.map((contract) => (
          <ContractMarker
            key={contract.id}
            contract={{
              ...contract,
              position: contract.position || getRandomPositionOnMap()
            }}
            onClick={handleContractClick}
            onHover={setHoveredContract}
            onHoverEnd={() => setHoveredContract(null)}
          />
        ))}
      </div>

      {/* Fenêtre de briefing */}
      {selectedContract && (
        <MissionBriefing
          contract={selectedContract}
          onClose={handleCloseBriefing}
          onAccept={handleContractAccept}
        />
      )}
    </div>
  );
} 