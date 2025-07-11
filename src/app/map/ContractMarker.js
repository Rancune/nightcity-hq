'use client';
import { useState, useEffect } from 'react';
import { cityConfig, getDifficultyColor, getDifficultyPulseSpeed } from '@/lib/cityMapConfig';
import styles from './CityMap.module.css';
import Image from 'next/image';

export default function ContractMarker({ contract, onClick, onHover, onHoverEnd, isDisappearing = false, onDisappearEnd, size = 40 }) {
  const [hovered, setHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [appeared, setAppeared] = useState(false);
  const [disappearing, setDisappearing] = useState(false);
  
  // Debug: afficher les informations du contrat reçu
  useEffect(() => {
    console.log('[MARKER] Contrat reçu:', {
      id: contract.id || contract._id,
      title: contract.title,
      position: contract.position,
      threatLevel: contract.threatLevel,
      missionType: contract.missionType
    });
  }, [contract]);
  
  // Animation d'apparition
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[MARKER] Rendu visible:', contract.title);
      setIsVisible(true);
      setAppeared(true);
      setTimeout(() => setAppeared(false), 600); // durée de l'animation d'apparition
    }, Math.random() * 2000);
    return () => clearTimeout(timer);
  }, [contract.title]);

  // Animation de disparition
  useEffect(() => {
    if (isDisappearing && !disappearing) {
      setDisappearing(true);
      setTimeout(() => {
        if (onDisappearEnd) onDisappearEnd(contract.id);
      }, 500); // durée de l'animation de disparition
    }
  }, [isDisappearing, disappearing, onDisappearEnd, contract.id]);

  // Configuration du marqueur selon le niveau de menace
  const difficultyColor = getDifficultyColor(contract.threatLevel);
  const pulseSpeed = getDifficultyPulseSpeed(contract.threatLevel);

  // Gestion des événements
  const handlePointerOver = () => {
    setHovered(true);
    if (onHover) onHover(contract);
  };

  const handlePointerOut = () => {
    setHovered(false);
    if (onHoverEnd) onHoverEnd();
  };

  const handleClick = () => {
    if (onClick) onClick(contract);
  };

  // Si le marqueur n'est pas encore visible, ne rien afficher
  if (!isVisible && !disappearing) return null;

  const markerStyle = {
    position: 'absolute',
    left: contract.position.x,
    top: contract.position.y,
    transform: 'translate(-50%, -50%)',
    cursor: 'pointer',
    zIndex: hovered ? 100 : 50,
  };

  const pulseClass = `pulse-${contract.threatLevel}`;
  const glitchClass = contract.threatLevel === 5 ? 'glitch-marker' : '';
  const appearClass = appeared ? 'marker-appear' : '';
  const disappearClass = disappearing ? 'marker-disappear' : '';

  return (
    <div 
      className={`contractMarker ${pulseClass} ${glitchClass} ${appearClass} ${disappearClass} ${hovered ? 'hovered' : ''}`}
      style={markerStyle}
      onClick={handleClick}
      onMouseEnter={handlePointerOver}
      onMouseLeave={handlePointerOut}
    >
      {/* Marqueur principal */}
      <div 
        className="markerShape holographic-border"
        style={{
          backgroundColor: difficultyColor,
          borderColor: '#00ffcc', // vert holographique
          boxShadow: `0 0 20px 4px ${difficultyColor}, 0 0 40px 8px ${difficultyColor}55, 0 0 60px 12px ${difficultyColor}33`,
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 3,
        }}
      >
        {/* Icône personnalisée au lieu de l'icône du type de mission */}
        <Image
          src="/contrat.png"
          alt="Contrat disponible"
          width={size * 1}
          height={size * 1}
          style={{
            filter: 'drop-shadow(0 0 5px currentColor)',
            opacity: 0.9,
            display: 'block',
          }}
        />
      </div>

      {/* Effet de pulsation */}
      <div 
        className="pulseRing"
        style={{
          borderColor: difficultyColor,
          width: size * 1.5,
          height: size * 1.5,
        }}
      />

      {/* Deuxième anneau de pulsation pour plus d'effet */}
      <div 
        className="pulseRing2"
        style={{
          borderColor: difficultyColor,
          width: size * 2,
          height: size * 2,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          border: '1px solid',
          borderRadius: '50%',
          opacity: 0.2,
          zIndex: 0,
        }}
      />

      {/* Tooltip au survol */}
      {hovered && (
        <div className={styles.markerTooltip}>
          <h4>{contract.title}</h4>
          <p><strong>Difficulté:</strong> Niveau {contract.threatLevel}</p>
          <p><strong>Récompense:</strong> {contract.reward?.eddies?.toLocaleString()} €$</p>
          {contract.targetFaction && (
            <p><strong>Cible:</strong> {contract.targetFaction}</p>
          )}
        </div>
      )}

      {/* Ligne de connexion au sol */}
      <div 
        className="connectionLine"
        style={{
          backgroundColor: difficultyColor,
        }}
      />
    </div>
  );
} 