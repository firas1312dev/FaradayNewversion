@echo off
title Démarrage Complet Projet Faraday
echo.
echo 🚀 DÉMARRAGE COMPLET DU PROJET FARADAY
echo =====================================
echo.

cd /d "%~dp0"

echo 📂 Dossier actuel: %CD%
echo.

REM Vérifier Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python non trouvé dans le PATH
    echo 💡 Installez Python ou ajoutez-le au PATH
    pause
    exit /b 1
)

echo ✅ Python trouvé
echo.

REM Étape 1: Essayer de démarrer ou créer un serveur Faraday
echo 🔹 Étape 1: Serveur Faraday
echo --------------------------

REM Vérifier si le port 5985 est libre
netstat -an | find ":5985" >nul
if %errorlevel% equ 0 (
    echo ✅ Un serveur est déjà actif sur le port 5985
    goto start_proxy
)

REM Essayer de démarrer le serveur de test
echo 🧪 Création et démarrage du serveur de test Faraday...
start "Faraday Test Server" cmd /k "python faraday_test_server.py"

REM Attendre 5 secondes
timeout /t 5 /nobreak >nul

REM Vérifier si le serveur de test fonctionne
netstat -an | find ":5985" >nul
if %errorlevel% equ 0 (
    echo ✅ Serveur de test démarré
) else (
    echo ⚠️ Serveur de test non démarré, continuons...
)

:start_proxy
REM Étape 2: Démarrer le proxy CORS
echo.
echo 🔹 Étape 2: Proxy CORS
echo ----------------------

REM Vérifier si le port 8082 est libre
netstat -an | find ":8082" >nul
if %errorlevel% equ 0 (
    echo ⚠️ Port 8082 déjà utilisé - arrêt du processus existant
    for /f "tokens=5" %%a in ('netstat -ano ^| find ":8082"') do taskkill /pid %%a /f >nul 2>&1
    timeout /t 2 /nobreak >nul
)

echo 🚀 Démarrage du proxy CORS...
start "Proxy CORS" cmd /k "python cors-proxy-enhanced.py"

REM Attendre 3 secondes
timeout /t 3 /nobreak >nul

:start_web
REM Étape 3: Démarrer le serveur web
echo.
echo 🔹 Étape 3: Serveur Web
echo -----------------------

REM Vérifier si le port 8888 est libre
netstat -an | find ":8888" >nul
if %errorlevel% equ 0 (
    echo ⚠️ Port 8888 déjà utilisé - arrêt du processus existant
    for /f "tokens=5" %%a in ('netstat -ano ^| find ":8888"') do taskkill /pid %%a /f >nul 2>&1
    timeout /t 2 /nobreak >nul
)

echo 🌐 Démarrage du serveur web...
start "Serveur Web" cmd /k "python -m http.server 8888"

REM Attendre 3 secondes
timeout /t 3 /nobreak >nul

:open_interface
REM Étape 4: Ouvrir l'interface
echo.
echo 🔹 Étape 4: Interface Web
echo -------------------------

echo 🌍 Ouverture de l'interface dans le navigateur...
start http://localhost:8888/index-new.html

:status_check
REM Étape 5: Vérification du statut
echo.
echo 🔹 Étape 5: Vérification des Services
echo ------------------------------------

echo.
echo 📊 STATUT DES SERVICES:
echo.

REM Vérifier Faraday (port 5985)
netstat -an | find ":5985" >nul
if %errorlevel% equ 0 (
    echo ✅ Faraday Server    ^(port 5985^): ACTIF
) else (
    echo ❌ Faraday Server    ^(port 5985^): INACTIF
)

REM Vérifier Proxy CORS (port 8082)
netstat -an | find ":8082" >nul
if %errorlevel% equ 0 (
    echo ✅ Proxy CORS        ^(port 8082^): ACTIF
) else (
    echo ❌ Proxy CORS        ^(port 8082^): INACTIF
)

REM Vérifier Serveur Web (port 8888)
netstat -an | find ":8888" >nul
if %errorlevel% equ 0 (
    echo ✅ Serveur Web       ^(port 8888^): ACTIF
) else (
    echo ❌ Serveur Web       ^(port 8888^): INACTIF
)

echo.
echo 🔗 URLS IMPORTANTES:
echo.
echo 📊 Interface Web:     http://localhost:8888/index-new.html
echo 🔗 Proxy CORS:       http://localhost:8082
echo 🔧 Faraday API:      http://localhost:5985
echo 🧪 Test API:         http://localhost:8888/test-port-8082.html
echo.

:final_message
echo 🎉 DÉMARRAGE TERMINÉ!
echo.
echo 💡 Si vous voyez des erreurs:
echo    1. Vérifiez que les 3 fenêtres de console sont ouvertes
echo    2. Attendez quelques secondes pour le démarrage complet
echo    3. Actualisez la page web si nécessaire
echo.
echo 🛑 Pour arrêter tous les services:
echo    - Fermez toutes les fenêtres de console ouvertes
echo    - Ou utilisez Ctrl+C dans chaque fenêtre
echo.

pause
