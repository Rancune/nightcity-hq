#!/usr/bin/env node

/**
 * Script de test pour le système de récompenses basé sur la réputation des factions
 */

const { calculateRewardsWithFactionReputation } = require('../src/Lib/threatLevels');

function testFactionRewards() {
  console.log('🧪 Test du système de récompenses basé sur la réputation des factions\n');
  
  const testCases = [
    { threatLevel: 3, faction: 'arasaka', reputation: 500, description: 'Arasaka - Allié' },
    { threatLevel: 3, faction: 'arasaka', reputation: 200, description: 'Arasaka - Ami' },
    { threatLevel: 3, faction: 'arasaka', reputation: 50, description: 'Arasaka - Favorable' },
    { threatLevel: 3, faction: 'arasaka', reputation: 0, description: 'Arasaka - Neutre' },
    { threatLevel: 3, faction: 'arasaka', reputation: -200, description: 'Arasaka - Hostile' },
    { threatLevel: 3, faction: 'arasaka', reputation: -500, description: 'Arasaka - Ennemi' },
    { threatLevel: 3, faction: 'arasaka', reputation: -800, description: 'Arasaka - Mortel' },
    { threatLevel: 3, faction: 'scavengers', reputation: 0, description: 'Scavengers - Neutre' },
    { threatLevel: 3, faction: 'scavengers', reputation: 500, description: 'Scavengers - Allié' },
    { threatLevel: 1, faction: 'militech', reputation: 0, description: 'Militech - Niveau 1' },
    { threatLevel: 5, faction: 'netWatch', reputation: 0, description: 'NetWatch - Niveau 5' }
  ];
  
  console.log('📊 Résultats des tests:\n');
  console.log('Niveau | Faction      | Réputation | Description        | Récompense | Multiplicateur');
  console.log('-------|--------------|------------|-------------------|------------|---------------');
  
  testCases.forEach(test => {
    const result = calculateRewardsWithFactionReputation(
      test.threatLevel, 
      test.faction, 
      test.reputation
    );
    
    const reputationStatus = getReputationStatus(test.reputation);
    const multiplier = result.breakdown.reputationMultiplier;
    
    console.log(
      `${test.threatLevel.toString().padStart(6)} | ` +
      `${test.faction.padEnd(12)} | ` +
      `${test.reputation.toString().padStart(10)} | ` +
      `${test.description.padEnd(18)} | ` +
      `${result.eddies.toString().padStart(10)} | ` +
      `${multiplier.toFixed(2)}x`
    );
  });
  
  console.log('\n📈 Analyse des multiplicateurs:');
  console.log('- Allié (500+): +50% de récompenses');
  console.log('- Ami (200+): +30% de récompenses');
  console.log('- Favorable (50+): +15% de récompenses');
  console.log('- Neutre (-50 à 50): récompenses normales');
  console.log('- Hostile (-200 à -50): -20% de récompenses');
  console.log('- Ennemi (-500 à -200): -40% de récompenses');
  console.log('- Mortel (-500 et moins): -60% de récompenses');
  
  console.log('\n🎯 Impact sur le gameplay:');
  console.log('- Les factions avec une bonne réputation offrent plus de récompenses');
  console.log('- Les factions hostiles offrent moins de récompenses');
  console.log('- Cela encourage les joueurs à maintenir de bonnes relations');
  console.log('- Les contrats automatiques utilisent une réputation neutre (0)');
  
  console.log('\n✅ Test terminé!');
}

function getReputationStatus(reputation) {
  if (reputation >= 500) return 'Allié';
  if (reputation >= 200) return 'Ami';
  if (reputation >= 50) return 'Favorable';
  if (reputation >= -50) return 'Neutre';
  if (reputation >= -200) return 'Hostile';
  if (reputation >= -500) return 'Ennemi';
  return 'Mortel';
}

// Exécuter le test
if (require.main === module) {
  testFactionRewards();
}

module.exports = testFactionRewards; 