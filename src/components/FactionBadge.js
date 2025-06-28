import { FACTIONS } from '@/Lib/factionRelations';

export default function FactionBadge({ factionKey, showName = true }) {
  const faction = FACTIONS[factionKey];
  
  if (!faction) {
    return (
      <span className="inline-block bg-gray-600 text-white text-xs px-2 py-1 rounded mr-1 mb-1">
        {factionKey}
      </span>
    );
  }

  const getFactionColor = (type) => {
    switch (type) {
      case 'megacorp':
        return 'bg-red-600 text-white';
      case 'gang':
        return 'bg-purple-600 text-white';
      case 'authority':
        return 'bg-blue-600 text-white';
      case 'political':
        return 'bg-yellow-600 text-black';
      case 'underground':
        return 'bg-green-600 text-white';
      case 'other':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  return (
    <span className={`inline-block ${getFactionColor(faction.type)} text-xs px-2 py-1 rounded mr-1 mb-1`}>
      {showName ? faction.name : factionKey}
    </span>
  );
} 