#!/usr/bin/env node
import 'dotenv/config';

const mongoose = require('mongoose');
const FactionRelations = require('../src/models/FactionRelations').default;
const { default: connectDb } = require('../src/Lib/database');

async function main() {
  await connectDb();
  const clerkId = 'test-threat-123';
  const faction = 'militech';

  // Nettoyage ou création du profil de test
  let rel = await FactionRelations.findOne({ clerkId });
  if (!rel) {
    rel = new FactionRelations({ clerkId });
    await rel.save();
    console.log('Profil de test créé.');
  }

  // Reset menace
  rel.threatLevels[faction] = 0;
  rel.lastThreatActivity[faction] = null;
  await rel.save();
  console.log(`Menace initiale pour ${faction}:`, rel.threatLevels[faction]);

  // Simuler un contrat réussi (+5)
  rel.threatLevels[faction] += 5;
  rel.lastThreatActivity[faction] = new Date();
  await rel.save();
  console.log(`Après contrat réussi (+5):`, rel.threatLevels[faction]);

  // Simuler un contrat raté (+2)
  rel.threatLevels[faction] += 2;
  rel.lastThreatActivity[faction] = new Date();
  await rel.save();
  console.log(`Après contrat raté (+2):`, rel.threatLevels[faction]);

  // Simuler la décroissance (12h plus tard)
  rel.lastThreatActivity[faction] = new Date(Date.now() - 13 * 60 * 60 * 1000); // 13h en arrière
  await rel.save();

  // Appel du cron de décroissance (simulateur)
  const now = new Date();
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  const last = rel.lastThreatActivity[faction];
  if (rel.threatLevels[faction] > 0 && last && (now - new Date(last)) >= TWELVE_HOURS) {
    rel.threatLevels[faction] = Math.max(0, rel.threatLevels[faction] - 1);
    rel.lastThreatActivity[faction] = now;
    await rel.save();
    console.log('Décroissance appliquée (-1).');
  }
  console.log(`Après décroissance:`, rel.threatLevels[faction]);

  // Nettoyage
  await FactionRelations.deleteOne({ clerkId });
  console.log('Profil de test supprimé.');
  mongoose.connection.close();
}

if (require.main === module) {
  main();
} 