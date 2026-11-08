# FlexiFlow 🚀
**Plateforme ultra-flexible de gestion de projet, workflows modulaires, automatisations no-code et IA intégrée.**

FlexiFlow est conçu pour permettre aux équipes agiles, techniques et transverses de personnaliser à 100% leurs méthodes de travail : workflows et statuts sur-mesure, champs personnalisés dynamiques, automatisations conditionnelles et assistant IA Gemini pour extraire des tâches depuis des comptes rendus bruts ou produire des rapports d'avancement exécutifs.

---

## 🌟 Fonctionnalités Clés

### 1. Authentification & Rôles Granulaires (RBAC)
- **Google Sign-In** avec Firebase Authentication.
- Gestion d'organisations et d'espaces de travail d'équipe.
- 4 niveaux de permissions stricts :
  - **Admin** : Accès intégral, gestion des membres, organisation et projets.
  - **Manager** : Création/modification des projets, workflows, champs personnalisés et automatisations.
  - **Membre** : Création et avancement des tâches, commentaires, sous-tâches.
  - **Lecteur** : Consultation en lecture seule.
- Simulateur de rôles intégré dans l'onglet **Équipe** pour tester instantanément les restrictions.

### 2. Workflows & Statuts 100% Personnalisables
- Chaque projet possède son propre cycle de vie de tâches.
- Éditeur visuel pour ajouter, renommer, réordonner, colorer et supprimer des statuts.
- Catégorisation sémantique des statuts : *Non commencé*, *En cours*, *Bloqué*, *Terminé*.
- Templates inclus prêts à l'emploi : **Scrum**, **Kanban**, **Projet Client / Agence**, **Personnel**.

### 3. Vues Multiples & Sauvegardées
- **Vue Kanban** : Colonnes dynamiques avec glisser-déposer (Drag & Drop), calcul automatique des estimations d'heures et badges de criticité.
- **Vue Liste** : Tableau complet avec tri multi-colonnes, filtres croisés, colonnes de champs personnalisés et export **CSV** ou **Markdown**.
- **Vue Calendrier** : Visualisation mensuelle et hebdomadaire basée sur les dates d'échéances et jalons.
- **Tableau de Bord (Dashboard)** : KPI en direct (taux d'avancement %, tâches en retard, rééquilibrage de la charge par collaborateur, répartition par priorité).

### 4. Tâches Riches & Sous-tâches
- Sous-tâches avec barre de progression interactive et célébration confettis à 100%.
- Gestion des dépendances bloquantes (*Bloqué par* / *Bloque*).
- Fil de discussion et commentaires horodatés.
- Journal d'activité (Audit log) retraçant les modifications.

### 5. Champs Personnalisés
- Types supportés : Texte court, Texte long, Nombre, Date, Case à cocher, Liste déroulante, Sélection multiple, Utilisateur, URL.
- Support du marquage obligatoire (*requis*).
- Intégration automatique dans les formulaires de tâche, les filtres et la vue liste.

### 6. Automatisations No-Code
- Moteur de règles conditionnelles : **SI** [Déclencheur] **ALORS** [Action].
- Déclencheurs : Changement de statut, Changement de priorité, Création de tâche.
- Actions : Notification in-app, Ajout d'étiquette, Assignation automatique, Changement de statut, Création de sous-tâche.
- Journal d'exécution temps réel avec horodatage et statut de succès.

### 7. Assistant IA Gemini Intégré (modèle `gemini-3.8-flash`)
- **Importer un compte rendu de réunion** : Analyse du texte brut, extraction automatique des actions avec titre, responsable déduit, date limite et détection proactive des **risques** (actions sans responsable ou sans date). Import en 1 clic dans le projet !
- **Générer le rapport de statut** : Synthèse d'avancement au format Markdown structuré (synthèse exécutive, victoires récentes, tâches critiques, risques, recommandations).
- **Suggérer les priorités** : Algorithme IA d'arbitrage analysant dates limites, dépendances et charge pour recommander l'ordre optimal de traitement.
- **Sécurité** : Les requêtes Gemini s'exécutent côté serveur via des endpoints proxy sécurisés (`/api/gemini/*`). La clé API n'est jamais exposée au navigateur.

---

## 🛠️ Stack Technique

- **Frontend** : React 19 + TypeScript + Tailwind CSS v4 + Lucide Icons.
- **Backend Base de données & Auth** : Firebase Authentication + Cloud Firestore.
- **Règles de Sécurité** : `firestore.rules` avec contrôle d'accès strict par organisation et utilisateur.
- **Moteur IA** : SDK `@google/genai` avec le modèle `gemini-3.8-flash`.
- **Serveur de Production** : Node.js / Express avec build Vite optimisé (`server.ts`).

---

## 🚀 Lancement & Développement

### Mode Développement
```bash
# Lancer le serveur Vite de développement sur le port 3000
npm run dev
```

### Compilation & Vérification
```bash
# Compiler le frontend
npm run build

# Linter TypeScript
npm run lint
```

### Déploiement Google Cloud Run
FlexiFlow est entièrement configuré pour le déploiement Cloud Run via le bouton **Publish** de Google AI Studio :
1. Le script `"start": "tsx server.ts"` dans `package.json` démarre le serveur de production.
2. Le serveur Express écoute sur `0.0.0.0` et le port spécifié par l'environnement `$PORT` (ou 3000).
3. Les endpoints d'API Gemini et les fichiers statiques du build sont servis de manière unifiée.
