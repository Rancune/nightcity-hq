#!/usr/bin/env node

/**
 * Script de test pour vérifier les effets de pulsation des marqueurs
 * Usage: node scripts/test-pulse-effects.js
 */

import fs from 'fs';
import path from 'path';

function testPulseEffects() {
  console.log('🧪 Test des effets de pulsation des marqueurs\n');

  // Vérifier les modifications du CSS
  const cssPath = path.join(process.cwd(), 'src', 'app', 'map', 'CityMap.module.css');
  
  if (fs.existsSync(cssPath)) {
    const content = fs.readFileSync(cssPath, 'utf8');
    
    // Vérifier les nouvelles animations
    if (content.includes('@keyframes pulse')) {
      console.log('✅ Animation pulse principale trouvée');
    } else {
      console.error('❌ Animation pulse principale manquante');
    }
    
    if (content.includes('@keyframes pulseRing1')) {
      console.log('✅ Animation pulseRing1 trouvée');
    } else {
      console.error('❌ Animation pulseRing1 manquante');
    }
    
    if (content.includes('@keyframes pulseRing2')) {
      console.log('✅ Animation pulseRing2 trouvée');
    } else {
      console.error('❌ Animation pulseRing2 manquante');
    }
    
    // Vérifier les classes de pulsation
    if (content.includes('.pulse-1 .pulseRing')) {
      console.log('✅ Classes de pulsation avec anneaux trouvées');
    } else {
      console.error('❌ Classes de pulsation avec anneaux manquantes');
    }
    
    // Vérifier le nouveau style pulseRing2
    if (content.includes('.pulseRing2')) {
      console.log('✅ Style pulseRing2 trouvé');
    } else {
      console.error('❌ Style pulseRing2 manquant');
    }
  } else {
    console.error('❌ Fichier CityMap.module.css non trouvé');
  }

  // Vérifier les modifications du composant
  const markerPath = path.join(process.cwd(), 'src', 'app', 'map', 'ContractMarker.js');
  
  if (fs.existsSync(markerPath)) {
    const content = fs.readFileSync(markerPath, 'utf8');
    
    if (content.includes('pulseRing2')) {
      console.log('✅ Deuxième anneau de pulsation ajouté au composant');
    } else {
      console.error('❌ Deuxième anneau de pulsation manquant');
    }
    
    if (content.includes('boxShadow: `0 0 20px 4px ${difficultyColor}')) {
      console.log('✅ Effet de glow amélioré');
    } else {
      console.error('❌ Effet de glow non amélioré');
    }
    
    if (content.includes('zIndex: 3')) {
      console.log('✅ Z-index du marqueur principal ajusté');
    } else {
      console.error('❌ Z-index du marqueur principal non ajusté');
    }
  } else {
    console.error('❌ Fichier ContractMarker.js non trouvé');
  }

  console.log('\n📋 Résumé des améliorations de pulsation :');
  console.log('   • Animation principale : scale(1.2) avec glow');
  console.log('   • Premier anneau : scale(1.4) à (1.8)');
  console.log('   • Deuxième anneau : scale(1.2) à (2.0)');
  console.log('   • Effet de glow : 3 niveaux de shadow');
  console.log('   • Vitesses : 0.5s à 2s selon la difficulté');
  console.log('   • Z-index : 3 niveaux pour la profondeur');

  console.log('\n🎯 Effets visuels attendus :');
  console.log('   • Marqueur principal : pulsation avec glow coloré');
  console.log('   • Anneau 1 : expansion et fade-out');
  console.log('   • Anneau 2 : expansion plus large');
  console.log('   • Couleurs : adaptées au niveau de difficulté');
  console.log('   • Vitesse : plus rapide = plus difficile');

  console.log('\n🎉 Test terminé !');
}

// Exécuter le test
testPulseEffects(); 