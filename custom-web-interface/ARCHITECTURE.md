# 🏗️ Architecture Faraday - Proxy - Interface Web

## 📋 Vue d'ensemble du système

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Interface Web │    │   Proxy CORS    │    │ Serveur Faraday │
│    (Frontend)   │◄──►│  (Middleware)   │◄──►│   (Backend)     │
│   Port: 8888    │    │   Port: 8082    │    │   Port: 5985    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 Flow de communication

### 1. **Serveur Faraday** (Port 5985)
- **Rôle** : Backend principal de sécurité
- **Technologie** : Python Flask/Django
- **Données** : Base de données PostgreSQL/SQLite
- **API** : REST API v3 (`/_api/v3/`)
- **Authentification** : Basic Auth (faraday:faraday)

**Endpoints principaux :**
```
GET  /_api/v3/info           # Informations serveur
GET  /_api/v3/ws             # Liste des workspaces
POST /_api/v3/ws             # Créer workspace
GET  /_api/v3/ws/{name}      # Détails workspace
PUT  /_api/v3/ws/{name}      # Modifier workspace
DEL  /_api/v3/ws/{name}      # Supprimer workspace
GET  /_api/v3/ws/{name}/hosts # Hosts du workspace
GET  /_api/v3/ws/{name}/vulns # Vulnérabilités
```

### 2. **Proxy CORS** (Port 8082)
- **Rôle** : Middleware pour résoudre les problèmes CORS
- **Technologie** : Python avec bibliothèque `requests`
- **Fonction** : Proxy transparent avec headers CORS

**Pourquoi nécessaire ?**
- Le serveur Faraday n'autorise pas les requêtes cross-origin
- L'interface web (localhost:8888) ne peut pas accéder directement à Faraday (localhost:5985)
- Le proxy ajoute les headers CORS nécessaires

**Headers ajoutés :**
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Credentials: true
```

### 3. **Interface Web** (Port 8888)
- **Rôle** : Frontend moderne pour Faraday
- **Technologie** : HTML5, CSS3, JavaScript vanilla
- **Fonctionnalités** : CRUD workspaces, dashboard, navigation

## 📡 Détail des communications

### A. Démarrage du système

1. **Lancer Faraday Server**
```bash
cd faraday
python manage.py runserver
# Écoute sur http://localhost:5985
```

2. **Lancer le Proxy CORS**
```bash
cd custom-web-interface
python cors-proxy-enhanced.py
# Écoute sur http://localhost:8082
# Redirige vers http://localhost:5985
```

3. **Ouvrir l'Interface Web**
```bash
# Serveur web local (Python)
python -m http.server 8888
# Ou directement dans le navigateur
start index-new.html
```

### B. Flux de requête typique

**Exemple : Charger la liste des workspaces**

1. **Interface Web → Proxy**
```javascript
fetch('http://localhost:8082/_api/v3/ws', {
    method: 'GET',
    headers: {
        'Authorization': 'Basic ZmFyYWRheTpmYXJhZGF5',
        'Content-Type': 'application/json'
    }
})
```

2. **Proxy → Serveur Faraday**
```python
# cors-proxy-enhanced.py
target_url = 'http://localhost:5985/_api/v3/ws'
response = requests.get(target_url, headers=headers, auth=auth)
```

3. **Serveur Faraday → Proxy**
```json
{
    "rows": [
        {
            "id": 1,
            "name": "workspace1",
            "active": true,
            "customer": "Client A",
            "stats": {
                "hosts": 15,
                "services": 45,
                "total_vulns": 23
            }
        }
    ]
}
```

4. **Proxy → Interface Web**
```python
# Ajoute les headers CORS
response.headers['Access-Control-Allow-Origin'] = '*'
return response.content, response.status_code, response.headers
```

5. **Interface Web traite la réponse**
```javascript
.then(response => response.json())
.then(data => {
    workspacesData = data.rows;
    displayWorkspaces(workspacesData);
    updateStats(workspacesData);
})
```

## 🔐 Sécurité et Authentification

### Configuration actuelle
```javascript
const API_CONFIG = {
    baseURL: 'http://localhost:8082',
    credentials: btoa('faraday:faraday')  // Base64: ZmFyYWRheTpmYXJhZGF5
};
```

### Headers d'authentification
```http
Authorization: Basic ZmFyYWRheTpmYXJhZGF5
Content-Type: application/json
```

## 🛠️ Fichiers clés

### 1. Interface Web
```
index-new.html          # Interface principale moderne
index.html              # Interface basique
index-complete.html     # Interface complète avec toutes fonctionnalités
```

### 2. Proxy CORS
```
cors-proxy-enhanced.py  # Proxy avec gestion d'erreurs améliorée
cors-proxy.py          # Version basique du proxy
```

### 3. Configuration Faraday
```
faraday/manage.py      # Point d'entrée principal
faraday/server/        # Code serveur Flask
faraday/settings/      # Configuration
```

## 🔍 Debugging et Monitoring

### Logs du Proxy
```python
print(f"🔄 {method} {path}")
print(f"📊 Status: {response.status_code}")
print(f"📦 Size: {len(response.content)} bytes")
```

### Interface Web Console
```javascript
console.log('🚀 Interface Faraday chargée');
console.log('✅ Connexion établie');
console.log('📊 Workspaces chargés:', workspacesData.length);
```

### Indicators de statut
- 🟢 **Connecté** : Tous les services fonctionnent
- 🟡 **Connexion** : En cours de connexion
- 🔴 **Déconnecté** : Erreur de communication

## 🚨 Problèmes courants

### 1. CORS Error
**Symptôme** : `Access to fetch blocked by CORS policy`
**Solution** : Vérifier que le proxy CORS est démarré

### 2. Proxy non accessible
**Symptôme** : `Failed to fetch`
**Solution** : 
```bash
python cors-proxy-enhanced.py
# Vérifier port 8082 libre
```

### 3. Serveur Faraday arrêté
**Symptôme** : `Connection refused`
**Solution** :
```bash
cd faraday
python manage.py runserver
```

### 4. Authentification échouée
**Symptôme** : `401 Unauthorized`
**Solution** : Vérifier credentials dans `API_CONFIG`

## 🎯 Avantages de cette architecture

### ✅ **Séparation des responsabilités**
- Faraday : Logique métier et données
- Proxy : Gestion CORS et communication
- Interface : Expérience utilisateur moderne

### ✅ **Développement indépendant**
- Frontend peut évoluer sans impacter Faraday
- Proxy peut être amélioré (cache, rate limiting, etc.)

### ✅ **Sécurité**
- Authentification centralisée
- Pas de modification du serveur Faraday

### ✅ **Performance**
- Requêtes directes via proxy
- Pas de reload de page (SPA)
- Chargement asynchrone

## 🚀 Extensions possibles

### Cache intelligente
```python
# Dans le proxy
@lru_cache(maxsize=128)
def get_workspaces():
    return requests.get(f'{FARADAY_URL}/_api/v3/ws')
```

### WebSocket pour temps réel
```python
# Notifications en temps réel
import websocket
```

### Authentification OAuth
```python
# Remplacement Basic Auth
from authlib.integrations.flask_client import OAuth
```

---

Cette architecture modulaire permet une interface moderne tout en préservant l'intégrité du serveur Faraday existant ! 🔥
