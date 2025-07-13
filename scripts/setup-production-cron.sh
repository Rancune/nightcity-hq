#!/bin/bash

# Script de configuration du cron job pour la production V0.8
# Usage: chmod +x scripts/setup-production-cron.sh && ./scripts/setup-production-cron.sh

echo "🚀 Configuration du cron job pour NightCity-HQ V0.8"
echo "=================================================="

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Obtenir le chemin absolu du projet
PROJECT_PATH=$(pwd)
NODE_PATH=$(which node)

echo "📁 Chemin du projet: $PROJECT_PATH"
echo "🔧 Chemin de Node.js: $NODE_PATH"

# Vérifier que les scripts existent
if [ ! -f "scripts/auto-generate-contracts.js" ]; then
    echo "❌ Erreur: Script auto-generate-contracts.js non trouvé"
    exit 1
fi

if [ ! -f "scripts/auto-generate-simple.js" ]; then
    echo "❌ Erreur: Script auto-generate-simple.js non trouvé"
    exit 1
fi

# Rendre les scripts exécutables
chmod +x scripts/auto-generate-contracts.js
chmod +x scripts/auto-generate-simple.js

echo "✅ Scripts rendus exécutables"

# Créer le fichier de log
LOG_FILE="/var/log/nightcity-auto-contracts.log"
sudo touch $LOG_FILE
sudo chmod 666 $LOG_FILE

echo "📝 Fichier de log créé: $LOG_FILE"

# Demander à l'utilisateur quelle version utiliser
echo ""
echo "Choisissez la version du script à utiliser:"
echo "1) Version avec CRON_SECRET (recommandée si CRON_SECRET est configuré)"
echo "2) Version simple avec URL secrète (recommandée pour Cloudpanel)"
read -p "Votre choix (1 ou 2): " choice

case $choice in
    1)
        SCRIPT_PATH="$PROJECT_PATH/scripts/auto-generate-contracts.js"
        echo "✅ Utilisation de la version avec CRON_SECRET"
        ;;
    2)
        SCRIPT_PATH="$PROJECT_PATH/scripts/auto-generate-simple.js"
        echo "✅ Utilisation de la version simple"
        ;;
    *)
        echo "❌ Choix invalide, utilisation de la version simple par défaut"
        SCRIPT_PATH="$PROJECT_PATH/scripts/auto-generate-simple.js"
        ;;
esac

# Créer la ligne de cron
CRON_LINE="*/15 6-22 * * * $NODE_PATH $SCRIPT_PATH >> $LOG_FILE 2>&1"

echo ""
echo "📅 Ligne de cron à ajouter:"
echo "$CRON_LINE"
echo ""

# Demander confirmation
read -p "Voulez-vous ajouter cette ligne au crontab ? (y/N): " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    # Ajouter au crontab
    (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
    
    echo "✅ Cron job ajouté avec succès!"
    echo ""
    echo "📋 Vérification:"
    echo "Crontab actuel:"
    crontab -l | grep nightcity
    echo ""
    echo "🔍 Pour surveiller les logs:"
    echo "tail -f $LOG_FILE"
    echo ""
    echo "🧪 Pour tester manuellement:"
    echo "$NODE_PATH $SCRIPT_PATH"
else
    echo "❌ Configuration annulée"
    echo ""
    echo "Pour configurer manuellement, ajoutez cette ligne à votre crontab:"
    echo "$CRON_LINE"
fi

echo ""
echo "🎉 Configuration terminée!"
echo "📖 Documentation: docs/auto-contract-generation.md" 