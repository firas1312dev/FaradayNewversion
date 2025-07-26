# Interface Web Personnalisée pour Faraday Security

Cette interface web personnalisée consomme l'API REST de Faraday Security et offre une expérience utilisateur moderne avec les modules Graphics et Planner intégrés.

## 🚀 Fonctionnalités

### 📊 Dashboard
- Statistiques en temps réel (hosts, services, vulnérabilités, commandes)
- Graphique de distribution des vulnérabilités par sévérité
- Flux d'activité récente
- Mise à jour automatique

### 🖥️ Gestion des Hosts
- Liste complète des hosts découverts
- Filtrage et recherche en temps réel
- Statut des hosts (actif/inactif)
- Détails complets pour chaque host

### ⚙️ Gestion des Services
- Inventaire des services réseau
- Information sur les ports et protocoles
- Versions et détails techniques
- Recherche avancée

### 🐛 Gestion des Vulnérabilités
- Liste complète des vulnérabilités
- Filtrage par sévérité (critique, élevée, moyenne, faible, info)
- Codes couleur pour la sévérité
- Statut des vulnérabilités (confirmées, ouvertes, fermées)

### 📈 Module Graphics
- **Distribution des vulnérabilités** : Graphique en barres par sévérité et statut
- **Évolution temporelle** : Tendance des découvertes sur 12 mois
- **Top 10 services** : Services les plus fréquents
- **Statut des hosts** : Répartition des hosts actifs/inactifs

### 📅 Module Planner
- **Calendrier interactif** : Navigation mensuelle avec événements
- **Gestion des tâches** : Création, modification, suppression
- **Timeline des événements** : Vue chronologique des activités
- **Planification automatique** : Basée sur les commandes Faraday

### 💻 Gestion des Commandes
- Historique complet des commandes exécutées
- Durée d'exécution et statut
- Outils utilisés et utilisateurs
- Recherche et filtrage

### 🤖 Gestion des Agents
- État des agents Faraday (en ligne/hors ligne)
- Gestion des tokens d'agent
- Informations sur les executors
- Création et suppression d'agents

## 🛠️ Technologies Utilisées

- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **Graphiques** : Chart.js
- **WebSocket** : Socket.IO pour les mises à jour temps réel
- **API** : REST API v3 de Faraday Security
- **Authentification** : Basic Auth + Session cookies + CSRF tokens

## 📋 Prérequis

- Serveur Faraday Security en fonctionnement
- Navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Accès réseau au serveur Faraday

## 🚀 Installation et Configuration

### 1. Structure des fichiers
```
custom-web-interface/
├── index.html              # Page principale
├── css/
│   └── styles.css          # Styles CSS
├── js/
│   ├── api.js             # Client API Faraday
│   ├── auth.js            # Gestion authentification
│   ├── dashboard.js       # Module Dashboard
│   ├── graphics.js        # Module Graphics
│   ├── planner.js         # Module Planner
│   └── app.js             # Application principale
└── README.md              # Ce fichier
```

### 2. Configuration du serveur Faraday

Assurez-vous que votre serveur Faraday est configuré pour permettre les requêtes CORS :

```bash
# Dans docker-compose.yaml
environment:
  - FARADAY_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 3. Lancement de l'interface

#### Option 1 : Serveur HTTP local (recommandé)
```bash
# Avec Python
cd custom-web-interface
python -m http.server 3000

# Avec Node.js
npx http-server -p 3000

# Avec PHP
php -S localhost:3000
```

#### Option 2 : Ouverture directe
Ouvrez simplement `index.html` dans votre navigateur.

### 4. Connexion à Faraday

1. Ouvrez l'interface dans votre navigateur : `http://localhost:3000`
2. Connectez-vous avec vos identifiants Faraday :
   - **Nom d'utilisateur** : faraday
   - **Mot de passe** : faraday
   - **Serveur** : http://localhost:5985

## 🔧 Configuration

### Variables importantes dans `api.js` :

```javascript
// URL de base du serveur Faraday
this.baseURL = 'http://localhost:5985';

// Version de l'API
this.apiVersion = '_api/v3';
```

### Personnalisation des couleurs dans `styles.css` :

```css
:root {
    --primary-color: #2c3e50;      /* Couleur principale */
    --secondary-color: #3498db;     /* Couleur secondaire */
    --success-color: #27ae60;       /* Couleur succès */
    --warning-color: #f39c12;       /* Couleur avertissement */
    --error-color: #e74c3c;         /* Couleur erreur */
}
```

## 📱 Utilisation

### Navigation
- **Dashboard** : Vue d'ensemble avec statistiques et graphiques
- **Hosts** : Gestion des hosts découverts
- **Services** : Inventaire des services réseau
- **Vulnérabilités** : Gestion des vulnérabilités de sécurité
- **Graphics** : Visualisations et analyses graphiques
- **Planner** : Planification et gestion des tâches
- **Commandes** : Historique des commandes exécutées
- **Agents** : Gestion des agents Faraday

### Raccourcis clavier
- **Ctrl/Cmd + 1-8** : Navigation rapide entre les sections
- **F5** : Actualiser la section actuelle

### Recherche et filtrage
- Utilisez les champs de recherche pour filtrer les données
- Les filtres de sévérité permettent un tri avancé des vulnérabilités
- La recherche est en temps réel sans nécessiter de rechargement

## 🔄 Mises à jour temps réel

L'interface se connecte automatiquement via WebSocket pour recevoir les mises à jour en temps réel :
- Nouvelles vulnérabilités découvertes
- Mises à jour des hosts et services
- Fin d'exécution des commandes
- Changements d'état des agents

## 📊 Module Graphics - Détails

### 1. Distribution des vulnérabilités
- Graphique en barres groupées par sévérité
- Séparation par statut (confirmées, ouvertes, fermées)
- Codes couleur standards de sécurité

### 2. Évolution temporelle
- Graphique linéaire sur 12 mois glissants
- Tendance des découvertes de vulnérabilités
- Zone colorée sous la courbe

### 3. Top services
- Graphique en barres des services les plus fréquents
- Top 10 automatique
- Couleurs dynamiques

### 4. Statut des hosts
- Graphique en secteurs (pie chart)
- Répartition actifs/inactifs/inconnus
- Pourcentages détaillés

## 📅 Module Planner - Détails

### Calendrier
- Navigation mensuelle avec boutons précédent/suivant
- Indicateurs visuels pour les jours avec événements
- Sélection de date interactive
- Mise en surbrillance du jour actuel

### Gestion des tâches
- **Création** : Formulaire simple avec titre, description, date
- **Modification** : Édition en place des tâches existantes
- **Suppression** : Confirmation avant suppression
- **Statuts** : Pending, completed, overdue avec codes couleur

### Timeline
- Vue chronologique des événements récents et futurs
- Icônes différenciées par type de tâche
- Marqueurs temporels avec détails

### Types de tâches
- **command** : Commandes Faraday exécutées
- **scan** : Analyses de sécurité programmées
- **report** : Génération de rapports
- **update** : Mises à jour système
- **audit** : Audits de sécurité
- **training** : Formations équipe

## 🔐 Sécurité

### Authentification
- Support Basic Auth pour la connexion initiale
- Gestion des sessions avec cookies sécurisés
- Protection CSRF avec tokens automatiques
- Déconnexion automatique en cas d'inactivité

### API Security
- Toutes les requêtes incluent les headers de sécurité
- Gestion des erreurs 401/403 avec redirection
- Validation côté client et serveur
- Échappement automatique des données utilisateur

## 🐛 Dépannage

### Problèmes de connexion
1. Vérifiez que Faraday est accessible sur `http://localhost:5985`
2. Contrôlez les paramètres CORS du serveur
3. Vérifiez les identifiants de connexion
4. Consultez la console du navigateur pour les erreurs

### Problèmes d'affichage
1. Effacez le cache du navigateur
2. Vérifiez que JavaScript est activé
3. Testez avec un autre navigateur
4. Contrôlez les erreurs dans la console développeur

### Problèmes de données
1. Vérifiez la sélection du workspace
2. Contrôlez les permissions utilisateur dans Faraday
3. Testez l'API directement avec `curl` ou Postman
4. Vérifiez les logs du serveur Faraday

## 📝 Développement

### Structure du code
- **api.js** : Client API REST avec gestion d'erreurs complète
- **auth.js** : Système d'authentification et gestion des sessions
- **dashboard.js** : Logique du tableau de bord et statistiques
- **graphics.js** : Moteur de génération des graphiques
- **planner.js** : Calendrier et gestion des tâches
- **app.js** : Orchestrateur principal et navigation

### Extension
Pour ajouter de nouvelles fonctionnalités :
1. Créez un nouveau fichier JS dans le dossier `js/`
2. Ajoutez le script dans `index.html`
3. Utilisez `faradayAPI` pour les appels serveur
4. Respectez les conventions de nommage existantes

### Personnalisation
- Modifiez `styles.css` pour les couleurs et styles
- Adaptez les graphiques dans `graphics.js`
- Configurez les types de tâches dans `planner.js`
- Ajustez les intervalles de rafraîchissement

## 📞 Support

Pour toute question ou problème :
1. Consultez la documentation officielle de Faraday
2. Vérifiez les logs dans la console du navigateur
3. Testez l'API Faraday directement
4. Contrôlez la configuration réseau et CORS

## 📄 Licence

Cette interface utilise les mêmes termes de licence que Faraday Security. Consultez le fichier LICENSE du projet principal pour plus d'informations.

---

**Interface Web Personnalisée pour Faraday Security v1.0**  
Compatible avec Faraday Security v5.x+  
Développée avec ❤️ pour la communauté Faraday
