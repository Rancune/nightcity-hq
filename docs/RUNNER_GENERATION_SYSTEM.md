# Système de Génération de Runners par IA

## Vue d'ensemble

Le système de génération de runners par IA permet de créer des noms et des backgrounds uniques pour chaque netrunner, en utilisant l'intelligence artificielle (Gemini) pour générer du contenu immersif et cohérent avec l'univers de Cyberpunk 2077.

## Fonctionnalités

### 🤖 Génération IA
- **Noms uniques** : Prénom + Nom de famille dans le style cyberpunk
- **Lore personnalisé** : Background de 3-4 phrases avec l'argot de Night City
- **Adaptation aux compétences** : Le lore s'adapte aux statistiques du runner
- **Fallback robuste** : Système de secours en cas d'indisponibilité de l'IA

### 🎯 Types de Runners

#### Hacker Spécialisé
- **Compétences** : Hacking élevé (8-10), Stealth moyen (5-7), Combat faible (1-4)
- **Lore typique** : Ancien corpo, expert en systèmes, spécialiste de l'infiltration numérique

#### Combattant Spécialisé
- **Compétences** : Combat élevé (8-10), Stealth moyen (5-7), Hacking faible (1-4)
- **Lore typique** : Vétéran militaire, expert en neutralisation, préfère les approches directes

#### Runner Équilibré
- **Compétences** : Toutes les compétences équilibrées (6-8)
- **Lore typique** : Runner polyvalent, expérience diverse, adaptabilité

#### Infiltrateur
- **Compétences** : Stealth élevé (8-10), Hacking moyen (5-7), Combat faible (1-4)
- **Lore typique** : Spécialiste de la discrétion, expert en évasion, opérations clandestines

## Implémentation Technique

### Fichiers Principaux

1. **`src/Lib/ai.js`** - Fonction `generateRunnerNameAndLore()`
2. **`src/models/Netrunner.js`** - Modèle avec champ `lore`
3. **`src/app/api/netrunners/route.js`** - API de création de runners
4. **`src/app/api/netrunners/recruitment-pool/route.js`** - API de pool de recrutement
5. **`src/app/netrunners/page.js`** - Interface utilisateur

### Structure des Données

```javascript
// Runner avec lore généré par IA
{
  name: "Jax Vector",
  lore: "Ancien corpo d'Arasaka reconverti dans le hacking illégal...",
  skills: {
    hacking: 8,
    stealth: 6,
    combat: 4
  },
  // ... autres champs
}
```

### API Endpoints

#### POST `/api/netrunners`
Crée un nouveau runner avec nom et lore générés par IA.

**Paramètres optionnels :**
- `name` : Nom personnalisé (désactive la génération IA)
- `skills` : Compétences personnalisées

**Réponse :**
```json
{
  "success": true,
  "message": "Runner Jax Vector recruté avec succès !",
  "runner": { /* données du runner */ },
  "fixerCommission": 22.5
}
```

#### GET `/api/netrunners/recruitment-pool`
Génère un pool de 6 candidats avec noms et lore par IA.

**Réponse :**
```json
[
  {
    "id": "recruit-0",
    "name": "Cyra Byte",
    "lore": "Jeune prodige du code sortie des rues de Pacifica...",
    "skills": { "hacking": 9, "stealth": 7, "combat": 3 },
    "commission": 450,
    "totalPower": 19
  }
  // ... 5 autres candidats
]
```

## Système de Fallback

En cas d'indisponibilité de l'API Gemini, le système utilise des runners prédéfinis :

### Runners de Fallback
- **Jax Vector** : Ancien corpo d'Arasaka
- **Cyra Byte** : Jeune prodige du code
- **Kael Chrome** : Vétéran des guerres corporatistes
- **Nyx Neon** : Spécialiste de l'infiltration
- **Rogue Silas** : Runner indépendant
- **Spike Zero** : Expert en combat cybernétique
- **Vex Glitch** : Hacker prodige

### Gestion d'Erreurs
- Erreur 503 : Service temporairement indisponible
- Erreur de surcharge : Service surchargé
- Erreur d'API key : Clé invalide ou manquante

## Interface Utilisateur

### Page de Recrutement
- Affichage du lore pour chaque candidat
- Bouton "Régénérer" pour obtenir de nouveaux candidats
- Informations sur les compétences et la commission

### Page d'Équipe
- Affichage du lore pour chaque runner recruté
- Informations détaillées sur les compétences et l'expérience
- Gestion des implants et des soins

## Configuration

### Variables d'Environnement
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### Prompt IA
Le système utilise un prompt spécialisé pour générer des noms et lore cohérents :

```
Tu es un Fixer dans l'univers de Cyberpunk 2077 qui recrute des netrunners.
Génère un nom et un background unique pour un nouveau runner.

RÈGLES POUR LE NOM :
- Prénom + Nom de famille
- Style cyberpunk : noms courts, percutants
- Exemples : "Jax Vector", "Cyra Byte", "Kael Chrome"

RÈGLES POUR LE LORE :
- 3-4 phrases maximum
- Mentionner l'origine, l'expérience, la spécialité
- Utiliser l'argot de Night City
- Adapter le background aux compétences
```

## Tests

### Script de Test
```bash
node scripts/test-runner-generation.js
```

Le script teste :
1. Génération avec compétences aléatoires
2. Génération d'un hacker spécialisé
3. Génération d'un combattant spécialisé
4. Génération d'un runner équilibré
5. Génération sans compétences spécifiées

## Avantages

### 🎮 Immersion
- Chaque runner a une histoire unique
- Lore cohérent avec l'univers Cyberpunk
- Noms authentiques et mémorables

### 🔧 Flexibilité
- Adaptation automatique aux compétences
- Système de fallback robuste
- Génération en temps réel

### 📈 Évolutivité
- Facile d'ajouter de nouveaux types de runners
- Prompt modifiable pour différents styles
- Intégration avec le système de factions

## Utilisation

### Recrutement Manuel
1. Aller dans l'onglet "Recrutement"
2. Choisir un candidat avec lore généré par IA
3. Cliquer sur "Recruter"
4. Le runner est créé avec son nom et lore uniques

### Recrutement Automatique
1. Utiliser l'API POST `/api/netrunners` sans paramètres
2. Le système génère automatiquement nom, lore et compétences
3. Le runner est créé avec un background immersif

### Régénération du Pool
1. Cliquer sur "🔄 Régénérer" dans l'onglet Recrutement
2. Nouveaux candidats avec noms et lore uniques
3. Compétences adaptées à chaque profil

## Maintenance

### Ajout de Nouveaux Types
1. Modifier le prompt dans `generateRunnerNameAndLore()`
2. Ajouter des exemples spécifiques
3. Tester avec le script de test

### Amélioration du Fallback
1. Ajouter de nouveaux runners prédéfinis
2. Améliorer la diversité des backgrounds
3. Adapter aux nouvelles mécaniques de jeu

### Monitoring
- Surveiller les erreurs d'API Gemini
- Analyser la qualité des générations
- Ajuster le prompt selon les retours utilisateurs 