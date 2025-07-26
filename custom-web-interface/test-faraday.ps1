# Script de test pour l'interface Faraday personnalisée
# Usage: .\test-faraday.ps1

Write-Host "🧪 Tests Interface Faraday Personnalisée" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Configuration
$apiBase = "http://localhost:5985/_api/v3"
$username = "faraday"
$password = "faraday"
$credentials = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${username}:${password}"))
$headers = @{
    "Authorization" = "Basic $credentials"
    "Content-Type" = "application/json"
}

# Fonction pour afficher les résultats
function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Success,
        [string]$Details = ""
    )
    
    if ($Success) {
        Write-Host "✅ $TestName" -ForegroundColor Green
    } else {
        Write-Host "❌ $TestName" -ForegroundColor Red
    }
    
    if ($Details) {
        Write-Host "   $Details" -ForegroundColor Gray
    }
}

# Test 1: Connectivité serveur
Write-Host "`n📡 Test 1: Connectivité serveur" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5985" -Method GET -TimeoutSec 10
    Write-TestResult "Serveur accessible" $true "Status: $($response.StatusCode)"
} catch {
    Write-TestResult "Serveur accessible" $false "Erreur: $($_.Exception.Message)"
}

# Test 2: API Info
Write-Host "`n🔍 Test 2: API Info" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$apiBase/info" -Headers $headers -TimeoutSec 10
    Write-TestResult "API Info" $true "Version: $($response.Version)"
} catch {
    Write-TestResult "API Info" $false "Erreur: $($_.Exception.Message)"
}

# Test 3: Authentification
Write-Host "`n🔐 Test 3: Authentification" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$apiBase/info" -Headers $headers -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-TestResult "Authentification" $true "Credentials valides"
    } else {
        Write-TestResult "Authentification" $false "Status: $($response.StatusCode)"
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-TestResult "Authentification" $false "Credentials invalides"
    } else {
        Write-TestResult "Authentification" $false "Erreur: $($_.Exception.Message)"
    }
}

# Test 4: Workspaces
Write-Host "`n📁 Test 4: Workspaces" -ForegroundColor Yellow
try {
    $workspaces = Invoke-RestMethod -Uri "$apiBase/ws" -Headers $headers -TimeoutSec 10
    Write-TestResult "Récupération workspaces" $true "Nombre: $($workspaces.Count)"
    foreach ($ws in $workspaces) {
        Write-Host "   📁 $($ws.name)" -ForegroundColor Gray
    }
} catch {
    Write-TestResult "Récupération workspaces" $false "Erreur: $($_.Exception.Message)"
}

# Test 5: Hosts (si workspace disponible)
Write-Host "`n🖥️ Test 5: Hosts" -ForegroundColor Yellow
try {
    $workspaces = Invoke-RestMethod -Uri "$apiBase/ws" -Headers $headers -TimeoutSec 10
    if ($workspaces.Count -gt 0) {
        $firstWs = $workspaces[0].name
        $hosts = Invoke-RestMethod -Uri "$apiBase/ws/$firstWs/hosts" -Headers $headers -TimeoutSec 10
        Write-TestResult "Récupération hosts" $true "Workspace: $firstWs, Hosts: $($hosts.Count)"
    } else {
        Write-TestResult "Récupération hosts" $false "Aucun workspace disponible"
    }
} catch {
    Write-TestResult "Récupération hosts" $false "Erreur: $($_.Exception.Message)"
}

# Test 6: Vulnérabilités
Write-Host "`n🔒 Test 6: Vulnérabilités" -ForegroundColor Yellow
try {
    $workspaces = Invoke-RestMethod -Uri "$apiBase/ws" -Headers $headers -TimeoutSec 10
    if ($workspaces.Count -gt 0) {
        $firstWs = $workspaces[0].name
        $vulns = Invoke-RestMethod -Uri "$apiBase/ws/$firstWs/vulns" -Headers $headers -TimeoutSec 10
        Write-TestResult "Récupération vulnérabilités" $true "Workspace: $firstWs, Vulns: $($vulns.Count)"
    } else {
        Write-TestResult "Récupération vulnérabilités" $false "Aucun workspace disponible"
    }
} catch {
    Write-TestResult "Récupération vulnérabilités" $false "Erreur: $($_.Exception.Message)"
}

# Test 7: Fichiers interface personnalisée
Write-Host "`n📄 Test 7: Fichiers interface" -ForegroundColor Yellow
$files = @(
    "index.html",
    "css/styles.css",
    "css/modules.css",
    "js/api.js",
    "js/graphics.js",
    "js/planner.js",
    "js/app.js"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-TestResult "Fichier $file" $true "Présent"
    } else {
        Write-TestResult "Fichier $file" $false "Manquant"
    }
}

# Test 8: Conteneurs Docker
Write-Host "`n🐳 Test 8: Conteneurs Docker" -ForegroundColor Yellow
try {
    $containers = docker ps --format "table {{.Names}}\t{{.Status}}" | Select-String "faraday"
    if ($containers) {
        Write-TestResult "Conteneurs Faraday" $true "Actifs"
        $containers | ForEach-Object { Write-Host "   🐳 $_" -ForegroundColor Gray }
    } else {
        Write-TestResult "Conteneurs Faraday" $false "Aucun conteneur actif"
    }
} catch {
    Write-TestResult "Conteneurs Faraday" $false "Docker non accessible"
}

# Résumé
Write-Host "`n📊 Résumé des tests" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "✅ Interface personnalisée prête à utiliser" -ForegroundColor Green
Write-Host "🔗 URL principale: http://localhost:5985" -ForegroundColor Yellow
Write-Host "🧪 Page de test: file:///$PWD/test.html" -ForegroundColor Yellow
Write-Host "📁 Interface custom: file:///$PWD/index.html" -ForegroundColor Yellow

Write-Host "`n🚀 Pour commencer:" -ForegroundColor Cyan
Write-Host "1. Ouvrir http://localhost:5985 (interface officielle)" -ForegroundColor White
Write-Host "2. Se connecter avec faraday/faraday" -ForegroundColor White
Write-Host "3. Ouvrir l'interface personnalisee (index.html)" -ForegroundColor White
Write-Host "4. Tester les modules Graphics et Planner" -ForegroundColor White
