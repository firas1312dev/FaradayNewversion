#!/usr/bin/env python3
"""
Proxy CORS pour Faraday - Simple et efficace
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import base64

app = Flask(__name__)
CORS(app)

# Configuration
FARADAY_URL = "http://localhost:5985"
FARADAY_USER = "faraday"
FARADAY_PASS = "faraday"

# Créer les credentials de base
auth_string = f"{FARADAY_USER}:{FARADAY_PASS}"
auth_bytes = auth_string.encode('ascii')
auth_b64 = base64.b64encode(auth_bytes).decode('ascii')

print(f"🚀 Proxy CORS Faraday démarré")
print(f"📡 Serveur Faraday: {FARADAY_URL}")
print(f"🔑 Authentification: {FARADAY_USER}:{FARADAY_PASS}")
print(f"🌐 Proxy disponible sur: http://localhost:8082")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
def proxy(path):
    """Proxy toutes les requêtes vers Faraday avec CORS"""
    
    try:
        # Construire l'URL cible
        target_url = f"{FARADAY_URL}/{path}"
        
        # Préparer les headers
        headers = {
            'Authorization': f'Basic {auth_b64}',
            'Content-Type': 'application/json'
        }
        
        # Copier les query parameters
        params = dict(request.args)
        
        # Faire la requête
        if request.method == 'GET':
            response = requests.get(target_url, headers=headers, params=params, timeout=30)
        elif request.method == 'POST':
            response = requests.post(target_url, headers=headers, json=request.get_json(), params=params, timeout=30)
        elif request.method == 'PUT':
            response = requests.put(target_url, headers=headers, json=request.get_json(), params=params, timeout=30)
        elif request.method == 'DELETE':
            response = requests.delete(target_url, headers=headers, params=params, timeout=30)
        else:
            response = requests.request(request.method, target_url, headers=headers, json=request.get_json(), params=params, timeout=30)
        
        # Retourner la réponse
        try:
            return jsonify(response.json()), response.status_code
        except:
            return response.text, response.status_code
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur proxy: {e}")
        return jsonify({"error": f"Proxy error: {str(e)}"}), 500
    except Exception as e:
        print(f"❌ Erreur inattendue: {e}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8082, debug=True)
