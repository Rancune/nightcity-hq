// src/Lib/programCatalog.js
// Utilitaire pour charger le catalogue centralisé des programmes

import programCatalogData from '../data/program-catalog.json';

// Catalogue centralisé de tous les programmes
export const PROGRAM_CATALOG = programCatalogData;

// Fonction pour obtenir un programme par ID
export function getProgramById(id) {
  return PROGRAM_CATALOG.find(program => program.id === id);
}

// Fonction pour obtenir tous les programmes d'un type
export function getProgramsByType(type) {
  return PROGRAM_CATALOG.filter(program => program.type === type);
}

// Fonction pour obtenir tous les programmes d'un vendor
export function getProgramsByVendor(vendor) {
  return PROGRAM_CATALOG.filter(program => program.vendor === vendor);
}

// Fonction pour obtenir les programmes selon le Street Cred du joueur
export function getAvailablePrograms(streetCred) {
  return PROGRAM_CATALOG.filter(program => program.streetCredRequired <= streetCred);
}

// Fonction pour obtenir les programmes signature
export function getSignaturePrograms() {
  return PROGRAM_CATALOG.filter(program => program.isSignature);
}

// Fonction pour obtenir les programmes one-shot avec bonus
export function getBonusPrograms() {
  return PROGRAM_CATALOG.filter(program => 
    program.type === 'one_shot' && 
    program.effects && 
    program.effects.add_bonus_roll
  );
}

// Fonction pour obtenir les implants
export function getImplants() {
  return PROGRAM_CATALOG.filter(program => program.type === 'implant');
}

// Fonction pour obtenir les informations
export function getInformationPrograms() {
  return PROGRAM_CATALOG.filter(program => program.type === 'information');
}

// Fonction pour obtenir les programmes de sabotage
export function getSabotagePrograms() {
  return PROGRAM_CATALOG.filter(program => program.type === 'sabotage');
}

// Fonction pour convertir un programme du catalogue en objet Program pour la base de données
export function catalogToProgram(catalogItem) {
  return {
    name: catalogItem.name,
    description: catalogItem.description,
    type: catalogItem.type,
    rarity: catalogItem.rarity,
    streetCredRequired: catalogItem.streetCredRequired,
    cost: catalogItem.cost,
    effects: catalogItem.effects || {},
    permanent_skill_boost: catalogItem.permanent_skill_boost || null,
    vendorMessage: catalogItem.vendorMessage,
    vendor: catalogItem.vendor,
    marketId: catalogItem.id,
    isSignature: catalogItem.isSignature || false,
    stock: catalogItem.stock || 1,
    maxStock: catalogItem.maxStock || 1,
    maxDaily: catalogItem.maxDaily || null
  };
}

// Fonction pour obtenir un programme aléatoire d'un type donné
export function getRandomProgramByType(type) {
  const programs = getProgramsByType(type);
  if (programs.length === 0) return null;
  return programs[Math.floor(Math.random() * programs.length)];
}

// Fonction pour obtenir un programme aléatoire selon le Street Cred
export function getRandomProgramByStreetCred(streetCred) {
  const programs = getAvailablePrograms(streetCred);
  if (programs.length === 0) return null;
  return programs[Math.floor(Math.random() * programs.length)];
}

export default PROGRAM_CATALOG; 