# 🚀 Guide de Connexion Faraday avec Proxies CORS

## 📋 Résumé
Ce système permet de connecter l'interface web à un vrai serveur Faraday via des proxies CORS, avec fallback automatique en mode hors ligne si aucune connexion n'est disponible.

## 🔧 Architecture de Connexion

L'interface teste automatiquement ces connexions dans l'ordre :

1. **🎯 Serveur Faraday Direct** : `http://localhost:5985`
2. **🔄 Proxy CORS Principal** : `http://localhost:8082` 
3. **🔄 Proxy CORS Amélioré** : `http://localhost:8081`
4. **🔄 Proxy CORS Simple** : `http://localhost:8080`
5. **⚠️ Mode Hors Ligne** : Si aucune connexion ne fonctionne

## 🚀 Démarrage Rapide

### Option 1: Script Automatique (Recommandé)
```cmd
cd c:\Users\LENOVO\OneDrive\Bureau\faraday\faraday\custom-web-interface
start-faraday-with-proxies.bat
```

Ce script :
- ✅ Lance le serveur Faraday
- ✅ Démarre tous les proxies CORS 
- ✅ Ouvre l'interface web automatiquement
- ✅ Vérifie les connexions

### Option 2: Démarrage Manuel

#### 1. Démarrer Faraday
```cmd
cd c:\Users\LENOVO\OneDrive\Bureau\faraday\faraday
python faraday\manage.py run-server --host 0.0.0.0 --port 5985
```

#### 2. Démarrer les Proxies CORS (dans des terminaux séparés)
```cmd
# Proxy principal (port 8082)
cd c:\Users\LENOVO\OneDrive\Bureau\faraday\faraday\custom-web-interface
python faraday-cors-proxy.py

# Proxy amélioré (port 8081) 
python cors-proxy-enhanced.py

# Proxy simple (port 8080)
python simple-cors-proxy.py
```

#### 3. Ouvrir l'Interface
Naviguer vers : `file:///c:/Users/LENOVO/OneDrive/Bureau/faraday/faraday/custom-web-interface/index-new.html`

## 🔍 Indicateurs de Connexion

### Status dans l'Interface
- 🟢 **Vert** : Connecté au serveur
- 🟡 **Jaune** : Connexion en cours  
- 🔴 **Rouge** : Mode hors ligne

### Messages de Connexion
- ✅ `"Connecté à http://localhost:XXXX"` : Connexion active
- ⚠️ `"Mode hors ligne"` : Aucune connexion disponible

## 🔄 Reconnexion

Si la connexion échoue :
1. **Bouton Reconnecter** : Cliquez sur le bouton "🔄 Reconnecter" dans l'interface
2. **Actualisation** : Rechargez la page (F5)
3. **Redémarrage** : Relancez les services avec le script

## 🛠️ Dépannage

### Problème: Interface reste en "Connexion..."
**Solutions :**
1. Vérifiez que Faraday tourne : `curl http://localhost:5985/_api/v3/info`
2. Vérifiez les proxies : `curl http://localhost:8082/_api/v3/info`
3. Regardez les logs dans le dossier `logs/`

### Problème: "Mode hors ligne" immédiat
**Solutions :**
1. Démarrez d'abord Faraday, puis les proxies
2. Attendez 30 secondes après le démarrage de Faraday
3. Utilisez le bouton "Reconnecter"

### Problème: Erreurs CORS
**Solutions :**
1. Les proxies CORS sont conçus pour résoudre cela
2. Vérifiez que les proxies tournent sur les bons ports
3. Testez avec différents navigateurs

## 📁 Structure des Fichiers

```
custom-web-interface/
├── index-new.html                    # Interface principale
├── start-faraday-with-proxies.bat    # Script de démarrage automatique
├── faraday-cors-proxy.py             # Proxy CORS principal (8082)
├── cors-proxy-enhanced.py            # Proxy CORS amélioré (8081)  
├── simple-cors-proxy.py              # Proxy CORS simple (8080)
└── logs/                             # Logs des services
    ├── faraday-server.log
    ├── cors-proxy-8082.log
    ├── cors-proxy-8081.log
    └── cors-proxy-8080.log
```

## 🎯 Fonctionnalités Disponibles

### Avec Connexion Serveur
- ✅ Workspaces réels de Faraday
- ✅ Vulnérabilités du serveur
- ✅ Création/modification de données
- ✅ Synchronisation temps réel

### Mode Hors Ligne
- ✅ Analyse CSV de vulnérabilités
- ✅ Graphiques et statistiques
- ✅ Interface complète de navigation
- ✅ Workspaces de démonstration

## ⚡ Performance et Optimisation

- **Connexion automatique** : L'interface choisit la connexion la plus rapide
- **Fallback intelligent** : Passe automatiquement au proxy suivant si échec
- **Cache local** : Données conservées localement pour la résilience
- **Reconnexion automatique** : Tente de se reconnecter périodiquement

## 🔒 Sécurité

- **Authentification** : Utilise les identifiants Faraday standard
- **CORS sécurisé** : Proxies configurés pour Faraday uniquement  
- **Local uniquement** : Tous les services restent sur localhost

## 💡 Conseils d'Utilisation

1. **Démarrage** : Utilisez toujours le script automatique pour éviter les problèmes
2. **Ordre de démarrage** : Faraday d'abord, puis les proxies
3. **Patience** : Attendez 30 secondes après le démarrage avant de tester
4. **Logs** : Consultez les logs si problème persistant
5. **Ports** : Évitez d'utiliser les ports 5985, 8080, 8081, 8082 pour d'autres services

## 🎉 Avantages de cette Solution

- **Robustesse** : Multiple points de connexion
- **Résilience** : Mode hors ligne en cas d'échec  
- **Simplicité** : Démarrage en un clic
- **Flexibilité** : Fonctionne avec ou sans serveur
- **Performance** : Connexion optimisée automatiquement
