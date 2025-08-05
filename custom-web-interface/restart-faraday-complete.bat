@echo off
echo =======================================================
echo 🔧 DIAGNOSTIC ET REDEMARRAGE FARADAY SERVER
echo =======================================================
echo.

echo 📍 Étape 1: Vérification des processus...
tasklist | findstr python
echo.

echo 📍 Étape 2: Vérification des ports...
netstat -ano | findstr ":5985"
netstat -ano | findstr ":8082"
echo.

echo 📍 Étape 3: Arrêt des processus Faraday/Python si nécessaire...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq python.exe" ^| findstr python') do (
    echo Arrêt du processus Python PID %%i
    taskkill /PID %%i /F 2>nul
)
echo.

echo 📍 Étape 4: Nettoyage des ports...
timeout /t 3 /nobreak >nul
echo.

echo 📍 Étape 5: Navigation vers le dossier Faraday...
cd /d "C:\Users\LENOVO\OneDrive\Bureau\faraday\faraday"
if %errorlevel% neq 0 (
    echo ❌ Erreur: Impossible de naviguer vers le dossier Faraday
    pause
    exit /b 1
)
echo ✅ Dossier Faraday trouvé
echo.

echo 📍 Étape 6: Initialisation de la base de données...
python manage.py initdb
if %errorlevel% neq 0 (
    echo ⚠️ Avertissement: Problème avec initdb, continuons...
)
echo.

echo 📍 Étape 7: Démarrage du serveur Faraday...
echo 🚀 Lancement de Faraday Server sur le port 5985...
start "Faraday Server" cmd /k "python manage.py runserver --host 0.0.0.0 --port 5985 --debug"

echo.
echo 📍 Étape 8: Attente du démarrage...
timeout /t 10 /nobreak >nul

echo.
echo 📍 Étape 9: Test de connectivité...
powershell -Command "Test-NetConnection -ComputerName localhost -Port 5985 -InformationLevel Quiet"
if %errorlevel% eq 0 (
    echo ✅ Serveur Faraday démarré avec succès !
) else (
    echo ❌ Problème de démarrage du serveur
)

echo.
echo 📍 Étape 10: Démarrage du proxy CORS...
cd /d "C:\Users\LENOVO\OneDrive\Bureau\faraday\faraday\custom-web-interface"
start "Proxy CORS" cmd /k "python cors-proxy-enhanced.py"

echo.
echo 📍 Étape 11: Démarrage du serveur web...
start "Serveur Web" cmd /k "python -m http.server 8888"

echo.
echo 📍 Étape 12: Ouverture de l'interface...
timeout /t 5 /nobreak >nul
start http://localhost:8888/index-new.html

echo.
echo =======================================================
echo ✅ DÉMARRAGE COMPLET TERMINÉ !
echo 📊 Interface: http://localhost:8888/index-new.html
echo 🔗 Proxy CORS: http://localhost:8082
echo 🔧 Faraday API: http://localhost:5985
echo =======================================================
echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause >nul
