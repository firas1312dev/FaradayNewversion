#!/bin/bash
# Script de démarrage pour Faraday Interface avec port 8082 uniquement

echo "🚀 Démarrage de l'interface Faraday avec port 8082"
echo "=================================================="

# Arrêter tous les serveurs Python en cours
echo "🛑 Arrêt des serveurs Python existants..."
PIDS=$(ps aux | grep python | grep -E "(cors-proxy|8081|8082)" | grep -v grep | awk '{print $2}')
if [ ! -z "$PIDS" ]; then
    echo "   Arrêt des processus: $PIDS"
    kill $PIDS 2>/dev/null || true
    sleep 2
fi

# Arrêter tous les serveurs Node.js
echo "🛑 Arrêt des serveurs Node.js existants..."
PIDS_NODE=$(ps aux | grep node | grep -E "(cors-proxy|8081|8082)" | grep -v grep | awk '{print $2}')
if [ ! -z "$PIDS_NODE" ]; then
    echo "   Arrêt des processus Node: $PIDS_NODE"
    kill $PIDS_NODE 2>/dev/null || true
    sleep 2
fi

echo ""
echo "🌐 Vérification de Faraday server..."
if curl -s "http://localhost:5985/_api/v3/info" > /dev/null; then
    echo "✅ Faraday server actif sur port 5985"
else
    echo "❌ Faraday server non accessible sur port 5985"
    echo "   Assurez-vous que Faraday est démarré"
    exit 1
fi

echo ""
echo "🚀 Démarrage du proxy CORS sur port 8082..."
cd "$(dirname "$0")"
python3 cors-proxy-enhanced.py &
PROXY_PID=$!

sleep 3

echo ""
echo "🌐 Vérification du proxy CORS..."
if curl -s "http://localhost:8082/_api/v3/info" > /dev/null; then
    echo "✅ Proxy CORS actif sur port 8082"
else
    echo "❌ Proxy CORS non accessible sur port 8082"
    kill $PROXY_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🚀 Démarrage du serveur web sur port 8888..."
python3 -m http.server 8888 &
WEB_PID=$!

sleep 2

echo ""
echo "✅ Tous les serveurs sont démarrés !"
echo "=================================="
echo "🌐 Interface Web:    http://localhost:8888"
echo "🔗 Proxy CORS:      http://localhost:8082"
echo "⚙️  API Faraday:     http://localhost:5985"
echo ""
echo "💡 Test direct: http://localhost:8888/test-port-8082.html"
echo ""
echo "🛑 Pour arrêter: Ctrl+C puis exécuter 'killall python3'"

# Attendre les signaux
trap "echo 'Arrêt en cours...'; kill $PROXY_PID $WEB_PID 2>/dev/null || true; exit 0" INT TERM

wait
