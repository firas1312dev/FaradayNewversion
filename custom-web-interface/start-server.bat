@echo off
echo 🌐 Serveur HTTP Local pour Interface Faraday
echo =============================================
echo.

REM Vérifier si Python est disponible
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Python trouvé - Démarrage du serveur...
    echo 🔗 URL: http://localhost:8080
    echo 📁 Répertoire: %cd%
    echo.
    echo ⏹️ Appuyez sur Ctrl+C pour arrêter le serveur
    echo.
    start http://localhost:8080
    python -m http.server 8080
) else (
    echo ❌ Python non trouvé
    echo.
    echo 💡 Alternatives:
    echo    1. Installer Python depuis python.org
    echo    2. Utiliser Live Server de VS Code
    echo    3. Ouvrir directement index.html dans le navigateur
    echo.
    echo 🔗 Ouverture directe du fichier...
    start index.html
)

pause
