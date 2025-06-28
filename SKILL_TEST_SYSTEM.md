# Système Unifié de Test de Compétences

## 🎯 Objectif

Unification du système de test de compétences pour utiliser une seule logique robuste et évolutive dans tout le jeu.

## 🔄 Changements Apportés

### Avant (Système Dupliqué)
- **`/timesup`** : Système basé sur 50% + (différence × 10%)
- **`/resolve`** : Système basé sur ratio direct (compétence/exigence)

### Après (Système Unifié)
- **Toutes les APIs** : Utilisent `testRunnerSkills()` avec configuration centralisée
- **Logique unique** : Ratio direct avec limites 5%-95%
- **Effets intégrés** : Support des programmes one-shot et implants

## 🧮 Formule de Calcul

### Chance de Succès de Base
```javascript
successChance = Math.min(95%, Math.max(5%, runnerSkill / requiredSkill))
```

### Exemples
- **Runner Hacking 6 vs Exigence 8** : 6/8 = 75%
- **Runner Stealth 4 vs Exigence 10** : 4/10 = 40%
- **Runner Combat 9 vs Exigence 3** : 9/3 = 95% (limité à 95%)

## ⚙️ Configuration Centralisée

```javascript
const SKILL_TEST_CONFIG = {
  SUCCESS_THRESHOLD: 0.6,        // 60% de réussite minimum
  CRITICAL_FAILURE_THRESHOLD: 0.3, // < 30% = mort
  MIN_SUCCESS_CHANCE: 0.05,      // 5% minimum
  MAX_SUCCESS_CHANCE: 0.95,      // 95% maximum
  SKILL_BONUS_MULTIPLIER: 1.0,   // Multiplicateur bonus
  DIFFICULTY_PENALTY_MULTIPLIER: 1.0 // Multiplicateur pénalités
};
```

## 🎲 Effets des Programmes One-Shot

### Brise-Glace
- **Effet** : Succès garanti sur le test le plus difficile
- **Application** : Force le succès même si échec normal

### Sandevistan
- **Effet** : +3 à une compétence spécifique
- **Application** : Ajouté avant calcul de chance

### Décharge IEM
- **Effet** : -1 à la difficulté de tous les tests
- **Application** : Réduit l'exigence effective

### Exemple Complet
```
Runner Hacking 5 vs Exigence 8
- Sandevistan +3 → Hacking effectif = 8
- Décharge IEM -1 → Exigence effective = 7
- Chance = 8/7 = 114% → Limité à 95%
```

## 📊 Détermination du Résultat

### Taux de Réussite Global
```javascript
successRate = totalSuccess / totalTests
```

### Conséquences
- **≥ 60%** : Succès → Runner disponible
- **30-59%** : Échec partiel → Runner grillé
- **< 30%** : Échec critique → Runner mort

## 🔧 APIs Mises à Jour

### `/api/contrats/[id]/timesup`
```javascript
// Utilise maintenant testRunnerSkills()
const skillTest = testRunnerSkills(runner, contract.requiredSkills);
const isSuccess = skillTest.isSuccess;
```

### `/api/contrats/[id]/resolve`
```javascript
// Utilise testRunnerSkills() avec effets actifs
const playerEffects = contract.activeProgramEffects?.find(e => e.clerkId === userId)?.effects || {};
const skillTest = testRunnerSkills(runner, contract.requiredSkills, playerEffects);
```

## 📝 Logs Détaillés

### Format des Logs
```
[TIMESUP] Test de compétences pour Rogue Chrome:
  hacking: 6/8 (75% chance) → SUCCÈS [+3 bonus, -1 difficulté]
  stealth: 4/6 (67% chance) → ÉCHEC [-1 difficulté]
  combat: 3/5 (60% chance) → SUCCÈS
[TIMESUP] Taux de réussite: 67% → SUCCÈS
```

### Informations Incluses
- Compétence testée et valeurs
- Chance de succès calculée
- Résultat (SUCCÈS/ÉCHEC)
- Effets appliqués (bonus, réduction difficulté, succès forcé)

## 🎮 Avantages du Système Unifié

### 1. **Cohérence**
- Même logique partout dans le jeu
- Résultats prévisibles pour les joueurs

### 2. **Évolutivité**
- Configuration centralisée facile à modifier
- Support natif des effets et bonus

### 3. **Maintenabilité**
- Code DRY (Don't Repeat Yourself)
- Tests plus faciles à écrire

### 4. **Équilibrage**
- Seuils configurables pour ajuster la difficulté
- Multiplicateurs pour fine-tuning

## 🔮 Évolutions Futures Possibles

### 1. **Modificateurs de Difficulté**
- Bonus/malus selon le type de mission
- Effets de réputation sur les chances

### 2. **Système de Critique**
- Succès critiques (double effet)
- Échecs critiques (conséquences aggravées)

### 3. **Compétences Spéciales**
- Talents uniques des runners
- Synergies entre compétences

### 4. **Conditions Environnementales**
- Bonus selon le lieu de mission
- Pénalités selon l'heure

## 🛠️ Fonctions Utilitaires

### Obtenir la Configuration
```javascript
import { getSkillTestConfig } from '@/Lib/skillTest';
const config = getSkillTestConfig();
```

### Modifier la Configuration
```javascript
import { updateSkillTestConfig } from '@/Lib/skillTest';
updateSkillTestConfig({ SUCCESS_THRESHOLD: 0.7 }); // 70% au lieu de 60%
```

## 📊 Exemples de Tests

### Test Simple
```
Runner: Hacking 7, Stealth 5, Combat 3
Contrat: Hacking 6, Stealth 6, Combat 4
Résultats:
- Hacking: 7/6 = 117% → 95% → SUCCÈS
- Stealth: 5/6 = 83% → SUCCÈS  
- Combat: 3/4 = 75% → SUCCÈS
Taux: 100% → SUCCÈS GLOBAL
```

### Test avec Effets
```
Runner: Hacking 4, Stealth 6, Combat 2
Contrat: Hacking 8, Stealth 7, Combat 5
Effets: Sandevistan +3 hacking, Décharge IEM -1
Résultats:
- Hacking: (4+3)/(8-1) = 7/7 = 100% → 95% → SUCCÈS [+3 bonus, -1 difficulté]
- Stealth: 6/(7-1) = 6/6 = 100% → 95% → SUCCÈS [-1 difficulté]
- Combat: 2/(5-1) = 2/4 = 50% → ÉCHEC [-1 difficulté]
Taux: 67% → SUCCÈS GLOBAL
```

Le système est maintenant unifié, robuste et prêt pour les évolutions futures ! 