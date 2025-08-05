@echo off
echo ==========================================
echo      DEMARRAGE MODULE VULNERABILITES
echo ==========================================
echo.

:: Configuration
set PYTHON_SCRIPT=cors-proxy-vulns.py
set PORT=8082
set FARADAY_PORT=5985

echo [1/4] Verification des prerequis...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python n'est pas installe ou accessible
    pause
    exit /b 1
)
echo ✅ Python detecte

echo.
echo [2/4] Verification du serveur Faraday...
netstat -an | findstr :%FARADAY_PORT% >nul
if errorlevel 1 (
    echo ⚠️  Serveur Faraday non detecte sur le port %FARADAY_PORT%
    echo.
    echo Options:
    echo 1. Demarrer Faraday manuellement: faraday-server
    echo 2. Utiliser le mode simulation (donnees de test)
    echo.
    choice /c 12 /n /m "Choisir une option (1 ou 2): "
    if errorlevel 2 goto simulation
    if errorlevel 1 goto wait_faraday
) else (
    echo ✅ Serveur Faraday detecte sur le port %FARADAY_PORT%
)

goto start_proxy

:wait_faraday
echo.
echo Veuillez demarrer le serveur Faraday dans un autre terminal:
echo   faraday-server
echo.
echo Appuyez sur une touche quand le serveur est demarre...
pause >nul
goto start_proxy

:simulation
echo.
echo 🧪 Mode simulation active - utilisation de donnees de test
echo.

:start_proxy
echo.
echo [3/4] Demarrage du proxy CORS...
if not exist "%PYTHON_SCRIPT%" (
    echo ❌ Script %PYTHON_SCRIPT% introuvable
    pause
    exit /b 1
)

echo 🚀 Demarrage du proxy sur le port %PORT%...
start "Proxy CORS Vulnerabilites" python "%PYTHON_SCRIPT%"

:: Attendre que le proxy soit pret
timeout /t 3 /nobreak >nul

echo.
echo [4/4] Verification du proxy...
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:%PORT%/_api/v3/info' -UseBasicParsing -TimeoutSec 5 | Out-Null; Write-Host '✅ Proxy CORS operationnel' } catch { Write-Host '❌ Proxy CORS non accessible' }"

echo.
echo ==========================================
echo           SERVICES DEMARRES
echo ==========================================
echo.
echo 🌐 Interface principale:
echo   http://localhost:8888/index-new.html
echo.
echo 🧪 Interface de test:
echo   http://localhost:8888/test-vulnerabilities.html
echo.
echo 🔧 Proxy CORS:
echo   http://localhost:%PORT%
echo.
echo 🎯 API Faraday:
echo   http://localhost:%FARADAY_PORT%
echo.
echo ==========================================
echo.

:: Demarrer un serveur web simple si disponible
python -c "import http.server" 2>nul
if not errorlevel 1 (
    echo 🚀 Demarrage du serveur web local...
    start "Serveur Web" python -m http.server 8888
    timeout /t 2 /nobreak >nul
    echo.
    echo 🌐 Ouverture de l'interface...
    start http://localhost:8888/index-new.html
) else (
    echo ⚠️  Serveur web Python non disponible
    echo    Ouvrez manuellement les fichiers HTML dans votre navigateur
)

echo.
echo 📋 Pour arreter les services:
echo    - Fermez les fenetres des serveurs
echo    - Ou appuyez sur Ctrl+C dans chaque terminal
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause >nul
