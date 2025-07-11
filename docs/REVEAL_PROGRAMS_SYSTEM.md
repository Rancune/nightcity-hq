# Système de Révélation de Compétences

## 🎯 Problème Résolu

**Problème initial :** Dans la page détails d'un contrat, le premier programme utilisé pour révéler une compétence ne fonctionnait pas correctement. Il ajoutait un effet bonus vide mais ne révélait pas une compétence aléatoire. Il fallait utiliser un deuxième programme "Mouchard" pour que la révélation fonctionne.

**Solution :** Correction de la logique pour distinguer les programmes de révélation des programmes de bonus, et suppression des effets de bonus vides lors de l'utilisation de programmes de révélation.

## 🔧 Corrections Apportées

### 1. API `/use-program` (`src/app/api/contrats/[id]/use-program/route.js`)

**Problème :** L'API appliquait tous les effets du programme, y compris les bonus, même quand le programme était utilisé pour révéler une compétence.

**Solution :** Ajout d'une condition pour ne pas appliquer les bonus si le programme est utilisé pour révéler une compétence.

**Avant :**
```javascript
if (effects.add_bonus_roll) {
  // Appliquer les bonus même pour les programmes de révélation
  // ...
}
```

**Après :**
```javascript
// Ne pas appliquer les bonus si le programme est utilisé pour révéler une compétence
if (effects.add_bonus_roll && !effects.reveal_skill && !effects.reveal_all_skills) {
  // Appliquer les bonus seulement pour les programmes non-révélation
  // ...
}
```

### 2. API `/prepare` (`src/app/api/contrats/[id]/prepare/route.js`)

Même correction appliquée pour le système de loadout en batch.

### 3. Frontend (`src/components/ContractDetailsView.js`)

**Problème :** Le frontend appliquait automatiquement les effets de bonus même quand le programme était utilisé pour révéler une compétence.

**Solution :** Modification de la logique de gestion de la réponse pour ne pas appliquer les bonus lors de la révélation.

**Avant :**
```javascript
if (data.effects.add_bonus_roll) {
  setSkillBonuses(prev => ({
    ...prev,
    [data.skill]: (prev[data.skill] || 0) + data.effects.add_bonus_roll
  }));
}
```

**Après :**
```javascript
// Ne pas appliquer les bonus si le programme est utilisé pour révéler une compétence
if (data.effects.add_bonus_roll && !data.effects.reveal_skill && !data.effects.reveal_all_skills) {
  setSkillBonuses(prev => ({
    ...prev,
    [data.skill]: (prev[data.skill] || 0) + data.effects.add_bonus_roll
  }));
}
```

## 📋 Types de Programmes

### 1. Programmes de Révélation
Ces programmes révèlent des compétences sans appliquer de bonus.

**Logiciel 'Mouchard'**
```javascript
{
  reveal_skill: true
}
```
- Révèle une compétence aléatoire non révélée
- Aucun effet de bonus appliqué

**Analyseur de Contrat**
```javascript
{
  reveal_all_skills: true
}
```
- Révèle toutes les compétences testées
- Aucun effet de bonus appliqué

### 2. Programmes de Bonus
Ces programmes appliquent des bonus sans révéler de compétences.

**Sandevistan**
```javascript
{
  add_bonus_roll: 3
}
```
- Applique un bonus de +3 à une compétence
- Aucune révélation de compétence

**Patch de Focus**
```javascript
{
  add_bonus_roll: 2,
  skill: "hacking"
}
```
- Applique un bonus de +2 au Hacking
- Aucune révélation de compétence

### 3. Programmes Mixtes (Théoriques)
Ces programmes pourraient avoir plusieurs effets, mais la logique actuelle les traite comme des programmes de révélation.

```javascript
{
  add_bonus_roll: 1,
  reveal_skill: true
}
```
- Traité comme un programme de révélation
- Bonus ignoré pour éviter les conflits

## 🧪 Tests de Validation

### Script de Test
Un script de test complet a été créé : `scripts/test-reveal-programs.js`

**Tests effectués :**
1. ✅ Programmes de révélation ne créent plus d'effets de bonus vides
2. ✅ Logique de filtrage des effets implémentée
3. ✅ Révélation de compétences fonctionne dès le premier usage
4. ✅ Distinction claire entre programmes de révélation et de bonus

### Exemple de Sortie de Test
```
🧪 Test des programmes de révélation de compétences

1️⃣ Test du programme "Logiciel 'Mouchard'" (reveal_skill: true)...
   ✅ Programme de révélation détecté correctement
   ✅ Aucun effet de bonus appliqué

2️⃣ Test du programme "Analyseur de Contrat" (reveal_all_skills: true)...
   ✅ Programme de révélation complète détecté correctement
   ✅ Aucun effet de bonus appliqué

3️⃣ Test du programme "Sandevistan" (add_bonus_roll: 3)...
   ✅ Programme de bonus détecté correctement
   ✅ Effets de bonus appliqués

6️⃣ Test de la logique de filtrage des effets...
   Mouchard:
     Programme de révélation: Oui
     Bonus appliqué: Non
     ✅ Comportement correct
   Sandevistan:
     Programme de révélation: Non
     Bonus appliqué: Oui
     ✅ Comportement correct
```

## 🎮 Utilisation en Jeu

### Dans la Page Contrat
1. **Onglet "Révélation"** : Utilisez les programmes de révélation
2. **Révélation immédiate** : Les compétences sont révélées dès le premier usage
3. **Aucun effet de bonus** : Les programmes de révélation n'appliquent pas de bonus

### Flux de Révélation
1. **Sélection du programme** : Choisissez un programme de révélation
2. **Utilisation** : Cliquez sur "Révéler"
3. **Révélation immédiate** : Une compétence est révélée instantanément
4. **Mise à jour de l'interface** : La compétence apparaît comme révélée

### Exemples d'Utilisation
- **Logiciel 'Mouchard'** → Révèle une compétence aléatoire immédiatement
- **Analyseur de Contrat** → Révèle toutes les compétences immédiatement
- **Sandevistan** → Applique un bonus sans révéler de compétence

## 🔄 Compatibilité

### Rétrocompatibilité
- Les programmes existants continuent de fonctionner
- Aucune modification requise des données existantes
- Les effets de bonus des programmes non-révélation restent inchangés

### Évolutivité
- Support facile de nouveaux types de programmes
- Structure extensible pour de futurs effets
- Logique claire pour distinguer les types de programmes

## 📝 Notes Techniques

### Logique de Filtrage
```javascript
const isRevealProgram = effects.reveal_skill || effects.reveal_all_skills;
const shouldApplyBonus = effects.add_bonus_roll && !isRevealProgram;
```

### Ordre de Priorité
1. **Révélation** : Si le programme révèle des compétences, les bonus sont ignorés
2. **Bonus** : Si le programme n'a pas d'effet de révélation, les bonus sont appliqués
3. **Autres effets** : Les autres effets (réduction de difficulté, succès garanti) sont toujours appliqués

### Gestion des Erreurs
- Vérification de la possession du programme
- Validation des permissions selon le statut du contrat
- Gestion des cas où aucune compétence n'est à révéler

## 🎯 Résultat

Le système de révélation fonctionne maintenant correctement :
- ✅ Les programmes de révélation fonctionnent dès le premier usage
- ✅ Aucun effet de bonus vide n'est créé lors de la révélation
- ✅ Distinction claire entre programmes de révélation et de bonus
- ✅ Interface utilisateur mise à jour immédiatement
- ✅ Compatibilité maintenue avec les programmes existants

## 🚀 Améliorations Futures

### Possibilités d'Extension
- **Programmes hybrides** : Combiner révélation et bonus de manière contrôlée
- **Effets conditionnels** : Bonus qui s'appliquent seulement si certaines conditions sont remplies
- **Révélation progressive** : Révéler des informations partielles sur les compétences

### Optimisations
- **Cache des effets** : Mémoriser les effets calculés pour améliorer les performances
- **Validation avancée** : Vérifications plus sophistiquées des permissions et des conditions
- **Logs détaillés** : Traçabilité complète des effets appliqués 