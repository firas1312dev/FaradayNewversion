# 🧪 Guide de Tests - Interface Faraday Personnalisée

## Tests Automatisés

### 1. Page de Test (test.html)
- ✅ **Ouvert dans Simple Browser**
- Tests disponibles :
  - Test Connectivité API
  - Test Authentification  
  - Test Workspaces
  - Test Module Graphics
  - Test Module Planner

### 2. Interface Principale (index.html)
- ✅ **Ouvert dans Simple Browser** 
- Tests à effectuer :
  - Connexion avec faraday/faraday
  - Navigation entre les modules
  - Module Graphics
  - Module Planner

## Tests Manuels à Effectuer

### 🔐 Test d'Authentification
1. **Interface officielle** : http://localhost:5985
   - Username: `faraday`
   - Password: `faraday` 
   - ✅ **Devrait fonctionner**

2. **Interface personnalisée** : `index.html`
   - Même credentials
   - Tester la modal de connexion

### 📊 Test Module Graphics
1. **Accéder au module** : Cliquer sur "Graphics" dans la sidebar
2. **Types de graphiques** :
   - ✅ Vulnerability Severity Distribution
   - ✅ Host Distribution by OS  
   - ✅ Temporal Analysis
   - ✅ Risk Matrix
3. **Fonctionnalités** :
   - Sélection du type de graphique
   - Filtrage par workspace
   - Sélection de période (dates)
   - Export PNG

### 📅 Test Module Planner  
1. **Accéder au module** : Cliquer sur "Planner" dans la sidebar
2. **Calendrier** :
   - ✅ Navigation mois précédent/suivant
   - ✅ Affichage du mois courant
   - ✅ Indicateurs de tâches par jour
3. **Gestion des tâches** :
   - Création nouvelle tâche
   - Édition tâche existante
   - Suppression tâche
   - Marquer comme terminée
4. **Projets** :
   - Création nouveau projet
   - Filtrage par projet

### 🔗 Test Intégration API
1. **Endpoints testés** :
   - ✅ `/info` - Informations serveur
   - ✅ `/ws` - Liste workspaces
   - ✅ `/ws/{name}/hosts` - Hosts par workspace
   - ✅ `/ws/{name}/vulns` - Vulnérabilités par workspace

2. **Données temps réel** :
   - Dashboard stats
   - Graphiques avec vraies données
   - Synchronisation workspace

## Résultats Attendus

### ✅ Tests qui DEVRAIENT fonctionner :
- Connexion faraday/faraday
- API accessible sur http://localhost:5985
- Interface personnalisée chargée
- Modules Graphics et Planner affichés
- Navigation sidebar fonctionnelle

### ⚠️ Limitations actuelles :
- **Données de test** : Graphics et Planner utilisent des données simulées
- **CORS** : Possible limitation navigateur pour API cross-origin
- **WebSocket** : Non implémenté pour mises à jour temps réel

## Commandes de Debug

### PowerShell - Test API :
```powershell
$cred = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("faraday:faraday"))
$headers = @{"Authorization" = "Basic $cred"}
Invoke-RestMethod -Uri "http://localhost:5985/_api/v3/info" -Headers $headers
```

### Docker - Vérifier conteneurs :
```powershell
docker ps | Select-String "faraday"
docker logs faraday_app --tail 10
```

### Navigateur - Console F12 :
```javascript
// Test API directement dans la console
fetch('http://localhost:5985/_api/v3/info', {
  headers: {'Authorization': 'Basic ' + btoa('faraday:faraday')}
})
.then(r => r.json())
.then(console.log)
```

## 🎯 Prochaines Étapes

1. **Tester l'interface dans les navigateurs ouverts**
2. **Vérifier la connexion dans test.html**  
3. **Naviguer dans l'interface personnalisée**
4. **Tester Graphics et Planner modules**
5. **Rapporter tout problème rencontré**

---
**Status** : Interface prête pour les tests ! 🚀
