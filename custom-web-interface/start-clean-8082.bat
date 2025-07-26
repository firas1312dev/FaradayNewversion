@echo off
REM Script de démarrage pour Faraday Interface avec port 8082 uniquement

echo 🚀 Démarrage de l'interface Faraday avec port 8082
echo ==================================================

REM Arrêter tous les processus Python/Node qui pourraient utiliser les ports
echo 🛑 Arrêt des serveurs existants...
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 >nul

echo.
echo 🌐 Vérification de Faraday server...
curl -s "http://localhost:5985/_api/v3/info" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Faraday server actif sur port 5985
) else (
    echo ❌ Faraday server non accessible sur port 5985
    echo    Assurez-vous que Faraday est démarré
    pause
    exit /b 1
)

echo.
echo 🚀 Démarrage du proxy CORS sur port 8082...
cd /d "%~dp0"
start "Proxy CORS" python cors-proxy-enhanced.py
timeout /t 3 >nul

echo.
echo 🌐 Vérification du proxy CORS...
curl -s "http://localhost:8082/_api/v3/info" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Proxy CORS actif sur port 8082
) else (
    echo ❌ Proxy CORS non accessible sur port 8082
    echo    Vérifiez les logs du proxy
    pause
    exit /b 1
)

echo.
echo 🚀 Démarrage du serveur web sur port 8888...
start "Serveur Web" python -m http.server 8888
timeout /t 2 >nul

echo.
echo ✅ Tous les serveurs sont démarrés !
echo ==================================
echo 🌐 Interface Web:    http://localhost:8888
echo 🔗 Proxy CORS:      http://localhost:8082
echo ⚙️  API Faraday:     http://localhost:5985
echo.
echo 💡 Test direct: http://localhost:8888/test-port-8082.html
echo.
echo 🌐 Ouverture de l'interface web...
start http://localhost:8888/test-port-8082.html

echo.
echo 🛑 Pour arrêter tous les serveurs, fermez cette fenêtre ou appuyez sur Ctrl+C
pause
