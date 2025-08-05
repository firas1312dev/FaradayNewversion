@echo off
echo 🚀 Démarrage rapide de Faraday...
echo.

echo 1️⃣ Démarrage du serveur Faraday (port 5985)...
cd /d "C:\Users\LENOVO\OneDrive\Bureau\faraday\faraday\faraday"
start "Faraday Server" cmd /k "python manage.py runserver --host 0.0.0.0 --port 5985"

echo 2️⃣ Attendre 5 secondes...
timeout /t 5 /nobreak >nul

echo 3️⃣ Test de connectivité...
netstat -an | findstr ":5985"
if %errorlevel% equ 0 (
    echo ✅ Serveur Faraday démarré avec succès !
) else (
    echo ⚠️ Le serveur Faraday démarre encore...
)

echo.
echo 4️⃣ Ouverture de l'interface...
start http://localhost:8888/index-new.html

echo.
echo ✅ Configuration actuelle :
echo 📊 Serveur Faraday : http://localhost:5985
echo 🔗 Proxy CORS : http://localhost:8082 (déjà actif)
echo 🌐 Interface Web : file:///C:/Users/LENOVO/OneDrive/Bureau/faraday/faraday/custom-web-interface/index-new.html

pause
