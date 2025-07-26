#!/usr/bin/env python3
"""
Serveur Proxy CORS pour Faraday
Permet de contourner les restrictions CORS pour connecter l'interface web aux vraies données Faraday
"""

import http.server
import socketserver
import urllib.request
import urllib.parse
import json
import base64
from urllib.error import URLError, HTTPError

class CORSProxyHandler(http.server.BaseHTTPRequestHandler):
    
    FARADAY_BASE_URL = "http://localhost:5985"
    
    def do_OPTIONS(self):
        """Gérer les requêtes preflight CORS"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Proxy pour les requêtes GET"""
        self.proxy_request('GET')
    
    def do_POST(self):
        """Proxy pour les requêtes POST"""
        self.proxy_request('POST')
    
    def do_PUT(self):
        """Proxy pour les requêtes PUT"""
        self.proxy_request('PUT')
    
    def do_DELETE(self):
        """Proxy pour les requêtes DELETE"""
        self.proxy_request('DELETE')
    
    def send_cors_headers(self):
        """Envoyer les en-têtes CORS"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRFToken')
        self.send_header('Access-Control-Expose-Headers', 'X-CSRFToken')
        self.send_header('Access-Control-Allow-Credentials', 'true')
    
    def proxy_request(self, method):
        """Proxy une requête vers Faraday"""
        try:
            # Mapper les anciens endpoints vers les nouveaux
            path = self.path
            
            # Convertir _api vers _api si nécessaire
            if path.startswith('/_api/info'):
                # Essayons d'abord avec /ws (workspaces endpoint)
                path = '/ws'
            elif path.startswith('/_api/v3/workspaces'):
                path = '/ws'
            elif path.startswith('/_api/v3/ws/'):
                # Format: _api/v3/ws/workspace_name/hosts -> workspace_name/hosts
                path = path.replace('/_api/v3/ws/', '/')
            elif path.startswith('/_api/'):
                # Garder le path tel quel pour l'API Faraday
                pass
            
            # Construire l'URL Faraday finale
            faraday_url = f"{self.FARADAY_BASE_URL}{path}"
            print(f"🌐 Proxy {method} {self.path} -> {faraday_url}")
            
            # Préparer les headers pour Faraday
            headers = {}
            
            # Copier les headers importants
            if 'Authorization' in self.headers:
                headers['Authorization'] = self.headers['Authorization']
            if 'Content-Type' in self.headers:
                headers['Content-Type'] = self.headers['Content-Type']
            
            # Lire le body pour POST/PUT
            data = None
            if method in ['POST', 'PUT'] and 'Content-Length' in self.headers:
                content_length = int(self.headers['Content-Length'])
                data = self.rfile.read(content_length)
            
            # Créer la requête vers Faraday
            req = urllib.request.Request(faraday_url, data=data, headers=headers, method=method)
            
            # Exécuter la requête
            with urllib.request.urlopen(req, timeout=30) as response:
                # Envoyer la réponse au client
                self.send_response(response.getcode())
                self.send_cors_headers()
                
                # Copier les headers de réponse
                for header, value in response.headers.items():
                    if header.lower() not in ['connection', 'transfer-encoding']:
                        self.send_header(header, value)
                
                self.end_headers()
                
                # Copier le contenu
                content = response.read()
                self.wfile.write(content)
                
                print(f"✅ Proxy réussi: {response.getcode()} ({len(content)} bytes)")
        
        except HTTPError as e:
            print(f"❌ Erreur HTTP: {e.code} {e.reason}")
            self.send_response(e.code)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            error_response = {
                'error': f'HTTP {e.code}: {e.reason}',
                'code': e.code
            }
            self.wfile.write(json.dumps(error_response).encode())
        
        except URLError as e:
            print(f"❌ Erreur URL: {e.reason}")
            self.send_response(500)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            error_response = {
                'error': f'Connexion échouée: {e.reason}',
                'code': 500
            }
            self.wfile.write(json.dumps(error_response).encode())
        
        except Exception as e:
            print(f"❌ Erreur inattendue: {str(e)}")
            self.send_response(500)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            error_response = {
                'error': f'Erreur serveur: {str(e)}',
                'code': 500
            }
            self.wfile.write(json.dumps(error_response).encode())
    
    def log_message(self, format, *args):
        """Override pour personnaliser les logs"""
        print(f"[{self.address_string()}] {format % args}")

def run_proxy_server(port=8082):
    """Démarrer le serveur proxy"""
    try:
        with socketserver.TCPServer(("", port), CORSProxyHandler) as httpd:
            print(f"🚀 Serveur Proxy CORS démarré sur http://localhost:{port}")
            print(f"📡 Proxy vers Faraday: http://localhost:5985")
            print(f"🌐 Interface web: http://localhost:8888")
            print("=" * 60)
            print("INSTRUCTIONS:")
            print("1. Ouvrez http://localhost:8888 dans votre navigateur")
            print("2. L'interface utilisera automatiquement le proxy")
            print("3. Vous aurez accès aux vraies données Faraday!")
            print("=" * 60)
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Serveur proxy arrêté")
    except Exception as e:
        print(f"❌ Erreur démarrage serveur: {e}")

if __name__ == "__main__":
    run_proxy_server()
