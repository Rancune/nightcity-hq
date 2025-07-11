# Night City HQ

**Night City HQ** est un jeu de gestion de netrunners dans l'univers cyberpunk de Night City (inspiré de Cyberpunk 2077). Incarnez un Fixer, recrutez et gérez une équipe de hackers d'élite, acceptez des contrats risqués, et bâtissez votre réputation dans les bas-fonds de la ville la plus dangereuse du futur.

---

## 🚀 Concept

- **Incarnez un Fixer** : Gérez une équipe de netrunners, choisissez les meilleurs profils pour chaque mission.
- **Contrats dynamiques** : Acceptez des missions générées par IA, chacune avec ses propres compétences requises, factions impliquées, et récompenses.
- **Gestion multi-runner** : Assignez plusieurs runners à un même contrat, chaque compétence testée étant couverte par un spécialiste.
- **Résolution automatisée** : Les missions se résolvent automatiquement après un timer, avec un rapport debriefing généré par IA (lore, conséquences, XP, réputation, récompenses, etc.).
- **Progression & Level Up** : Les runners gagnent de l'expérience, montent de niveau, et peuvent mourir ou être grillés selon les risques pris.
- **Réputation & factions** : Vos choix influencent votre réputation et vos relations avec les différentes factions de Night City.

---

## 🕹️ Mécaniques principales

- **Recrutement & gestion d'équipe** : Recrutez, équipez et spécialisez vos netrunners.
- **Contrats** :
  - Analysez les missions, assignez les runners selon leurs compétences (hacking, infiltration, combat).
  - Lancez la mission, attendez la résolution automatique.
  - Consultez le rapport détaillé (succès/échec, XP, statut, cause de mort, part du Fixer, etc.).
- **Marché noir** : Achetez/équipez des programmes, cyberwares, gadgets pour booster vos chances.
- **Lore dynamique** : Chaque mission génère un debriefing unique, immersif, et adapté à l'issue de la mission.

---

## 🛠️ Installation & Lancement

1. **Cloner le repo**
   ```bash
   git clone https://github.com/Rancune/nightcity-hq.git
   cd nightcity-hq
   ```
2. **Installer les dépendances**
   ```bash
   npm install
   # ou
   yarn install
   ```
3. **Lancer le serveur de dev**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```
4. **Ouvrir le jeu**
   - Rendez-vous sur [http://localhost:3000](http://localhost:3000)

---

## 📦 Tech Stack
- **Next.js** (React, API routes)
- **MongoDB** (stockage joueurs, runners, contrats)
- **Clerk** (authentification)
- **Tailwind CSS** (UI)
- **OpenAI** (génération de lore et debriefing)

---

## 📖 Exemples de flux de jeu
1. **Accepter un contrat**
2. **Assigner les runners aux compétences requises**
3. **Lancer la mission (timer)**
4. **Lire le rapport de mission généré par IA**
5. **Gérer les conséquences (XP, mort, réputation, récompenses)**

---

## 🤖 API & Personnalisation
- Voir le dossier `/src/app/api/contrats/` pour les endpoints principaux (création, assignation, résolution, rapport, etc.).
- Les missions, runners et récompenses sont entièrement dynamiques et adaptables.
- **Génération IA** : Les contrats et les runners sont générés par IA avec des noms et lore uniques.

## 🎭 Génération de Runners par IA

Le système génère automatiquement des noms et des backgrounds uniques pour chaque netrunner :

### Fonctionnalités
- **Noms cyberpunk** : Style authentique (ex: "Jax Vector", "Cyra Byte")
- **Lore personnalisé** : Background adapté aux compétences du runner
- **Types spécialisés** : Hacker, Combattant, Infiltrateur, Équilibré
- **Fallback robuste** : Système de secours en cas d'indisponibilité de l'IA

### Utilisation
```bash
# Tester la génération de runners
node scripts/test-runner-generation.js
```

📖 **Documentation complète** : [docs/RUNNER_GENERATION_SYSTEM.md](docs/RUNNER_GENERATION_SYSTEM.md)

---

## 🔄 Génération Automatique de Contrats

Le système de génération automatique de contrats permet de créer des missions à intervalles aléatoires pendant la journée (6h-22h), sans intervention manuelle.

### Fonctionnalités
- **Heures actives** : 6h00 à 22h00 uniquement
- **Probabilités variables** : 30% à 90% selon l'heure de la journée
- **Limite maximale** : 12 contrats affichés sur la map
- **Production uniquement** : Ne fonctionne qu'en environnement de production

## 🎭 Système d'Icônes Masquées

Les contrats sur la map utilisent une icône personnalisée uniforme pour masquer le type de mission et les compétences requises.

### Fonctionnalités
- **Icône uniforme** : `contrat.png` pour tous les contrats
- **Masquage stratégique** : Type de mission et compétences cachés
- **Découverte progressive** : Informations révélées à l'acceptation
- **Design cohérent** : Couleurs de difficulté et pulsation conservées
- **Effets de pulsation avancés** : 3 niveaux d'animations avec anneaux multiples

### Effets Visuels
- **Marqueur principal** : Pulsation avec glow coloré (scale 1.2)
- **Anneaux multiples** : Expansion et fade-out progressifs
- **Vitesses adaptatives** : 0.5s à 2s selon la difficulté
- **Couleurs dynamiques** : Vert → Jaune → Orange → Rouge

### Utilisation
```bash
# Tester le système d'icônes
node scripts/test-contract-marker.js

# Tester les effets de pulsation
node scripts/test-pulse-effects.js
```

📖 **Documentation complète** : [docs/CONTRACT_MARKER_SYSTEM.md](docs/CONTRACT_MARKER_SYSTEM.md)

### Configuration
```bash
# Tester le système
node scripts/test-auto-generation.js

# Configuration du cron (production)
*/15 6-22 * * * /usr/bin/node /chemin/vers/scripts/auto-generate-contracts.js
```

📖 **Documentation complète** : [docs/auto-contract-generation.md](docs/auto-contract-generation.md)

---

*Bienvenue à Night City, choomba. Prends le contrôle du réseau... ou meurs en essayant.*
