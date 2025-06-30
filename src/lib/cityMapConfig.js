// Configuration de la carte de Night City
export const cityConfig = {
  // Dimensions de la carte
  mapSize: 20,
  buildingHeight: {
    min: 0.5,
    max: 4
  },
  
  // Quartiers de Night City
  districts: [
    {
      id: 'city-center',
      name: 'Centre-Ville',
      position: [0, 0, 0],
      size: [6, 6],
      buildingHeight: 4,
      color: '#00ffff',
      description: 'Le cœur financier de Night City, dominé par les mégacorporations.'
    },
    {
      id: 'heywood',
      name: 'Heywood',
      position: [-8, 0, 0],
      size: [4, 4],
      buildingHeight: 2.5,
      color: '#ff6b35',
      description: 'Quartier résidentiel de la classe moyenne, relativement sûr.'
    },
    {
      id: 'santo-domingo',
      name: 'Santo Domingo',
      position: [8, 0, 0],
      size: [4, 4],
      buildingHeight: 1.5,
      color: '#ffd23f',
      description: 'Zone industrielle et ouvrière, terrain de jeu des gangs.'
    },
    {
      id: 'westbrook',
      name: 'Westbrook',
      position: [0, 8, 0],
      size: [4, 4],
      buildingHeight: 3,
      color: '#7209b7',
      description: 'Quartier huppé et commercial, refuge des riches et célèbres.'
    },
    {
      id: 'watson',
      name: 'Watson',
      position: [0, -8, 0],
      size: [4, 4],
      buildingHeight: 1,
      color: '#06ffa5',
      description: 'Zone portuaire et commerciale, mélange de cultures.'
    }
  ],
  
  // Types de contrats et leurs icônes
  contractTypes: {
    hacking: {
      icon: '💀',
      color: '#00ffff',
      description: 'Mission de piratage informatique'
    },
    combat: {
      icon: '🎯',
      color: '#ff6b35',
      description: 'Mission de combat ou d\'assassinat'
    },
    stealth: {
      icon: '🎭',
      color: '#06ffa5',
      description: 'Mission de furtivité et d\'infiltration'
    }
  },
  
  // Niveaux de difficulté
  difficultyLevels: {
    1: {
      color: '#00ffff',
      pulseSpeed: 2,
      description: 'Facile'
    },
    2: {
      color: '#06ffa5',
      pulseSpeed: 1.5,
      description: 'Moyen'
    },
    3: {
      color: '#ffd23f',
      pulseSpeed: 1,
      description: 'Difficile'
    },
    4: {
      color: '#ff6b35',
      pulseSpeed: 0.7,
      description: 'Très difficile'
    },
    5: {
      color: '#ff0000',
      pulseSpeed: 0.5,
      description: 'Légendaire'
    }
  },
  
  // Configuration de la caméra
  camera: {
    position: [0, 15, 15],
    fov: 45,
    near: 0.1,
    far: 1000
  },
  
  // Effets visuels
  effects: {
    scanlines: {
      speed: 0.5,
      opacity: 0.1
    },
    glitch: {
      frequency: 0.02,
      intensity: 0.1
    },
    particles: {
      count: 100,
      speed: 0.1
    }
  }
};

// Fonction pour générer une position aléatoire dans un quartier
export function getRandomPositionInDistrict(district) {
  const [x, y, z] = district.position;
  const [width, height] = district.size;
  
  return [
    x + (Math.random() - 0.5) * width * 0.8,
    y + (Math.random() - 0.5) * height * 0.8,
    z
  ];
}

// Fonction pour obtenir la couleur d'un niveau de difficulté
export function getDifficultyColor(level) {
  return cityConfig.difficultyLevels[level]?.color || '#ffffff';
}

// Fonction pour obtenir la vitesse de pulsation d'un niveau de difficulté
export function getDifficultyPulseSpeed(level) {
  return cityConfig.difficultyLevels[level]?.pulseSpeed || 1;
} 