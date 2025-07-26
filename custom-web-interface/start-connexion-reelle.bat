@echo off
echo 🚀 Démarrage de l'interface Faraday avec connexion réelle
echo =========================================================

echo.
echo 🔧 Vérification des services...

:: Vérifier si Docker fonctionne
docker ps >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker n'est pas démarré. Veuillez démarrer Docker Desktop.
    pause
    exit /b 1
)

:: Vérifier si Faraday fonctionne
echo 🔍 Vérification de Faraday...
docker ps | findstr faraday_app >nul
if errorlevel 1 (
    echo ❌ Le conteneur Faraday n'est pas en cours d'exécution.
    echo 💡 Démarrage de Faraday...
    docker-compose up -d
    echo ⏳ Attente du démarrage de Faraday (30 secondes)...
    timeout /t 30 /nobreak >nul
)

:: Arrêter les anciens processus Python
echo 🛑 Arrêt des anciens processus...
taskkill /f /im python.exe >nul 2>&1

:: Attendre un peu
timeout /t 2 /nobreak >nul

echo.
echo 🚀 Démarrage des services...

:: Démarrer le proxy CORS
echo 📡 Démarrage du proxy CORS (port 8081)...
start /min "Proxy CORS" python cors-proxy-enhanced.py

:: Attendre que le proxy démarre
timeout /t 3 /nobreak >nul

:: Démarrer le serveur HTTP
echo 🌐 Démarrage du serveur HTTP (port 8888)...
start /min "Serveur HTTP" python -m http.server 8888

:: Attendre que le serveur démarre
timeout /t 3 /nobreak >nul

echo.
echo ✅ Services démarrés avec succès !
echo.
echo 📋 INFORMATIONS:
echo    🌐 Interface web: http://localhost:8888
echo    📡 Proxy CORS:   http://localhost:8081
echo    🔧 Faraday API:  http://localhost:5985
echo.
echo 🔍 Pages de test disponibles:
echo    • Interface complète:     http://localhost:8888
echo    • Test de connexion:      http://localhost:8888/test-connexion-reelle.html
echo    • Diagnostic complet:     http://localhost:8888/diagnostic-connexion.html
echo.

:: Ouvrir automatiquement le navigateur
echo 🌐 Ouverture du navigateur...
start http://localhost:8888/test-connexion-reelle.html

echo.
echo ✅ L'interface Faraday avec connexion réelle est maintenant accessible !
echo 💡 Utilisez Ctrl+C dans cette fenêtre pour arrêter tous les services.
echo.

:: Attendre que l'utilisateur ferme la fenêtre
:wait_loop
timeout /t 5 /nobreak >nul
goto wait_loop
