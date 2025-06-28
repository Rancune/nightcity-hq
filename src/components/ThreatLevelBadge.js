import { THREAT_LEVELS } from '@/Lib/threatLevels';

export default function ThreatLevelBadge({ threatLevel, showDetails = false }) {
  const level = THREAT_LEVELS[threatLevel];
  
  if (!level) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-500/20 border border-gray-500/50 text-gray-400">
        <span>💀</span>
        <span>Niveau {threatLevel}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${level.bgColor} border ${level.borderColor} ${level.color}`}>
      <span>{level.icon}</span>
      <span className="font-semibold">{level.name}</span>
      {showDetails && (
        <span className="text-xs opacity-75">({level.subtitle})</span>
      )}
    </div>
  );
} 