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

---



---

*Bienvenue à Night City, choomba. Prends le contrôle du réseau... ou meurs en essayant.*
