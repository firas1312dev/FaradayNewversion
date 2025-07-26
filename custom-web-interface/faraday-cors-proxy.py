#!/usr/bin/env python3
"""
Proxy CORS pour Faraday
Permet d'accéder à l'API Faraday depuis un navigateur web en contournant les restrictions CORS
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.parse
import json
import base64
from urllib.error import HTTPError, URLError
import logging

# Configuration
FARADAY_URL = "http://localhost:5985"
PROXY_PORT = 8082

# Configuration du logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class CORSProxyHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Gérer les requêtes preflight CORS"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Gérer les requêtes GET"""
        self.proxy_request()
    
    def do_POST(self):
        """Gérer les requêtes POST"""
        self.proxy_request()
    
    def do_PUT(self):
        """Gérer les requêtes PUT"""
        self.proxy_request()
    
    def do_DELETE(self):
        """Gérer les requêtes DELETE"""
        self.proxy_request()
    
    def send_cors_headers(self):
        """Envoyer les headers CORS nécessaires"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRFToken')
        self.send_header('Access-Control-Expose-Headers', 'X-CSRFToken')
        self.send_header('Access-Control-Allow-Credentials', 'true')
    
    def proxy_request(self):
        """Faire le proxy de la requête vers Faraday"""
        try:
            # Construire l'URL de destination
            if self.path.startswith('/'):
                target_url = FARADAY_URL + self.path
            else:
                target_url = FARADAY_URL + '/' + self.path
            
            logging.info(f"Proxying {self.command} {self.path} -> {target_url}")
            
            # Préparer les headers
            headers = {}
            for header, value in self.headers.items():
                if header.lower() not in ['host', 'origin']:
                    headers[header] = value
            
            # Lire le body si présent
            content_length = int(self.headers.get('Content-Length', 0))
            body = None
            if content_length > 0:
                body = self.rfile.read(content_length)
            
            # Créer la requête
            req = urllib.request.Request(target_url, data=body, headers=headers, method=self.command)
            
            # Faire la requête vers Faraday
            try:
                response = urllib.request.urlopen(req, timeout=30)
                
                # Envoyer la réponse
                self.send_response(response.status)
                self.send_cors_headers()
                
                # Copier les headers de la réponse
                for header, value in response.headers.items():
                    if header.lower() not in ['access-control-allow-origin', 'access-control-allow-methods', 
                                              'access-control-allow-headers', 'access-control-expose-headers',
                                              'access-control-allow-credentials']:
                        self.send_header(header, value)
                
                self.end_headers()
                
                # Copier le contenu de la réponse
                response_data = response.read()
                self.wfile.write(response_data)
                
                logging.info(f"Success: {response.status} - {len(response_data)} bytes")
                
            except HTTPError as e:
                # Erreur HTTP de Faraday
                self.send_response(e.status)
                self.send_cors_headers()
                
                # Copier les headers d'erreur
                for header, value in e.headers.items():
                    if header.lower() not in ['access-control-allow-origin', 'access-control-allow-methods', 
                                              'access-control-allow-headers', 'access-control-expose-headers',
                                              'access-control-allow-credentials']:
                        self.send_header(header, value)
                
                self.end_headers()
                
                # Copier le contenu d'erreur
                error_data = e.read()
                self.wfile.write(error_data)
                
                logging.warning(f"HTTP Error: {e.status} - {e.reason}")
                
            except URLError as e:
                # Erreur de connexion
                self.send_response(502)
                self.send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                error_response = {
                    "error": "Impossible de se connecter au serveur Faraday",
                    "details": str(e.reason),
                    "faraday_url": FARADAY_URL
                }
                self.wfile.write(json.dumps(error_response).encode())
                
                logging.error(f"Connection Error: {e.reason}")
        
        except Exception as e:
            # Erreur générale
            self.send_response(500)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            error_response = {
                "error": "Erreur interne du proxy",
                "details": str(e)
            }
            self.wfile.write(json.dumps(error_response).encode())
            
            logging.error(f"Internal Error: {str(e)}")
    
    def log_message(self, format, *args):
        """Désactiver les logs par défaut (on utilise logging)"""
        pass

def main():
    print(f"🚀 Démarrage du proxy CORS pour Faraday")
    print(f"📡 Serveur Faraday: {FARADAY_URL}")
    print(f"🌐 Proxy disponible sur: http://localhost:{PROXY_PORT}")
    print(f"💡 Utilisez http://localhost:{PROXY_PORT} comme baseURL dans votre interface")
    print("=" * 60)
    
    try:
        # Tester la connexion à Faraday
        test_req = urllib.request.Request(f"{FARADAY_URL}/_api/v3/info")
        test_response = urllib.request.urlopen(test_req, timeout=5)
        data = json.loads(test_response.read().decode())
        print(f"✅ Connexion à Faraday réussie - Version: {data.get('Version', 'Unknown')}")
    except Exception as e:
        print(f"⚠️  Attention: Impossible de se connecter à Faraday ({e})")
        print("   Le proxy va quand même démarrer...")
    
    print("=" * 60)
    
    # Démarrer le serveur proxy
    server = HTTPServer(('localhost', PROXY_PORT), CORSProxyHandler)
    
    try:
        print("🟢 Proxy CORS démarré ! Arrêt avec Ctrl+C")
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🔴 Arrêt du proxy CORS")
        server.shutdown()

if __name__ == "__main__":
    main()
