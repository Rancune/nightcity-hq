#!/usr/bin/env node

/**
 * Script de test pour vérifier l'icône personnalisée des contrats
 * Usage: node scripts/test-contract-marker.js
 */

import fs from 'fs';
import path from 'path';

function testContractIcon() {
  console.log('🧪 Test de l\'icône personnalisée des contrats\n');

  // Vérifier que l'image existe
  const iconPath = path.join(process.cwd(), 'public', 'contrat.png');
  
  if (fs.existsSync(iconPath)) {
    const stats = fs.statSync(iconPath);
    console.log('✅ Icône trouvée:', iconPath);
    console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Modifié: ${stats.mtime.toLocaleString()}`);
  } else {
    console.error('❌ Icône manquante:', iconPath);
    console.log('💡 Assurez-vous que contrat.png est dans le dossier public/');
    return;
  }

  // Vérifier les modifications du code
  const markerPath = path.join(process.cwd(), 'src', 'app', 'map', 'ContractMarker.js');
  
  if (fs.existsSync(markerPath)) {
    const content = fs.readFileSync(markerPath, 'utf8');
    
    if (content.includes('/contrat.png')) {
      console.log('✅ Code modifié pour utiliser l\'icône personnalisée');
    } else {
      console.error('❌ Code non modifié - l\'icône personnalisée n\'est pas utilisée');
    }
    
    if (content.includes('Image from next/image')) {
      console.log('✅ Import Next.js Image ajouté');
    } else {
      console.error('❌ Import Next.js Image manquant');
    }
    
    if (!content.includes('contractType.icon')) {
      console.log('✅ Icônes de type de mission supprimées');
    } else {
      console.error('❌ Icônes de type de mission encore présentes');
    }
  } else {
    console.error('❌ Fichier ContractMarker.js non trouvé');
  }

  console.log('\n📋 Résumé des modifications :');
  console.log('   • Icône personnalisée : contrat.png');
  console.log('   • Taille de l\'icône : 80% de la taille du marqueur');
  console.log('   • Centrage : flexbox pour un centrage parfait');
  console.log('   • Effet : drop-shadow et opacity 0.9');
  console.log('   • Masquage : type de mission et compétences cachés');
  console.log('   • Conservation : couleur de difficulté et pulsation');

  console.log('\n🎯 Pour tester :');
  console.log('   1. Lancer le serveur : npm run dev');
  console.log('   2. Aller sur la page de la map');
  console.log('   3. Vérifier que les contrats utilisent l\'icône personnalisée');
  console.log('   4. Vérifier que le tooltip ne révèle plus le type de mission');

  console.log('\n🎉 Test terminé !');
}

// Exécuter le test
testContractIcon(); 