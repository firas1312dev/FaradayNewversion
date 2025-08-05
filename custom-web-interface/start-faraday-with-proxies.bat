@echo off
echo ====================================================
echo 🚀 DÉMARRAGE FARADAY AVEC PROXIES CORS
echo ====================================================

REM Créer des répertoires pour les logs
if not exist "logs" mkdir logs

echo.
echo 📍 Étape 1: Démarrage du serveur Faraday principal...
echo.

REM Démarrer Faraday en arrière-plan
start "Faraday Server" cmd /c "cd /d c:\Users\LENOVO\OneDrive\Bureau\faraday\faraday && python faraday\manage.py run-server --host 0.0.0.0 --port 5985 > logs\faraday-server.log 2>&1"

REM Attendre que Faraday démarre
echo ⏳ Attente du démarrage du serveur Faraday (30 secondes)...
timeout /t 30 /nobreak

echo.
echo 📍 Étape 2: Démarrage des proxies CORS...
echo.

REM Démarrer le proxy CORS principal sur le port 8082
start "CORS Proxy 8082" cmd /c "cd /d c:\Users\LENOVO\OneDrive\Bureau\faraday\faraday\custom-web-interface && python faraday-cors-proxy.py > logs\cors-proxy-8082.log 2>&1"

REM Attendre un peu
timeout /t 3 /nobreak

REM Démarrer le proxy CORS amélioré sur le port 8081
start "CORS Proxy Enhanced 8081" cmd /c "cd /d c:\Users\LENOVO\OneDrive\Bureau\faraday\faraday\custom-web-interface && python cors-proxy-enhanced.py > logs\cors-proxy-8081.log 2>&1"

REM Attendre un peu
timeout /t 3 /nobreak

REM Démarrer un proxy CORS simple sur le port 8080
start "CORS Proxy Simple 8080" cmd /c "cd /d c:\Users\LENOVO\OneDrive\Bureau\faraday\faraday\custom-web-interface && python simple-cors-proxy.py > logs\cors-proxy-8080.log 2>&1"

echo.
echo 📍 Étape 3: Attente de l'initialisation complète...
echo.
timeout /t 10 /nobreak

echo.
echo ✅ TOUS LES SERVICES SONT DÉMARRÉS !
echo.
echo 🌐 Services disponibles:
echo    - Serveur Faraday:           http://localhost:5985
echo    - Proxy CORS Principal:      http://localhost:8082
echo    - Proxy CORS Amélioré:       http://localhost:8081
echo    - Proxy CORS Simple:         http://localhost:8080
echo.
echo 📋 Interface Web:               file:///c:/Users/LENOVO/OneDrive/Bureau/faraday/faraday/custom-web-interface/index-new.html
echo.
echo ⚠️  Pour arrêter tous les services, fermez toutes les fenêtres de terminal.
echo.

REM Ouvrir l'interface web
echo 🚀 Ouverture de l'interface web...
start "" "file:///c:/Users/LENOVO/OneDrive/Bureau/faraday/faraday/custom-web-interface/index-new.html"

echo.
echo 🔍 Vérification de l'état des services...
echo.

REM Vérifier les services
timeout /t 5 /nobreak

REM Test de connexion au serveur principal
echo Testing Faraday Server...
curl -s http://localhost:5985/_api/v3/info > nul && echo ✅ Faraday Server OK || echo ❌ Faraday Server NOT OK

REM Test des proxies
echo Testing CORS Proxies...
curl -s http://localhost:8082/_api/v3/info > nul && echo ✅ Proxy 8082 OK || echo ❌ Proxy 8082 NOT OK
curl -s http://localhost:8081/_api/v3/info > nul && echo ✅ Proxy 8081 OK || echo ❌ Proxy 8081 NOT OK
curl -s http://localhost:8080/_api/v3/info > nul && echo ✅ Proxy 8080 OK || echo ❌ Proxy 8080 NOT OK

echo.
echo 🎉 Setup terminé ! L'interface devrait maintenant se connecter automatiquement.
echo.

pause
