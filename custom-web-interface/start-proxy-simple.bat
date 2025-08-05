@echo off
echo ========================================================
echo 🚀 DÉMARRAGE PROXY CORS - Configuration Simple
echo ========================================================

REM Créer le répertoire logs s'il n'existe pas
if not exist "logs" mkdir logs

echo.
echo 📍 Configuration utilisée (même que interface-faraday-final.html):
echo    - Proxy CORS: http://localhost:8082
echo    - Serveur Faraday: http://localhost:5985  
echo    - Interface: index-new.html
echo.

echo 📍 Démarrage du proxy CORS sur le port 8082...
echo.

REM Démarrer le proxy CORS principal sur le port 8082
start "CORS Proxy 8082" cmd /c "cd /d c:\Users\LENOVO\OneDrive\Bureau\faraday\faraday\custom-web-interface && python faraday-cors-proxy.py > logs\cors-proxy-8082.log 2>&1"

REM Attendre que le proxy démarre
echo ⏳ Attente du démarrage du proxy (10 secondes)...
timeout /t 10 /nobreak

echo.
echo ✅ PROXY CORS DÉMARRÉ !
echo.
echo 🌐 Services disponibles:
echo    - Proxy CORS:          http://localhost:8082
echo    - Interface Web:       file:///c:/Users/LENOVO/OneDrive/Bureau/faraday/faraday/custom-web-interface/index-new.html
echo.

REM Ouvrir l'interface web
echo 🚀 Ouverture de l'interface web...
start "" "file:///c:/Users/LENOVO/OneDrive/Bureau/faraday/faraday/custom-web-interface/index-new.html"

echo.
echo 🔍 Vérification de l'état du proxy...
echo.

REM Attendre un peu puis tester
timeout /t 5 /nobreak

REM Test de connexion au proxy
echo Testing Proxy CORS...
curl -s http://localhost:8082/_api/v3/info > nul && echo ✅ Proxy 8082 OK || echo ❌ Proxy 8082 NOT OK

echo.
echo 🎉 Configuration terminée ! 
echo.
echo 💡 Interface configurée pour utiliser:
echo    - http://localhost:8082 (même config que interface-faraday-final.html)
echo.
echo ⚠️  Pour arrêter le proxy, fermez la fenêtre de terminal "CORS Proxy 8082".
echo.

pause
