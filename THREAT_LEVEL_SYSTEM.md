# Système d'Échelons de Menace & Équipe d'Infiltration

## 🎯 Philosophie : L'Information, c'est le Pouvoir

Un Fixer ne se lance pas à l'aveugle. Il évalue le risque. Ce système de niveaux de difficulté (de 1 à 5) est la première information stratégique que le joueur reçoit. Un contrat de "Niveau 5" n'est pas une simple mission, c'est un avertissement. Il communique immédiatement le danger, le prestige et la récompense potentielle.

## 🏆 Les 5 Échelons de Menace

### Niveau 1 - Menace Basse 💀
- **Sous-titre** : "Job de Routine"
- **Compétences requises** : 3-5
- **Description** : Le pain quotidien d'un Fixer. Une mission simple, parfaite pour un runner novice ou pour se faire des eddies faciles.
- **Prérequis joueur** : Aucune préparation spéciale requise.
- **Récompense** : 8,000 €$ + 15 PR

### Niveau 2 - Menace Modérée 💀💀
- **Sous-titre** : "Opération Standard"
- **Compétences requises** : 6-8
- **Description** : Nécessite un runner spécialisé et compétent. Un agent polyvalent mais moyen risquerait l'échec.
- **Prérequis joueur** : Choisir le bon runner pour la mission.
- **Récompense** : 15,000 €$ + 30 PR

### Niveau 3 - Menace Élevée 💀💀💀
- **Sous-titre** : "Haute Voltige"
- **Compétences requises** : 9-12
- **Description** : Le premier vrai mur. Un runner, même avec une compétence à 10, n'est pas garanti de réussir.
- **Prérequis joueur** : Utiliser ses meilleurs runners et commencer à penser à l'équipement du Marché Noir.
- **Récompense** : 25,000 €$ + 50 PR

### Niveau 4 - Menace Sévère 💀💀💀💀
- **Sous-titre** : "Zone de Guerre Corpo"
- **Compétences requises** : 13-16
- **Description** : Impossible à réussir sur la seule base des compétences naturelles. Le joueur est obligé d'utiliser des programmes "one-shot" ou des Implants permanents.
- **Prérequis joueur** : Investissement stratégique sur le Marché Noir.
- **Récompense** : 40,000 €$ + 80 PR

### Niveau 5 - Légende de Night City 💀💀💀💀💀
- **Sous-titre** : "Contrat Ultime"
- **Compétences requises** : 17-20
- **Description** : Le genre de contrat qui fait ou défait une légende. Un défi ultime qui requiert le meilleur runner, amélioré par des implants permanents.
- **Prérequis joueur** : Préparation de fin de jeu, maîtrise de tous les systèmes.
- **Récompense** : 60,000 €$ + 120 PR

## 🎮 Progression par Réputation

### Rumeur de la Rue (0-150 PR)
- **Niveaux disponibles** : 1-2
- **Accès** : Contrats de base, livraisons, intimidations

### Nom qui Circule (151-500 PR)
- **Niveaux disponibles** : 1-3
- **Accès** : Contrats plus complexes, espionnage corpo

### Faiseur de Rois (501-1199 PR)
- **Niveaux disponibles** : 1-4
- **Accès** : Contrats à fort impact, détournement de convoi

### Légende de Night City (1200+ PR)
- **Niveaux disponibles** : 1-5
- **Accès** : Contrats qui peuvent redéfinir l'équilibre du pouvoir

## 👥 Système d'Équipe d'Infiltration

### Philosophie : Chaque Spécialiste à son Poste

Certains contrats sont trop complexes pour un seul agent. Ils sont découpés en plusieurs "postes" ou "rôles", chacun exigeant une compétence spécifique.

### Mécanique des Compétences Requises

Le champ `requiredSkills` du contrat définit les postes à pourvoir :
```javascript
{
  hacking: 12,   // Poste de Netrunner
  stealth: 0,    // Pas de poste d'infiltration
  combat: 8      // Poste de combat
}
```

### Types de Missions

#### Mission Solo (1 Runner)
- **Exemple** : `{ hacking: 12, stealth: 0, combat: 0 }`
- **Description** : Piratage pur, nécessite 1 Netrunner

#### Mission Duo (2 Runners)
- **Exemple** : `{ hacking: 0, stealth: 9, combat: 11 }`
- **Description** : Infiltration & Neutralisation, nécessite 2 agents

#### Mission Trio (3 Runners)
- **Exemple** : `{ hacking: 10, stealth: 10, combat: 10 }`
- **Description** : Opération complète, nécessite 3 agents

### Résolution de Mission en Équipe

Chaque test de compétence est effectué indépendamment par le runner assigné à ce poste :
- **Test 1** : Compétence Hacking du Runner A vs Exigence Hacking du contrat
- **Test 2** : Compétence Stealth du Runner B vs Exigence Stealth du contrat
- **Test 3** : Compétence Combat du Runner C vs Exigence Combat du contrat

Le `successScore` global reste la somme des succès individuels. Il faut toujours réussir une majorité des tests pour que la mission soit un succès global.

## 🔍 Analyse du Lore pour Détection des Compétences

Le système analyse automatiquement la description du contrat pour détecter les compétences mentionnées :

### Mots-clés Hacking
- système, systèmes, ICE, cyber, virus, piratage, hack, hacking
- données, fichiers, réseau, sécurité informatique, firewall, encryption
- logiciel, programme, algorithme, base de données, serveur

### Mots-clés Infiltration
- infiltration, discrétion, furtif, silencieux, camouflage, éviter
- se cacher, passer inaperçu, surveillance, gardes, patrouille
- système de sécurité, détecteurs, caméras, alarmes, sans être vu

### Mots-clés Combat
- combat, tir, tir de précision, armes, explosifs, grenades
- neutraliser, éliminer, tuer, assassiner, tuerie, bataille
- confrontation, escarmouche, embuscade, assaut, raid

## 🛠️ Implémentation Technique

### Fichiers Principaux

1. **`src/Lib/threatLevels.js`** - Logique des niveaux de menace
2. **`src/components/ThreatLevelBadge.js`** - Affichage du niveau
3. **`src/components/ThreatLevelInfo.js`** - Informations détaillées
4. **`src/components/RequiredSkillsDisplay.js`** - Affichage des compétences
5. **`src/models/Contract.js`** - Modèle avec champ `threatLevel`

### Génération de Contrats

```javascript
// Déterminer les niveaux disponibles selon la réputation
const availableThreatLevels = getAvailableThreatLevels(playerReputation);

// Choisir un niveau aléatoire
const threatLevel = availableThreatLevels[Math.floor(Math.random() * availableThreatLevels.length)];

// Générer les compétences selon le type de mission
const requiredSkills = generateRequiredSkillsFromThreatLevel(threatLevel, missionType);

// Calculer les récompenses
const rewards = calculateRewardsFromThreatLevel(threatLevel, factionMultiplier);
```

### Affichage dans l'Interface

```javascript
// Badge simple
<ThreatLevelBadge threatLevel={contract.threatLevel} />

// Informations détaillées
<ThreatLevelInfo threatLevel={contract.threatLevel} showFullDetails={true} />

// Compétences requises
<RequiredSkillsDisplay requiredSkills={contract.requiredSkills} showDetails={true} />
```

## 🎯 Avantages du Système

### 1. **Progression Claire**
- Courbe de difficulté prévisible
- Défis croissants selon la réputation
- Véritable "endgame" pour les joueurs

### 2. **Planification Stratégique**
- Le joueur doit analyser les besoins de la mission
- Composition d'équipe réfléchie
- Investissement dans l'équipement

### 3. **Économie du Marché Noir**
- Les niveaux 3+ nécessitent des programmes/implants
- Boucle de gameplay économique vertueuse
- Valorisation des investissements

### 4. **Immersion Narrative**
- Le lore révèle les compétences testées
- Cohérence entre description et gameplay
- Sensation de danger immédiate

## 🔮 Évolutions Futures

### 1. **Système Multi-Runners**
- Interface d'assignation d'équipe
- Gestion des synergies entre runners
- Spécialisations d'équipe

### 2. **Missions Épiques**
- Contrats nécessitant plusieurs équipes
- Coordination entre différents groupes
- Récompenses partagées

### 3. **Système de Menace Dynamique**
- Niveaux qui évoluent selon les actions du joueur
- Réputation qui influence la difficulté
- Menaces qui s'adaptent au style de jeu

---

*"Dans Night City, l'information est plus précieuse que l'or. Un Fixer qui connaît ses limites est un Fixer qui survit."* 