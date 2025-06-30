'use client';
import { useState, useEffect } from 'react';
import { cityConfig, getDifficultyColor, getDifficultyPulseSpeed } from '@/lib/cityMapConfig';

export default function ContractMarker({ contract, onClick, onHover, onHoverEnd }) {
  const [hovered, setHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation d'apparition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, Math.random() * 2000); // Apparition aléatoire sur 2 secondes
    
    return () => clearTimeout(timer);
  }, []);

  // Configuration du marqueur selon le type de contrat
  const contractType = cityConfig.contractTypes[contract.type] || cityConfig.contractTypes.hacking;
  const difficultyColor = getDifficultyColor(contract.difficulty);
  const pulseSpeed = getDifficultyPulseSpeed(contract.difficulty);

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
  if (!isVisible) return null;

  const markerStyle = {
    position: 'absolute',
    left: contract.position.x,
    top: contract.position.y,
    transform: 'translate(-50%, -50%)',
    cursor: 'pointer',
    zIndex: hovered ? 100 : 50,
  };

  const pulseClass = `pulse-${contract.difficulty}`;

  return (
    <div 
      className={`contractMarker ${pulseClass} ${hovered ? 'hovered' : ''}`}
      style={markerStyle}
      onClick={handleClick}
      onMouseEnter={handlePointerOver}
      onMouseLeave={handlePointerOut}
    >
      {/* Marqueur principal */}
      <div 
        className="markerShape"
        style={{
          backgroundColor: difficultyColor,
          borderColor: difficultyColor,
        }}
      >
        <span className="markerIcon">{contractType.icon}</span>
      </div>

      {/* Effet de pulsation */}
      <div 
        className="pulseRing"
        style={{
          borderColor: difficultyColor,
        }}
      />

      {/* Tooltip au survol */}
      {hovered && (
        <div className="markerTooltip">
          <h4>{contract.title}</h4>
          <p><strong>Type:</strong> {contractType.description}</p>
          <p><strong>Difficulté:</strong> Niveau {contract.difficulty}</p>
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