import { THREAT_LEVELS } from '@/Lib/threatLevels';

export default function ThreatLevelInfo({ threatLevel, showFullDetails = false }) {
  const level = THREAT_LEVELS[threatLevel];
  
  if (!level) {
    return (
      <div className="p-4 bg-black/30 rounded border border-gray-500/50">
        <p className="text-gray-400 text-sm">Niveau de menace invalide</p>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded border ${level.bgColor} ${level.borderColor}`}>
      {/* En-tête avec icône et titre */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{level.icon}</span>
        <div>
          <h3 className={`font-bold ${level.color}`}>{level.name}</h3>
          <p className="text-xs text-[--color-text-secondary]">{level.subtitle}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[--color-text-secondary] mb-3">
        {level.description}
      </p>

      {/* Prérequis joueur */}
      <div className="mb-3">
        <p className="text-xs text-[--color-text-secondary] uppercase tracking-wider mb-1">
          Prérequis
        </p>
        <p className="text-sm text-[--color-text-primary]">
          {level.playerPrerequisites}
        </p>
      </div>

      {/* Fourchette de compétences */}
      <div className="mb-3">
        <p className="text-xs text-[--color-text-secondary] uppercase tracking-wider mb-1">
          Compétences requises
        </p>
        <p className="text-sm text-[--color-text-primary]">
          {level.skillRange.min} - {level.skillRange.max} par compétence
        </p>
      </div>

      {/* Informations supplémentaires si demandées */}
      {showFullDetails && (
        <div className="mt-4 pt-3 border-t border-[--color-border-dark]">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[--color-text-secondary] mb-1">Risque d&apos;échec</p>
              <p className={`font-semibold ${threatLevel >= 4 ? 'text-red-400' : threatLevel >= 3 ? 'text-orange-400' : 'text-yellow-400'}`}>
                {threatLevel >= 4 ? 'Très élevé' : threatLevel >= 3 ? 'Élevé' : 'Modéré'}
              </p>
            </div>
            <div>
              <p className="text-[--color-text-secondary] mb-1">Récompense</p>
              <p className="text-[--color-neon-pink] font-semibold">
                {threatLevel >= 4 ? 'Exceptionnelle' : threatLevel >= 3 ? 'Élevée' : 'Standard'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 