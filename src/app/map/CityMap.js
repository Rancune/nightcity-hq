'use client';
import { useState, useEffect } from 'react';
import ContractMarker from './ContractMarker';
import MissionBriefing from './MissionBriefing';
import styles from './CityMap.module.css';
import Image from 'next/image';

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
  const [disappearingIds, setDisappearingIds] = useState([]);
  const [markerPositions, setMarkerPositions] = useState({});

  // Debug: afficher les contrats reçus
  useEffect(() => {
    console.log('[CITYMAP] Contrats reçus:', contracts);
    console.log('[CITYMAP] Nombre de contrats:', contracts.length);
  }, [contracts]);

  // Générer et mémoriser la position aléatoire de chaque contrat uniquement à l'arrivée d'un nouveau contrat
  useEffect(() => {
    console.log('[CITYMAP] Génération des positions pour', contracts.length, 'contrats');
    setMarkerPositions((prev) => {
      const newPositions = { ...prev };
      contracts.forEach(contract => {
        const key = contract._id || contract.id;
        console.log('[CITYMAP] Traitement du contrat:', key, contract.title);
        if (!newPositions[key]) {
          newPositions[key] = contract.position || getRandomPositionOnMap();
          console.log('[CITYMAP] Nouvelle position générée pour', key, ':', newPositions[key]);
        }
      });
      // Nettoyer les positions des contrats disparus
      Object.keys(newPositions).forEach(key => {
        if (!contracts.find(c => (c._id || c.id) === key)) {
          console.log('[CITYMAP] Suppression de la position pour', key);
          delete newPositions[key];
        }
      });
      console.log('[CITYMAP] Positions finales:', newPositions);
      return newPositions;
    });
  }, [contracts]);

  // Fonction pour gérer le clic sur un marqueur
  const handleContractClick = (contract) => {
    setSelectedContract(contract);
  };

  // Fonction pour gérer l'acceptation d'un contrat
  const handleContractAccept = async (contract) => {
    const contractId = contract._id || contract.id;
    setDisappearingIds((ids) => [...ids, contractId]);
    setTimeout(async () => {
      try {
        const response = await fetch(`/api/contrats/${contractId}/accept`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
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
    }, 500); // attendre la fin de l'animation de disparition
  };

  // Fonction appelée à la fin de l'animation de disparition
  const handleDisappearEnd = (id) => {
    setDisappearingIds((ids) => ids.filter((d) => d !== id));
  };

  // Fonction pour fermer le briefing
  const handleCloseBriefing = () => {
    setSelectedContract(null);
  };

  // Calcul du style de zoom si un contrat est sélectionné
  let zoomStyle = {};
  let zoomed = false;
  if (selectedContract && markerPositions[selectedContract.id]) {
    zoomed = true;
    const pos = markerPositions[selectedContract.id];
    zoomStyle = {
      transform: `scale(1.7) translate(calc(50% - ${pos.x}), calc(50% - ${pos.y}))`,
      transition: 'transform 0.5s cubic-bezier(0.4,2,0.6,0.8)',
      zIndex: 100,
    };
  }

  return (
    <div className={styles.cityMapContainer + (zoomed ? ' ' + styles.zoomed : '')} style={zoomed ? zoomStyle : {}}>
      {/* Image de fond de Night City */}
      <div className={styles.mapBackground}>
        <Image 
          src="/nightcity-generic-map.jpg" 
          alt="Night City Map" 
          className={styles.cityImage}
          layout="fill"
          objectFit="cover"
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
        {contracts.map((contract) => {
          const key = contract._id || contract.id;
          return (
            <ContractMarker
              key={key}
              contract={{
                ...contract,
                position: markerPositions[key]
              }}
              size={56}
              onClick={handleContractClick}
              onHover={setHoveredContract}
              onHoverEnd={() => setHoveredContract(null)}
              isDisappearing={disappearingIds.includes(key)}
              onDisappearEnd={handleDisappearEnd}
            />
          );
        })}
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