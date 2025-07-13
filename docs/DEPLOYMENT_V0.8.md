# Guide de Déploiement - NightCity-HQ V0.8

## 🚀 Vue d'ensemble

Ce guide détaille la mise en production de NightCity-HQ V0.8 avec les systèmes de génération automatique de contrats et de runners.

## ✅ Prérequis

### Variables d'Environnement Requises

```bash
# Dans .env.local
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db-uri
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
GEMINI_API_KEY=your_gemini_api_key

# Optionnel (pour l'authentification des crons)
CRON_SECRET=your_cron_secret_here
```

### Vérification des Variables

```bash
# Tester les variables d'environnement
curl https://your-domain.com/api/test-env
```

## 🔧 Configuration des Systèmes Automatiques

### 1. Génération Automatique de Contrats

#### Configuration Automatique (Recommandée)
```bash
# Exécuter le script de configuration
npm run setup:cron
```

#### Configuration Manuelle
```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne pour la génération de contrats
*/15 6-22 * * * /usr/bin/node /chemin/vers/nightcity-hq/scripts/auto-generate-contracts.js >> /var/log/nightcity-auto-contracts.log 2>&1

# Ou pour la version simple (sans CRON_SECRET)
*/15 6-22 * * * /usr/bin/node /chemin/vers/nightcity-hq/scripts/auto-generate-simple.js >> /var/log/nightcity-auto-contracts.log 2>&1
```

#### Vérification
```bash
# Voir les logs en temps réel
tail -f /var/log/nightcity-auto-contracts.log

# Tester manuellement
npm run contracts:auto
# ou
npm run contracts:auto-simple
```

### 2. Génération Automatique de Runners

#### Configuration du Cron
```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne pour la génération de runners
0 */3 8-20 * * * /usr/bin/node /chemin/vers/nightcity-hq/scripts/auto-generate-runners.js >> /var/log/nightcity-auto-runners.log 2>&1
```

#### Vérification
```bash
# Voir les logs en temps réel
tail -f /var/log/nightcity-auto-runners.log

# Tester manuellement
npm run runners:auto
```

### 3. Systèmes Existants

#### Rotation du Marché (Déjà configuré)
```bash
# Vérifier que le cron existe
crontab -l | grep market

# Si absent, ajouter :
0 3 * * * /usr/bin/node /chemin/vers/nightcity-hq/scripts/rotate-market-stock.js >> /var/log/market-rotation.log 2>&1
```

#### Purge des Contrats (Vercel)
- Déjà configuré dans `vercel.json`
- S'exécute automatiquement à 5h du matin

## 📊 Monitoring et Logs

### Fichiers de Logs
```bash
# Contrats automatiques
tail -f /var/log/nightcity-auto-contracts.log

# Runners automatiques
tail -f /var/log/nightcity-auto-runners.log

# Rotation du marché
tail -f /var/log/market-rotation.log

# Logs de l'application
tail -f /var/log/your-app.log
```

### Commandes de Surveillance
```bash
# Vérifier les crons actifs
crontab -l

# Vérifier les processus Node.js
ps aux | grep node

# Vérifier l'espace disque
df -h

# Vérifier la mémoire
free -h
```

## 🧪 Tests de Production

### Test des Systèmes Automatiques
```bash
# Test de génération de contrats
npm run test:auto-generation

# Test de génération de runners
npm run runners:auto -- --test

# Test de rotation du marché
npm run market:test
```

### Test des API Endpoints
```bash
# Test de l'API de génération de contrats
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/crons/generate-contracts

# Test de l'API de génération de runners
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/crons/generate-runners-pool

# Test de l'API de purge
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/crons/purge-contracts
```

## 🔍 Vérifications Post-Déploiement

### 1. Vérification des Contrats
- [ ] Les contrats se génèrent automatiquement entre 6h et 22h
- [ ] Maximum 12 contrats affichés sur la map
- [ ] Probabilités variables selon l'heure
- [ ] Logs de génération dans `/var/log/nightcity-auto-contracts.log`

### 2. Vérification des Runners
- [ ] Le pool de recrutement se renouvelle automatiquement
- [ ] 6-8 candidats disponibles en permanence
- [ ] Noms et lore générés par IA
- [ ] Logs de génération dans `/var/log/nightcity-auto-runners.log`

### 3. Vérification du Marché
- [ ] Rotation automatique à 3h du matin
- [ ] Stock des objets "Signature" régénéré
- [ ] Logs de rotation dans `/var/log/market-rotation.log`

### 4. Vérification de la Purge
- [ ] Contrats expirés supprimés à 5h du matin
- [ ] Fonctionne via Vercel Cron

## 🚨 Dépannage

### Problèmes Courants

#### 1. Scripts ne s'exécutent pas
```bash
# Vérifier les permissions
ls -la scripts/auto-generate-contracts.js
chmod +x scripts/auto-generate-contracts.js

# Vérifier le chemin Node.js
which node

# Vérifier les variables d'environnement
echo $NODE_ENV
echo $MONGODB_URI
```

#### 2. Erreurs d'authentification
```bash
# Vérifier CRON_SECRET
echo $CRON_SECRET

# Tester l'API avec curl
curl -H "Authorization: Bearer YOUR_SECRET" \
  https://your-domain.com/api/crons/generate-contracts
```

#### 3. Pas de génération
- Vérifier l'heure actuelle (6h-22h pour contrats, 8h-20h pour runners)
- Vérifier les probabilités selon l'heure
- Vérifier les limites (12 contrats max, 8 runners max)

#### 4. Erreurs de base de données
```bash
# Vérifier la connexion MongoDB
# Vérifier les logs de l'application
# Vérifier la variable MONGODB_URI
```

### Commandes de Diagnostic
```bash
# Vérifier l'état des crons
systemctl status cron

# Voir les logs système
journalctl -u cron

# Vérifier les erreurs dans les logs
grep -i error /var/log/nightcity-auto-contracts.log

# Tester la connectivité
ping your-domain.com
```

## 📈 Métriques de Performance

### Métriques à Surveiller
- **Temps de réponse des API** : < 5 secondes
- **Taux de succès des générations** : > 95%
- **Nombre de contrats actifs** : 8-12
- **Nombre de runners dans le pool** : 6-8
- **Utilisation mémoire** : < 80%
- **Utilisation CPU** : < 70%

### Alertes Recommandées
- Erreurs HTTP 5xx
- Timeout des requêtes (>30s)
- Échec de connexion à la base de données
- Nombre de contrats > 10 (approche de la limite)
- Nombre de runners < 4 (pool vide)

## 🔄 Maintenance

### Tâches Quotidiennes
- Vérifier les logs d'erreur
- Surveiller les métriques de performance
- Vérifier l'état des crons

### Tâches Hebdomadaires
- Analyser les tendances de génération
- Vérifier l'utilisation des ressources
- Sauvegarder la base de données

### Tâches Mensuelles
- Mettre à jour les dépendances
- Réviser les probabilités de génération
- Analyser les logs pour optimisations

## 📞 Support

### En Cas de Problème
1. Vérifier les logs d'erreur
2. Consulter ce guide de dépannage
3. Tester manuellement les scripts
4. Vérifier la configuration des crons
5. Contacter l'équipe de développement

### Ressources Utiles
- [Documentation des contrats automatiques](docs/auto-contract-generation.md)
- [Documentation des runners](docs/RUNNER_GENERATION_SYSTEM.md)
- [Documentation du marché](docs/MARKET_ROTATION.md)
- [Scripts de test](scripts/)

---

**NightCity-HQ V0.8** - Prêt pour la production ! 🎮 