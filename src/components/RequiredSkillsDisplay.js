export default function RequiredSkillsDisplay({ requiredSkills, showDetails = false }) {
  // Compter le nombre de runners requis
  const requiredRunnersCount = Object.values(requiredSkills || {}).filter(skill => skill > 0).length;
  
  // Obtenir les compétences avec leurs détails
  const skillsList = [];
  if (requiredSkills?.hacking > 0) {
    skillsList.push({
      name: 'Hacking',
      value: requiredSkills.hacking,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/20',
      borderColor: 'border-blue-400/50',
      icon: '💻',
      description: 'Piratage de systèmes, contournement d&apos;ICE, extraction de données'
    });
  }
  if (requiredSkills?.stealth > 0) {
    skillsList.push({
      name: 'Infiltration',
      value: requiredSkills.stealth,
      color: 'text-green-400',
      bgColor: 'bg-green-400/20',
      borderColor: 'border-green-400/50',
      icon: '👁️',
      description: 'Discrétion, évitement des gardes, passage inaperçu'
    });
  }
  if (requiredSkills?.combat > 0) {
    skillsList.push({
      name: 'Combat',
      value: requiredSkills.combat,
      color: 'text-red-400',
      bgColor: 'bg-red-400/20',
      borderColor: 'border-red-400/50',
      icon: '⚔️',
      description: 'Tir de précision, neutralisation d&apos;ennemis, survie'
    });
  }

  return (
    <div className="space-y-3">
      {/* En-tête avec nombre de runners */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[--color-text-primary]">
          Équipe d&apos;Infiltration
        </h4>
        <div className="flex items-center gap-1">
          <span className="text-xs text-[--color-text-secondary]">Runners requis:</span>
          <span className={`text-xs font-bold px-2 py-1 rounded ${
            requiredRunnersCount === 1 ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
            requiredRunnersCount === 2 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
            'bg-red-500/20 text-red-400 border border-red-500/50'
          }`}>
            {requiredRunnersCount}
          </span>
        </div>
      </div>

      {/* Liste des compétences */}
      <div className="space-y-2">
        {skillsList.map((skill, index) => (
          <div key={index} className={`p-3 rounded border ${skill.bgColor} ${skill.borderColor}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{skill.icon}</span>
                <span className={`font-semibold ${skill.color}`}>
                  {skill.name}
                </span>
              </div>
              <div className={`text-lg font-bold ${skill.color}`}>
                {skill.value}
              </div>
            </div>
            
            {showDetails && (
              <p className="text-xs text-[--color-text-secondary]">
                {skill.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Informations sur l&apos;équipe */}
      {showDetails && (
        <div className="mt-4 p-3 bg-black/20 rounded border border-[--color-border-dark]">
          <p className="text-xs text-[--color-text-secondary] mb-2">
            <strong>Note:</strong> Chaque compétence requiert un runner spécialisé. 
            {requiredRunnersCount === 1 ? 
              ' Cette mission peut être accomplie par un seul agent.' :
              requiredRunnersCount === 2 ?
              ' Cette mission nécessite une équipe de deux agents.' :
              ' Cette mission nécessite une équipe complète de trois agents.'
            }
          </p>
          <p className="text-xs text-[--color-text-secondary]">
            Les compétences non listées (valeur 0) ne sont pas testées dans cette mission.
          </p>
        </div>
      )}
    </div>
  );
} 