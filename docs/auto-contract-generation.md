# Génération Automatique de Contrats

## Vue d'ensemble

Le système de génération automatique de contrats permet de créer des contrats à intervalles aléatoires pendant la journée, sans intervention manuelle. Ce système ne fonctionne qu'en environnement de production.

### Système de récompenses basé sur la réputation des factions

Les récompenses des contrats sont maintenant calculées en tenant compte de la réputation du joueur avec la faction donneuse d'ordre :

- **Réputation positive** : Plus de récompenses (jusqu'à +50% pour les alliés)
- **Réputation négative** : Moins de récompenses (jusqu'à -60% pour les ennemis mortels)
- **Contrats automatiques** : Utilisent une réputation neutre (0) pour simuler un fixer moyen

## Fonctionnalités

### 🕐 Heures d'activité
- **Période active** : 6h00 à 22h00
- **Période inactive** : 22h00 à 6h00 (aucune génération)

### 📊 Probabilités par heure
| Heure | Probabilité | Description |
|-------|-------------|-------------|
| 6h    | 30%         | Début de journée |
| 7h    | 40%         | Réveil des fixers |
| 8h    | 50%         | Activité croissante |
| 9h    | 60%         | Début de travail |
| 10h   | 70%         | Activité normale |
| 11h   | 80%         | Avant-midi actif |
| 12h   | 90%         | **Heure de pointe** |
| 13h   | 90%         | **Heure de pointe** |
| 14h   | 80%         | Après-midi actif |
| 15h   | 70%         | Activité normale |
| 16h   | 60%         | Fin de journée de travail |
| 17h   | 70%         | Retour des travailleurs |
| 18h   | 80%         | **Heure de pointe** |
| 19h   | 80%         | **Heure de pointe** |
| 20h   | 70%         | Soirée active |
| 21h   | 50%         | Activité décroissante |
| 22h   | 30%         | Fin de journée |

### 🎯 Limites
- **Maximum** : 12 contrats affichés sur la map à tout moment
- **Génération** : 1-3 contrats par exécution selon l'heure
- **Fréquence** : Toutes les 15-30 minutes (selon probabilité)

### 💰 Système de récompenses
- **Réputation du joueur** : 20 points (moyenne pour contrats auto)
- **Réputation avec faction** : Neutre (0) pour contrats auto
- **Multiplicateurs** : Basés sur la réputation avec la faction donneuse d'ordre

## Configuration

### Variables d'environnement requises

#### Option 1 : Avec CRON_SECRET (recommandé si possible)
```bash
# Dans .env.local
CRON_SECRET=votre_secret_ici
NODE_ENV=production
MONGODB_URI=votre_uri_mongodb
```

#### Option 2 : Sans CRON_SECRET (pour Cloudpanel)
```bash
# Dans .env.local
NODE_ENV=production
MONGODB_URI=votre_uri_mongodb
# Pas besoin de CRON_SECRET
```

### Configuration du Cron Job

#### Option 1 : Avec CRON_SECRET (recommandé)
```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne
*/15 6-22 * * * /usr/bin/node /chemin/vers/nightcity-hq/scripts/auto-generate-contracts.js
```

#### Option 2 : Sans CRON_SECRET (pour Cloudpanel)
```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne
*/15 6-22 * * * /usr/bin/node /chemin/vers/nightcity-hq/scripts/auto-generate-simple.js
```

#### Option 2 : Cron toutes les 30 minutes
```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne
*/30 6-22 * * * /usr/bin/node /chemin/vers/nightcity-hq/scripts/auto-generate-contracts.js
```

#### Option 3 : Cron personnalisé
```bash
# Exemple : toutes les 20 minutes entre 8h et 20h
*/20 8-20 * * * /usr/bin/node /chemin/vers/nightcity-hq/scripts/auto-generate-contracts.js
```

### Vérification du chemin Node.js
```bash
# Trouver le chemin de Node.js
which node

# Exemple de sortie : /usr/bin/node
```

## Utilisation

### Test en développement
```bash
# Tester le système (fonctionne même en dev)
node scripts/test-auto-generation.js

# Tester le système de récompenses par faction
node scripts/test-faction-rewards.js

# Tester la version simple (sans CRON_SECRET)
node scripts/auto-generate-simple.js -t

# Ou
node scripts/auto-generate-contracts.js -t
```

### Test en production
```bash
# Exécuter manuellement
node scripts/auto-generate-contracts.js
```

### Vérification des logs
```bash
# Voir les logs du cron
tail -f /var/log/cron

# Ou si vous avez configuré la redirection des logs
tail -f /var/log/auto-contracts.log
```

## Système de Récompenses

### Multiplicateurs basés sur la réputation des factions

Le système calcule les récompenses en tenant compte de la réputation du joueur avec la faction donneuse d'ordre :

| Statut de réputation | Points | Multiplicateur | Impact |
|---------------------|--------|----------------|---------|
| Allié | 500+ | +50% | Récompenses maximales |
| Ami | 200+ | +30% | Récompenses élevées |
| Favorable | 50+ | +15% | Récompenses bonnes |
| Neutre | -50 à 50 | +0% | Récompenses normales |
| Hostile | -200 à -50 | -20% | Récompenses réduites |
| Ennemi | -500 à -200 | -40% | Récompenses faibles |
| Mortel | -500 et moins | -60% | Récompenses minimales |

### Exemples de récompenses (Niveau de menace 3)

| Faction | Réputation | Récompense de base | Récompense finale |
|---------|------------|-------------------|-------------------|
| Arasaka | 500 (Allié) | 25,000 €$ | 37,500 €$ |
| Arasaka | 0 (Neutre) | 25,000 €$ | 25,000 €$ |
| Arasaka | -500 (Ennemi) | 25,000 €$ | 15,000 €$ |
| Scavengers | 0 (Neutre) | 18,000 €$ | 18,000 €$ |

### Contrats automatiques

Les contrats générés automatiquement utilisent :
- **Réputation du joueur** : 20 points (niveau débutant)
- **Réputation avec faction** : 0 (neutre)
- **Raison** : Simule un fixer moyen sans relations particulières

## API Endpoint

### GET /api/crons/generate-contracts

**Authentification** : Bearer token avec `CRON_SECRET`

**Réponse de succès** :
```json
{
  "success": true,
  "generated": 2,
  "currentTotal": 8,
  "hour": 14,
  "probability": 0.7,
  "contracts": [
    {
      "id": "contract_id_1",
      "title": "Infiltration Arasaka",
      "threatLevel": "MEDIUM",
      "reward": {
        "eddies": 25000,
        "reputation": 15
      }
    }
  ]
}
```

**Réponse sans génération** :
```json
{
  "success": true,
  "message": "Pas de génération cette fois (probabilité: 70.0%)"
}
```

## Monitoring

### Logs à surveiller
- `[AUTO-GENERATE]` : Logs de génération
- `[AUTO-GENERATE] Erreur` : Erreurs de génération
- `[AUTO-GENERATE] Succès` : Générations réussies

### Métriques importantes
- Nombre de contrats générés par heure
- Taux de succès des générations
- Temps de réponse de l'API
- Nombre total de contrats sur la map

### Alertes recommandées
- Erreurs HTTP 5xx
- Timeout des requêtes (>30s)
- Échec de connexion à la base de données
- Nombre de contrats > 10 (approche de la limite)

## Dépannage

### Problèmes courants

#### 1. Script ne s'exécute pas
```bash
# Vérifier les permissions
ls -la scripts/auto-generate-contracts.js

# Vérifier le chemin Node.js
which node

# Tester manuellement
node scripts/auto-generate-contracts.js
```

#### 2. Erreur d'authentification
```bash
# Vérifier la variable CRON_SECRET
echo $CRON_SECRET

# Vérifier dans .env.local
cat .env.local | grep CRON_SECRET
```

#### 3. Pas de génération
- Vérifier l'heure actuelle (6h-22h uniquement)
- Vérifier la probabilité selon l'heure
- Vérifier le nombre de contrats existants (< 12)

#### 4. Erreurs de base de données
```bash
# Vérifier la connexion MongoDB
# Vérifier les logs de l'application
# Vérifier la variable MONGODB_URI
```

### Commandes utiles

```bash
# Voir le crontab actuel
crontab -l

# Éditer le crontab
crontab -e

# Voir les logs du système
journalctl -u cron

# Tester l'API directement
curl -H "Authorization: Bearer $CRON_SECRET" \
     https://fixer.rancune.games/api/crons/generate-contracts
```

## Sécurité

### Bonnes pratiques
1. **Secret fort** : Utiliser un `CRON_SECRET` complexe
2. **HTTPS** : Toujours utiliser HTTPS en production
3. **Logs** : Surveiller les tentatives d'accès non autorisées
4. **Permissions** : Limiter les permissions du script
5. **Isolation** : Exécuter dans un environnement isolé

### Variables sensibles
- `CRON_SECRET` : Ne jamais exposer publiquement
- `MONGODB_URI` : Contient les credentials de la base de données
- `ERROR_WEBHOOK_URL` : URL de notification d'erreurs (optionnel)

## Évolution

### Améliorations futures possibles
1. **Machine Learning** : Ajuster les probabilités selon l'activité des joueurs
2. **Types de contrats** : Varier les types selon l'heure
3. **Événements spéciaux** : Génération accrue lors d'événements
4. **Géolocalisation** : Adapter selon le fuseau horaire des joueurs
5. **Analytics** : Dashboard de monitoring en temps réel 