@echo off
echo === Démarrage du proxy Faraday avec projets statiques ===
echo.

REM Tuer les anciens processus qui pourraient bloquer le port
netstat -ano | findstr :8082 >nul
if %errorlevel% == 0 (
    echo Arrêt des anciens processus sur le port 8082...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :8082') do taskkill /PID %%i /F >nul 2>&1
    timeout /t 2 >nul
)

echo Démarrage du proxy CORS...
start "Faraday CORS Proxy" /MIN python faraday-cors-proxy.py

echo Attente du démarrage...
timeout /t 3 >nul

echo Test de connectivité...
python test-proxy.py

echo.
echo === Proxy prêt ! ===
echo Ouvrez votre navigateur sur: file:///c:/Users/LENOVO/OneDrive/Bureau/faraday/faraday/custom-web-interface/index-new.html
echo.
pause
