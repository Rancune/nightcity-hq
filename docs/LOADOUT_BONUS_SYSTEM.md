# Système de Bonus de Compétences dans le Loadout

## 🎯 Problème Résolu

**Problème initial :** Dans la page contrat, le système de loadout n'appliquait pas correctement les bonus de compétences. Lorsqu'un objet spécifiait une compétence particulière (ex: "Patch de Focus" pour le Hacking), le bonus était toujours appliqué à la première compétence du contrat au lieu de la compétence spécifiée.

**Solution :** Modification du système pour respecter la compétence spécifiée dans l'objet utilisé.

## 🔧 Corrections Apportées

### 1. API `/use-program` (`src/app/api/contrats/[id]/use-program/route.js`)

**Avant :**
```javascript
if (effects.add_bonus_roll) {
  const contractSkills = Object.entries(contract.requiredSkills || {}).filter(([_, v]) => v > 0);
  if (contractSkills.length > 0) {
    effectEntry.effects.bonusRoll = (effectEntry.effects.bonusRoll || 0) + effects.add_bonus_roll;
    effectEntry.effects.bonusSkill = contractSkills[0][0]; // ← Toujours la première compétence
  }
}
```

**Après :**
```javascript
if (effects.add_bonus_roll) {
  const contractSkills = Object.entries(contract.requiredSkills || {}).filter(([_, v]) => v > 0);
  if (contractSkills.length > 0) {
    effectEntry.effects.bonusRoll = (effectEntry.effects.bonusRoll || 0) + effects.add_bonus_roll;
    
    // Utiliser la compétence spécifiée dans l'objet si elle existe, sinon la première du contrat
    let targetSkill = null;
    if (effects.skill && effects.skill !== 'all') {
      // Vérifier que la compétence spécifiée est bien requise par le contrat
      if (contract.requiredSkills[effects.skill] > 0) {
        targetSkill = effects.skill;
      }
    }
    
    // Si aucune compétence spécifique ou si elle n'est pas requise, utiliser la première
    if (!targetSkill) {
      targetSkill = contractSkills[0][0];
    }
    
    effectEntry.effects.bonusSkill = targetSkill;
    skill = targetSkill;
    
    // Cas spécial : si skill === 'all', le bonus s'applique à toutes les compétences
    if (effects.skill === 'all') {
      effectEntry.effects.bonusSkill = 'all';
      skill = 'all';
    }
  }
}
```

### 2. API `/prepare` (`src/app/api/contrats/[id]/prepare/route.js`)

Même correction appliquée pour le système de loadout en batch.

### 3. Système de Test de Compétences (`src/Lib/skillTest.js`)

**Modification :**
```javascript
// Appliquer les effets actifs
if (activeEffects.bonusRoll && (activeEffects.bonusSkill === skill || activeEffects.bonusSkill === 'all')) {
  runnerSkill += activeEffects.bonusRoll;
}
```

### 4. Affichage des Effets Actifs (`src/components/ContractDetailsView.js`)

**Modification :**
```javascript
{activeEffects.bonusRoll > 0 && (
  <li>• <b>+{activeEffects.bonusRoll}</b> sur le prochain test de <b>{activeEffects.bonusSkill === 'all' ? 'TOUTES LES COMPÉTENCES' : activeEffects.bonusSkill?.toUpperCase()}</b></li>
)}
```

## 📋 Types de Bonus Supportés

### 1. Bonus Spécifiques
Les objets avec une propriété `skill` spécifique appliquent le bonus uniquement à cette compétence.

**Exemples :**
- **Patch de Focus** : `{ add_bonus_roll: 2, skill: "hacking" }`
- **Patch d'Infiltration** : `{ add_bonus_roll: 2, skill: "stealth" }`
- **Patch de Combat** : `{ add_bonus_roll: 2, skill: "combat" }`

### 2. Bonus Global
Les objets avec `skill: "all"` appliquent le bonus à toutes les compétences requises.

**Exemple :**
- **Fragment du 'Blackwall'** : `{ add_bonus_roll: 5, skill: "all" }`

### 3. Bonus Génériques
Les objets sans propriété `skill` appliquent le bonus à la première compétence du contrat (comportement par défaut).

**Exemple :**
- **Sandevistan** : `{ add_bonus_roll: 3 }`

## 🧪 Tests de Validation

### Script de Test
Un script de test complet a été créé : `scripts/test-skill-bonus.js`

**Tests effectués :**
1. ✅ Bonus spécifiques appliqués sur la bonne compétence
2. ✅ Bonus global (skill: "all") appliqué sur toutes les compétences
3. ✅ Réduction de difficulté appliquée globalement
4. ✅ Combinaison de bonus et réduction de difficulté fonctionne

### Exemple de Sortie de Test
```
🧪 Test de la logique de bonus de compétences

2️⃣ Test avec bonus spécifique (hacking)...
   Résultat global: Succès
   Taux de réussite: 100.0%
   Hacking: 8/7 (bonus: +3)

3️⃣ Test avec bonus global (all)...
   Résultat global: Succès
   Taux de réussite: 100.0%
   hacking: 7/7 (bonus: +2)
   stealth: 6/6 (bonus: +2)
   combat: 5/5 (bonus: +2)

🔍 Vérifications...
   ✅ Bonus hacking appliqué correctement (seulement sur hacking)
   ✅ Bonus global appliqué correctement (sur toutes les compétences)
   ✅ Réduction de difficulté appliquée correctement
```

## 🎮 Utilisation en Jeu

### Dans la Page Contrat
1. **Onglet "Bonus de mission"** : Sélectionnez les programmes à bonus
2. **Équiper pour la mission** : Les bonus sont appliqués selon leurs spécifications
3. **Effets actifs** : Affichage clair des bonus appliqués et de leur cible

### Exemples d'Utilisation
- **Patch de Focus** → Bonus +2 uniquement sur les tests de Hacking
- **Patch d'Infiltration** → Bonus +2 uniquement sur les tests de Stealth
- **Fragment du 'Blackwall'** → Bonus +5 sur tous les tests de compétences
- **Décharge IEM** → Réduction de -1 à la difficulté de tous les tests

## 🔄 Compatibilité

### Rétrocompatibilité
- Les objets existants sans propriété `skill` continuent de fonctionner (bonus sur la première compétence)
- Aucune modification requise des données existantes

### Évolutivité
- Support facile de nouveaux types de bonus
- Structure extensible pour de futurs effets

## 📝 Notes Techniques

### Structure des Effets
```javascript
effects: {
  add_bonus_roll: Number,    // Valeur du bonus
  skill: String | "all",     // Compétence cible (optionnel)
  reduce_difficulty: Number, // Réduction de difficulté (optionnel)
  skip_skill_check: Boolean  // Succès garanti (optionnel)
}
```

### Validation
- Vérification que la compétence spécifiée est bien requise par le contrat
- Fallback sur la première compétence si la compétence spécifiée n'est pas requise
- Support du cas spécial `skill: "all"` pour les bonus globaux

## 🎯 Résultat

Le système de loadout fonctionne maintenant correctement :
- ✅ Les bonus s'appliquent sur la compétence spécifiée dans l'objet
- ✅ Les bonus globaux s'appliquent sur toutes les compétences
- ✅ L'affichage des effets actifs est clair et précis
- ✅ La compatibilité avec les objets existants est maintenue 