#!/usr/bin/env python3
"""
Serveur Proxy CORS pour Faraday - Version Améliorée
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
    
    def log_message(self, format, *args):
        """Override pour contrôler les logs"""
        print(f"🔍 {format % args}")
    
    def do_OPTIONS(self):
        """Gérer les requêtes preflight CORS"""
        print("🌐 Preflight CORS request")
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
    
    def send_cors_headers(self):
        """Envoyer les en-têtes CORS"""
        # Pour les requêtes avec credentials, on ne peut pas utiliser *
        origin = self.headers.get('Origin', 'http://localhost:8888')
        print(f"🔧 Setting CORS origin to: {origin}")
        
        self.send_header('Access-Control-Allow-Origin', origin)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRFToken, Cache-Control, Pragma, Expires, X-Cache, If-Modified-Since, If-None-Match')
        self.send_header('Access-Control-Expose-Headers', 'X-CSRFToken, Content-Type')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Access-Control-Max-Age', '86400')  # Cache preflight pour 24h
    
    def do_GET(self):
        """Gérer les requêtes GET"""
        self.handle_request('GET')
    
    def do_POST(self):
        """Gérer les requêtes POST"""
        self.handle_request('POST')
    
    def do_PUT(self):
        """Gérer les requêtes PUT"""
        self.handle_request('PUT')
    
    def do_DELETE(self):
        """Gérer les requêtes DELETE"""
        self.handle_request('DELETE')
    
    def handle_request(self, method):
        """Gérer toutes les requêtes HTTP"""
        try:
            print(f"\n🌐 === REQUÊTE {method} ===")
            print(f"🌐 Path: {self.path}")
            print(f"🌐 Headers: {dict(self.headers)}")
            
            # Parse l'URL
            parsed_url = urllib.parse.urlparse(self.path)
            path = parsed_url.path
            query = parsed_url.query
            
            # Gérer les différents types de chemins
            if path == '/proxy/_api/v3/ws' or path.startswith('/proxy/_api/v3/ws'):
                # Retirer le préfixe /proxy
                path = path.replace('/proxy', '')
            elif path == '/proxy/ws' or path == '/proxy/workspaces':
                path = '/_api/v3/ws'
            elif path == '/proxy/info':
                path = '/_api/v3/info'
            elif path.startswith('/proxy/'):
                # Retirer le préfixe /proxy et ajouter /_api/v3 si nécessaire
                path = path.replace('/proxy', '')
                if not path.startswith('/_api/'):
                    path = '/_api/v3' + path
            elif path == '/ws' or path == '/workspaces':
                path = '/_api/v3/ws'
            elif path == '/info':
                path = '/_api/v3/info'
            elif path.startswith('/_api/v3/ws/'):
                # Garder tel quel
                pass
            elif path.startswith('/_api/'):
                # Garder tel quel pour l'API Faraday
                pass
            else:
                # Autres chemins - supposer que c'est pour l'API v3
                if not path.startswith('/'):
                    path = '/' + path
                if not path.startswith('/_api/'):
                    path = '/_api/v3' + path
            
            # Reconstruire l'URL avec query parameters
            if query:
                path = f"{path}?{query}"
            
            # Construire l'URL Faraday finale
            faraday_url = f"{self.FARADAY_BASE_URL}{path}"
            print(f"🌐 URL Faraday: {faraday_url}")
            
            # Préparer les headers pour Faraday
            headers = {}
            
            # Authentification automatique Faraday si pas déjà présente
            if 'Authorization' not in self.headers:
                # Credentials par défaut Faraday
                credentials = base64.b64encode('faraday:faraday'.encode()).decode()
                headers['Authorization'] = f'Basic {credentials}'
                print(f"🔐 Ajout authentification automatique Faraday")
            
            # Headers importants
            for header_name in ['Authorization', 'Content-Type', 'Accept', 'Cookie']:
                if header_name in self.headers:
                    headers[header_name] = self.headers[header_name]
                    print(f"🌐 Header {header_name}: {headers[header_name]}")
            
            # Headers par défaut si manquants
            if 'Accept' not in headers:
                headers['Accept'] = 'application/json'
            if 'Content-Type' not in headers and method in ['POST', 'PUT']:
                headers['Content-Type'] = 'application/json'
            
            # Lire le body pour POST/PUT
            data = None
            if method in ['POST', 'PUT'] and 'Content-Length' in self.headers:
                content_length = int(self.headers['Content-Length'])
                data = self.rfile.read(content_length)
                print(f"🌐 Body length: {len(data)} bytes")
                if data:
                    try:
                        body_str = data.decode('utf-8')
                        print(f"🌐 Body: {body_str[:200]}...")
                    except:
                        print("🌐 Body: [binary data]")
            
            # Créer la requête vers Faraday
            print(f"🌐 Création requête vers Faraday...")
            req = urllib.request.Request(faraday_url, data=data, headers=headers, method=method)
            
            # Exécuter la requête
            print(f"🌐 Exécution requête...")
            with urllib.request.urlopen(req, timeout=30) as response:
                print(f"🌐 Réponse reçue: {response.getcode()}")
                
                # Envoyer la réponse au client
                self.send_response(response.getcode())
                self.send_cors_headers()
                
                # Copier les headers de réponse
                for header, value in response.headers.items():
                    if header.lower() not in ['connection', 'transfer-encoding', 'content-encoding']:
                        self.send_header(header, value)
                        print(f"🌐 Response Header: {header}: {value}")
                
                self.end_headers()
                
                # Copier le contenu
                content = response.read()
                self.wfile.write(content)
                
                print(f"✅ Succès: {response.getcode()} ({len(content)} bytes)")
                
                # Log du contenu pour debug
                try:
                    content_str = content.decode('utf-8')
                    if len(content_str) < 500:
                        print(f"🌐 Content: {content_str}")
                    else:
                        print(f"🌐 Content preview: {content_str[:200]}...")
                except:
                    print(f"🌐 Content: [binary, {len(content)} bytes]")
        
        except HTTPError as e:
            print(f"❌ Erreur HTTP: {e.code} {e.reason}")
            print(f"❌ URL: {faraday_url}")
            
            self.send_response(e.code)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            error_response = {
                'error': f'HTTP {e.code}: {e.reason}',
                'code': e.code,
                'url': faraday_url
            }
            error_json = json.dumps(error_response).encode()
            self.wfile.write(error_json)
            
        except URLError as e:
            print(f"❌ Erreur connexion: {e.reason}")
            print(f"❌ URL: {faraday_url}")
            
            self.send_response(500)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            error_response = {
                'error': f'Connexion échouée: {e.reason}',
                'code': 500,
                'url': faraday_url
            }
            error_json = json.dumps(error_response).encode()
            self.wfile.write(error_json)
            
        except Exception as e:
            print(f"❌ Erreur inattendue: {e}")
            print(f"❌ Type: {type(e)}")
            
            self.send_response(500)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            error_response = {
                'error': f'Erreur serveur: {str(e)}',
                'code': 500,
                'type': str(type(e))
            }
            error_json = json.dumps(error_response).encode()
            self.wfile.write(error_json)


def main():
    PORT = 8082  # Changer le port pour éviter les conflits
    
    print("🚀 Démarrage du proxy CORS Faraday...")
    print(f"🌐 Port: {PORT}")
    print(f"🌐 Faraday: http://localhost:5985")
    print(f"🌐 Proxy: http://localhost:{PORT}")
    print("=" * 50)
    
    with socketserver.TCPServer(("", PORT), CORSProxyHandler) as httpd:
        print(f"✅ Proxy CORS démarré sur http://localhost:{PORT}")
        print("🔄 En attente de requêtes...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Arrêt du proxy CORS")


if __name__ == "__main__":
    main()
