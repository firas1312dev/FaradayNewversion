# Script de démarrage du proxy Faraday avec projets statiques
Write-Host "=== Démarrage du proxy Faraday avec projets statiques ===" -ForegroundColor Green
Write-Host ""

# Vérifier si Python est installé
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python détecté: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    Write-Host "Installez Python depuis https://python.org" -ForegroundColor Yellow
    pause
    exit
}

# Vérifier si le port 8082 est libre
$portCheck = netstat -ano | Select-String ":8082"
if ($portCheck) {
    Write-Host "⚠️ Le port 8082 est déjà utilisé. Tentative d'arrêt..." -ForegroundColor Yellow
    $processes = $portCheck | ForEach-Object { ($_ -split '\s+')[-1] }
    foreach ($pid in $processes) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "🛑 Processus $pid arrêté" -ForegroundColor Yellow
        } catch {}
    }
    Start-Sleep -Seconds 2
}

Write-Host "🚀 Démarrage du proxy CORS..." -ForegroundColor Cyan

# Démarrer le proxy en arrière-plan
$job = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    python faraday-cors-proxy.py
}

Write-Host "⏳ Attente du démarrage (3 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Tester la connectivité
Write-Host "🔍 Test de connectivité..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8082/health" -TimeoutSec 5
    Write-Host "✅ Proxy opérationnel:" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor White
    Write-Host "   Message: $($response.message)" -ForegroundColor White
    Write-Host "   Version: $($response.proxy_version)" -ForegroundColor White
} catch {
    Write-Host "❌ Erreur de connexion au proxy: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Vérifiez les logs avec Get-Job | Receive-Job" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Données disponibles:" -ForegroundColor Cyan
Write-Host "   • 5 projets de démonstration" -ForegroundColor White
Write-Host "   • Vulnérabilités d'exemple" -ForegroundColor White
Write-Host "   • API complète simulée" -ForegroundColor White

Write-Host ""
Write-Host "🌐 Ouvrez votre navigateur sur:" -ForegroundColor Green
$htmlPath = Join-Path $PWD "index-new.html"
Write-Host "   file:///$($htmlPath.Replace('\', '/'))" -ForegroundColor Yellow

Write-Host ""
Write-Host "🛠️ Commandes utiles:" -ForegroundColor Cyan
Write-Host "   • Get-Job : Voir l'état du proxy" -ForegroundColor White
Write-Host "   • Get-Job | Receive-Job : Voir les logs" -ForegroundColor White
Write-Host "   • Get-Job | Stop-Job : Arrêter le proxy" -ForegroundColor White

Write-Host ""
Write-Host "✋ Appuyez sur une touche pour continuer..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
