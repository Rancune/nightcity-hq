# Système de Rotation du Stock - Marché Noir

## Vue d'ensemble

Le système de rotation du stock du marché noir permet de régénérer automatiquement les objets "Signature" (stock limité) tous les jours à 3h00 du matin en production, et offre un bouton de test en développement.

## Fonctionnalités

### En Production
- **Rotation automatique** : Tous les jours à 3h00 du matin
- **Objets Signature** : Stock limité qui se régénère à chaque rotation
- **Horodatage** : Suivi des rotations passées et futures
- **Cron job** : Exécution automatique via script

### En Développement
- **Bouton de test** : Régénération manuelle du stock
- **Visibilité** : Bouton visible uniquement en mode développement
- **Feedback** : Messages de confirmation et d'erreur

## Configuration

### Variables d'environnement requises
```env
MONGODB_URI=mongodb://localhost:27017/nightcity-hq
NODE_ENV=development  # ou production
```

### Configuration du Cron Job (Production)

1. **Accéder au crontab** :
```bash
crontab -e
```

2. **Ajouter la ligne suivante** :
```bash
# Rotation du stock du marché noir à 3h00 du matin
0 3 * * * /usr/bin/node /path/to/nightcity-hq/scripts/rotate-market-stock.js >> /var/log/market-rotation.log 2>&1
```

3. **Rendre le script exécutable** :
```bash
chmod +x scripts/rotate-market-stock.js
```

### Configuration alternative avec PM2

Si vous utilisez PM2, vous pouvez créer un script de cron :

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'market-rotation',
    script: 'scripts/rotate-market-stock.js',
    cron_restart: '0 3 * * *',
    autorestart: false,
    watch: false
  }]
};
```

## Structure des données

### Modèle MarketState
```javascript
{
  marketId: 'global',
  lastStockRotation: Date,
  nextStockRotation: Date,
  currentStock: Map, // Stock des objets Signature
  config: {
    rotationHour: 3,
    rotationInterval: 24,
    enableRotation: true
  }
}
```

### Objets Signature
Les objets avec `isSignature: true` ont un stock limité qui se régénère à chaque rotation :
- `netrunner-fantome-zero-day` : Stock de 2
- `netrunner-fantome-blackwall` : Stock de 1

## API Endpoints

### GET /api/market/rotate-stock
- Vérifie si une rotation est nécessaire
- Effectue la rotation automatiquement si besoin
- Retourne l'état du marché

### POST /api/market/rotate-stock
- Force une rotation manuelle
- Utilisé par le bouton de développement

## Monitoring

### Logs
Les rotations sont loggées avec les préfixes :
- `[MARKET ROTATION]` : Script autonome
- `[MARKET]` : API intégrée

### Vérification
Pour vérifier l'état du marché :
```bash
# Voir les logs de rotation
tail -f /var/log/market-rotation.log

# Tester manuellement
node scripts/rotate-market-stock.js
```

## Dépannage

### Problèmes courants

1. **Script non exécutable** :
```bash
chmod +x scripts/rotate-market-stock.js
```

2. **Variables d'environnement manquantes** :
```bash
# Vérifier que .env.local existe
ls -la .env.local
```

3. **Permissions de base de données** :
```bash
# Vérifier la connexion MongoDB
mongo $MONGODB_URI --eval "db.adminCommand('ping')"
```

### Test en développement
```bash
# Lancer le script manuellement
npm run dev
# Puis cliquer sur le bouton "Régénérer le Stock (DEV)"
```

## Sécurité

- Le bouton de régénération n'est visible qu'en développement
- Les rotations automatiques sont horodatées et tracées
- Aucune donnée sensible n'est exposée dans les logs

## Maintenance

### Mise à jour de la configuration
Pour modifier l'heure de rotation :
1. Modifier `config.rotationHour` dans le modèle MarketState
2. Redémarrer l'application
3. Mettre à jour le cron job si nécessaire

### Sauvegarde
Le système de rotation ne modifie que les données de stock, les objets de base restent inchangés. 