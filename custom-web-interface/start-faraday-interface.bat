@echo off
echo ============================================
echo    DEMARRAGE INTERFACE FARADAY COMPLETE
echo ============================================
echo.

REM Vérifier que Python est disponible
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python n'est pas installé ou non trouvé dans PATH
    pause
    exit /b 1
)

echo 📋 Vérification des composants...

REM Vérifier que Docker fonctionne
docker ps >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker n'est pas démarré ou non accessible
    echo Démarrez Docker Desktop et relancez ce script
    pause
    exit /b 1
)

REM Vérifier que Faraday fonctionne
echo 🔍 Vérification du serveur Faraday...
docker ps | findstr faraday_app >nul
if errorlevel 1 (
    echo ❌ Le conteneur Faraday n'est pas démarré
    echo Démarrez Faraday avec: docker-compose up -d
    pause
    exit /b 1
)

echo ✅ Faraday est démarré
echo.

echo 🚀 Démarrage des services...
echo.

REM Démarrer le serveur proxy CORS en arrière-plan
echo 📡 Démarrage du serveur proxy CORS (port 8081)...
start "Proxy CORS Faraday" cmd /k "cd /d %~dp0 && python cors-proxy-server.py"

REM Attendre 2 secondes
timeout /t 2 /nobreak >nul

REM Démarrer le serveur web pour l'interface
echo 🌐 Démarrage du serveur web (port 8888)...
start "Interface Web Faraday" cmd /k "cd /d %~dp0 && python -m http.server 8888"

REM Attendre 3 secondes
timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo           SERVICES DÉMARRÉS
echo ============================================
echo.
echo 📡 Proxy CORS:     http://localhost:8081
echo 🌐 Interface Web:  http://localhost:8888
echo 🔧 API Faraday:    http://localhost:5985
echo.
echo ============================================
echo          INSTRUCTIONS D'UTILISATION
echo ============================================
echo.
echo 1. Ouvrez votre navigateur
echo 2. Allez sur: http://localhost:8888
echo 3. Connectez-vous avec:
echo    Nom d'utilisateur: faraday
echo    Mot de passe: faraday
echo.
echo 🎯 L'interface se connectera automatiquement
echo    aux VRAIES données Faraday via le proxy!
echo.
echo ⚠️  Pour arrêter: Fermez les fenêtres CMD ouvertes
echo.

REM Ouvrir automatiquement le navigateur
echo 🚀 Ouverture automatique du navigateur...
start http://localhost:8888

echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause >nul
