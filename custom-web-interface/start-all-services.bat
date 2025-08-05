@echo off
echo 🚀 Démarrage complet du projet Faraday...
echo.

cd /d "C:\Users\LENOVO\OneDrive\Bureau\faraday\faraday\custom-web-interface"

echo ⚠️ IMPORTANT: Vérifiez que le serveur Faraday est déjà démarré !
echo 📊 Port 5985 doit être occupé
echo.

netstat -an | findstr ":5985"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Serveur Faraday non démarré !
    echo 💡 Démarrez d'abord Faraday avec: python restart_faraday.py
    pause
    exit /b 1
)

echo ✅ Serveur Faraday détecté
echo.

echo 1️⃣ Démarrage du Proxy CORS (port 8082)...
start "Proxy CORS" cmd /k "python cors-proxy-enhanced.py"

timeout /t 3 /nobreak >nul

echo 2️⃣ Démarrage du serveur web (port 8888)...
start "Serveur Web" cmd /k "python -m http.server 8888"

timeout /t 3 /nobreak >nul

echo 3️⃣ Ouverture de l'interface dans le navigateur...
start http://localhost:8888/index-new.html

echo.
echo ✅ Services démarrés ! 
echo 📊 Interface : http://localhost:8888/index-new.html
echo 🔗 Proxy CORS : http://localhost:8082
echo 🔧 Faraday API : http://localhost:5985
echo.
echo 📋 ÉTAT DES SERVICES :
netstat -an | findstr ":5985" && echo ✅ Faraday Server OK || echo ❌ Faraday Server KO
netstat -an | findstr ":8082" && echo ✅ Proxy CORS OK || echo ❌ Proxy CORS KO
netstat -an | findstr ":8888" && echo ✅ Serveur Web OK || echo ❌ Serveur Web KO
echo.
pause
