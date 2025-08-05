# 🛡️ Module de Gestion des Vulnérabilités Faraday

## 📋 Vue d'ensemble

Ce module fournit une interface web complète pour gérer les vulnérabilités dans Faraday Security Platform. Il implémente une relation **one-to-many** entre les workspaces et les vulnérabilités, respectant le modèle de données de Faraday où chaque vulnérabilité appartient à un workspace spécifique.

## ✨ Fonctionnalités

### 🔧 Opérations CRUD Complètes
- **Create** : Créer de nouvelles vulnérabilités
- **Read** : Afficher et filtrer les vulnérabilités
- **Update** : Modifier les vulnérabilités existantes  
- **Delete** : Supprimer les vulnérabilités

### 🎯 Relation Workspace-Vulnérabilités
- Sélection de workspace obligatoire avant gestion des vulnérabilités
- Filtrage automatique par workspace via `?workspace=nom_du_workspace`
- Affichage contextuel des informations du workspace sélectionné
- Isolation complète des données par workspace

### 🔍 Filtrage et Recherche Avancés
- **Recherche textuelle** : Nom, description, cible
- **Filtre par sévérité** : Critical, High, Medium, Low, Info
- **Filtre par statut** : Open, Closed, Re-opened, Risk-accepted
- **Comptage en temps réel** des résultats

### 📊 Interface Utilisateur
- **Cartes visuelles** colorées par sévérité
- **Grille responsive** s'adaptant à la taille d'écran
- **Mise en évidence** des termes de recherche
- **Badges et indicateurs** visuels clairs

## 🏗️ Architecture Technique

### Frontend
```
index-new.html
├── Section vulnérabilités intégrée
├── Modal de création/édition
├── Filtres et recherche avancée
└── Interface de gestion workspace-aware
```

### Backend/API
```
API Faraday v3
├── GET  /_api/v3/ws                     # Liste workspaces
├── GET  /_api/v3/ws/{workspace}/vulns   # Vulnérabilités du workspace
├── POST /_api/v3/ws/{workspace}/vulns   # Créer vulnérabilité
├── PUT  /_api/v3/ws/{workspace}/vulns/{id}  # Modifier vulnérabilité
└── DELETE /_api/v3/ws/{workspace}/vulns/{id} # Supprimer vulnérabilité
```

### Proxy CORS
```
cors-proxy-vulns.py
├── Gestion automatique des en-têtes CORS
├── Authentification Basic intégrée
├── Support complet HTTP methods
└── Logs détaillés pour debugging
```

## 🚀 Installation et Démarrage

### Prérequis
- Python 3.7+
- Serveur Faraday en fonctionnement (port 5985)
- Navigateur web moderne

### Démarrage Rapide
```bash
# 1. Lancer le script de démarrage automatique
start-vuln-module.bat

# OU étapes manuelles :

# 2. Démarrer le proxy CORS
python cors-proxy-vulns.py

# 3. Démarrer un serveur web (optionnel)
python -m http.server 8888

# 4. Ouvrir l'interface
# http://localhost:8888/index-new.html
```

### URLs d'accès
- **Interface principale** : `http://localhost:8888/index-new.html`
- **Interface de test** : `http://localhost:8888/test-vulnerabilities.html`
- **Proxy CORS** : `http://localhost:8082`

## 🧪 Tests

### Interface de Test Intégrée
Le fichier `test-vulnerabilities.html` fournit :
- Tests de connectivité API
- Tests CRUD complets
- Simulation de création de vulnérabilités
- Validation des filtres et recherches

### Tests Manuels
1. **Connexion** : Vérifier la connexion à l'API
2. **Workspaces** : Charger et sélectionner un workspace
3. **CRUD** : Créer, modifier, supprimer des vulnérabilités
4. **Filtres** : Tester tous les types de filtres
5. **Export** : Exporter en CSV

## 📝 Utilisation

### 1. Sélection du Workspace
```javascript
// Le workspace doit être sélectionné en premier
selectedWorkspace = "nom_du_workspace";
loadVulnerabilitiesForWorkspace();
```

### 2. Filtrage par Relation
```javascript
// Toutes les requêtes incluent automatiquement le workspace
const url = `${API_CONFIG.baseURL}/_api/v3/ws/${selectedWorkspace}/vulns`;
```

### 3. Gestion des Vulnérabilités
```javascript
// Exemple de structure de vulnérabilité
const vulnData = {
    name: "SQL Injection",
    severity: "high",
    description: "Vulnérabilité d'injection SQL",
    target: "192.168.1.100",
    service: "http/80",
    status: "open",
    type: "Vulnerability",
    cve: "CVE-2023-1234",
    cwe: "CWE-89"
};
```

## 🔧 Configuration

### Proxy CORS
```python
FARADAY_API_BASE = "http://localhost:5985"
PROXY_PORT = 8082
FARADAY_CREDENTIALS = base64.b64encode(b'faraday:faraday').decode('ascii')
```

### Frontend
```javascript
const API_CONFIG = {
    baseURL: 'http://localhost:8082',
    credentials: btoa('faraday:faraday')
};
```

## 📊 Modèle de Données

### Relation Workspace-Vulnérabilité
```
Workspace (1) -----> (*) Vulnérability
    │                       │
    ├─ name (PK)           ├─ id (PK)
    ├─ description         ├─ workspace_id (FK)
    ├─ active              ├─ name
    └─ customer            ├─ severity
                           ├─ status
                           ├─ target
                           ├─ service
                           └─ ...
```

### Types de Sévérité
- `critical` : Rouge foncé
- `high` : Orange foncé  
- `medium` : Orange
- `low` : Vert
- `info` : Bleu

### Statuts Disponibles
- `open` : Ouvert (défaut)
- `closed` : Fermé
- `re-opened` : Réouvert
- `risk-accepted` : Risque accepté

## 🛠️ Dépannage

### Problèmes Courants

**Erreur CORS**
```
Solution : Vérifier que cors-proxy-vulns.py est démarré
Port : 8082
```

**Serveur Faraday non accessible**
```
Solution : Démarrer Faraday avec faraday-server
Port : 5985
```

**Vulnérabilités non chargées**
```
Solution : 
1. Sélectionner un workspace valide
2. Vérifier les permissions utilisateur
3. Consulter les logs du proxy
```

### Logs de Debug
```bash
# Activer les logs détaillés dans cors-proxy-vulns.py
logging.basicConfig(level=logging.DEBUG)
```

## 📈 Performances

### Optimisations Implémentées
- **Filtrage côté client** pour une réactivité immédiate
- **Mise en cache** des workspaces chargés
- **Chargement paresseux** des vulnérabilités par workspace
- **Limitation automatique** de l'affichage des résultats

### Recommandations
- Utiliser les filtres pour limiter les résultats sur gros volumes
- Éviter de charger tous les workspaces simultanément
- Préférer la pagination pour >100 vulnérabilités

## 🔒 Sécurité

### Authentification
- Authentification Basic intégrée dans le proxy
- Credentials stockés en base64 (configurable)
- Session maintenue automatiquement

### Autorisations
- Respect des permissions Faraday par workspace
- Isolation complète des données entre workspaces
- Validation côté serveur pour toutes les opérations

## 🤝 Contribution

Pour contribuer au module :
1. Tester avec l'interface de test
2. Documenter les nouvelles fonctionnalités
3. Maintenir la compatibilité API Faraday v3
4. Préserver la relation workspace-vulnérabilité

## 📜 License

Ce module suit la même licence que Faraday Security Platform.
