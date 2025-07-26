#!/bin/bash
# Script pour corriger CORS dans le conteneur Faraday

echo "🔧 Correction CORS dans le conteneur Faraday..."

# Copier le fichier app.py modifié dans le conteneur
docker cp ../faraday/server/app.py faraday_app:/opt/faraday/lib/python3.8/site-packages/faraday/server/app.py

echo "✅ Fichier app.py copié dans le conteneur"

# Redémarrer le conteneur pour appliquer les changements
docker restart faraday_app

echo "🔄 Conteneur redémarré"

# Attendre que le serveur redémarre
echo "⏳ Attente du redémarrage (30 secondes)..."
sleep 30

echo "✅ CORS devrait maintenant être configuré!"
