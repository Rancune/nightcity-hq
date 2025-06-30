'use client';
import { useState } from 'react';
import ButtonWithLoading from '@/components/ButtonWithLoading';
import { cityConfig, getDifficultyColor } from '@/lib/cityMapConfig';

export default function MissionBriefing({ contract, onClose, onAccept }) {
  const [isAccepting, setIsAccepting] = useState(false);
  
  if (!contract) return null;

  const contractType = cityConfig.contractTypes[contract.type] || cityConfig.contractTypes.hacking;
  const difficultyColor = getDifficultyColor(contract.difficulty);
  const difficultyLevel = cityConfig.difficultyLevels[contract.difficulty];

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      if (onAccept) {
        await onAccept(contract);
      }
    } catch (error) {
      console.error('Erreur lors de l\'acceptation du contrat:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="missionBriefing">
      <div className="briefingHeader">
        <h2 className="briefingTitle">{contract.title}</h2>
        <button className="closeButton" onClick={onClose}>×</button>
      </div>

      <div className="briefingContent">
        {/* Informations principales */}
        <div className="briefingSection">
          <div className="contractType">
            <span className="typeIcon">{contractType.icon}</span>
            <span className="typeName">{contractType.description}</span>
          </div>
          
          <div className="difficultyIndicator">
            <span className="difficultyLabel">Niveau de Menace:</span>
            <span 
              className="difficultyValue"
              style={{ color: difficultyColor }}
            >
              {contract.difficulty} - {difficultyLevel?.description}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="briefingSection">
          <h3>Description</h3>
          <p className="description">{contract.description}</p>
        </div>

        {/* Détails de la mission */}
        <div className="briefingSection">
          <h3>Détails de la Mission</h3>
          <div className="missionDetails">
            {contract.employerFaction && (
              <div className="detailRow">
                <span className="detailLabel">Employeur:</span>
                <span className="detailValue">{contract.employerFaction}</span>
              </div>
            )}
            
            {contract.targetFaction && (
              <div className="detailRow">
                <span className="detailLabel">Cible:</span>
                <span className="detailValue">{contract.targetFaction}</span>
              </div>
            )}
            
            {contract.missionType && (
              <div className="detailRow">
                <span className="detailLabel">Type de Mission:</span>
                <span className="detailValue">{contract.missionType}</span>
              </div>
            )}
            
            {contract.loreDifficulty && (
              <div className="detailRow">
                <span className="detailLabel">Difficulté Lore:</span>
                <span className="detailValue">{contract.loreDifficulty}</span>
              </div>
            )}
          </div>
        </div>

        {/* Compétences requises */}
        {contract.requiredSkills && (
          <div className="briefingSection">
            <h3>Compétences Requises</h3>
            <div className="skillsGrid">
              {Object.entries(contract.requiredSkills).map(([skill, level]) => (
                <div key={skill} className="skillItem">
                  <span className="skillName">{skill.toUpperCase()}</span>
                  <span className="skillLevel">{level}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Récompenses */}
        <div className="briefingSection">
          <h3>Récompenses</h3>
          <div className="rewards">
            {contract.reward?.eddies && (
              <div className="rewardItem">
                <span className="rewardIcon">💰</span>
                <span className="rewardAmount">
                  {contract.reward.eddies.toLocaleString()} €$
                </span>
              </div>
            )}
            
            {contract.reward?.reputation && (
              <div className="rewardItem">
                <span className="rewardIcon">⭐</span>
                <span className="rewardAmount">
                  +{contract.reward.reputation} Points de Réputation
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Factions impliquées */}
        {contract.involvedFactions && contract.involvedFactions.length > 0 && (
          <div className="briefingSection">
            <h3>Factions Impliquées</h3>
            <div className="factionsList">
              {contract.involvedFactions.map((faction, index) => (
                <span key={index} className="factionTag">{faction}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="briefingActions">
        <button className="secondaryButton" onClick={onClose}>
          Annuler
        </button>
        <ButtonWithLoading
          onClick={handleAccept}
          isLoading={isAccepting}
          loadingText="ACCEPTATION..."
          className="primaryButton"
        >
          Prendre en charge le contrat
        </ButtonWithLoading>
      </div>
    </div>
  );
} 