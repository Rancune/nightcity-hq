# Système de Marqueurs de Contrats

## Vue d'ensemble

Le système de marqueurs de contrats affiche les missions disponibles sur la carte de Night City avec des effets visuels cyberpunk avancés.

## Composants

### ContractMarker.js
- **Localisation** : `src/app/map/ContractMarker.js`
- **Fonction** : Affiche un marqueur interactif pour chaque contrat disponible
- **Icône** : Utilise `contrat.png` (80% de la taille du marqueur, centrée)
- **Mission type** : Masqué pour maintenir le mystère

### Styles CSS
- **Fichier** : `src/app/map/CityMap.module.css`
- **Classes principales** : `.contractMarker`, `.markerShape`, `.pulseRing`

## Effets Visuels

### Pulsation Améliorée
Le système utilise maintenant **3 niveaux d'effets de pulsation** :

1. **Marqueur Principal** :
   - Scale : 1.0 → 1.2 → 1.0
   - Glow : 3 niveaux de box-shadow colorés
   - Opacité : 0.8 → 1.0 → 0.8

2. **Premier Anneau** (pulseRing) :
   - Scale : 1.0 → 1.4 → 1.8
   - Opacité : 0.6 → 0.3 → 0
   - Border-width : 3px → 2px → 1px

3. **Deuxième Anneau** (pulseRing2) :
   - Scale : 1.2 → 1.6 → 2.0
   - Opacité : 0.4 → 0.2 → 0
   - Animation indépendante

### Vitesses de Pulsation
- **Niveau 1** (Facile) : 2.0s
- **Niveau 2** (Moyen) : 1.5s  
- **Niveau 3** (Difficile) : 1.0s
- **Niveau 4** (Très difficile) : 0.7s
- **Niveau 5** (Extrême) : 0.5s

### Couleurs par Difficulté
- **Vert** (#00ff00) : Niveaux 1-2
- **Jaune** (#ffff00) : Niveau 3
- **Orange** (#ff8000) : Niveau 4
- **Rouge** (#ff0000) : Niveau 5

## Structure du Marqueur

```
┌─────────────────────────────────┐
│           pulseRing2            │
│        (z-index: 0)             │
│                                 │
│    ┌─────────────────────┐      │
│    │     pulseRing       │      │
│    │   (z-index: 1)      │      │
│    │                     │      │
│    │  ┌─────────────┐    │      │
│    │  │   marker    │    │      │
│    │  │ (z-index:3) │    │      │
│    │  │             │    │      │
│    │  │   [ICON]    │    │      │
│    │  └─────────────┘    │      │
│    └─────────────────────┘      │
└─────────────────────────────────┘
```

## Interactions

### Hover Effects
- **Tooltip** : Informations détaillées du contrat
- **Glow** : Intensification des effets lumineux
- **Scale** : Légère augmentation de taille

### Click Actions
- **Briefing** : Modal avec détails complets
- **Acceptation** : Démarrage de la mission
- **Fermeture** : Retour à la carte

## Animations CSS

### Keyframes Principales
```css
@keyframes pulse {
  0% { 
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 0 0 20px 2px currentColor;
  }
  50% { 
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
    box-shadow: 0 0 40px 4px currentColor, 0 0 60px 8px currentColor;
  }
  100% { 
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 0 0 20px 2px currentColor;
  }
}
```

### Anneaux de Pulsation
```css
@keyframes pulseRing1 {
  0% { opacity: 0.6; transform: scale(1); border-width: 3px; }
  50% { opacity: 0.3; transform: scale(1.4); border-width: 2px; }
  100% { opacity: 0; transform: scale(1.8); border-width: 1px; }
}
```

## Tests

### Script de Test
```bash
node scripts/test-pulse-effects.js
```

### Vérifications
- ✅ Animations CSS présentes
- ✅ Composant avec double anneau
- ✅ Effets de glow améliorés
- ✅ Z-index corrects
- ✅ Vitesses adaptées

## Personnalisation

### Modifier les Vitesses
Éditer les classes `.pulse-1` à `.pulse-5` dans `CityMap.module.css`

### Changer les Couleurs
Modifier `difficultyColor` dans `ContractMarker.js`

### Ajuster les Tailles
Modifier les valeurs `scale()` dans les keyframes CSS

## Performance

- **Animations** : Utilisent `transform` et `opacity` pour de meilleures performances
- **Layering** : Z-index optimisés pour éviter les conflits
- **Hardware acceleration** : Animations GPU-accélérées

## Compatibilité

- **Navigateurs** : Support complet des animations CSS3
- **Mobile** : Responsive et touch-friendly
- **Accessibilité** : Tooltips et contrastes appropriés 