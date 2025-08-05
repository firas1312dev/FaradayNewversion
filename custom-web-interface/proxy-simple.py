#!/usr/bin/env python3
"""
Proxy CORS Simple pour Faraday
Version simple sans dépendances Flask
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.parse
import json
import base64
from urllib.error import HTTPError, URLError
import logging
import sys

# Configuration
FARADAY_URL = "http://localhost:5985"
PROXY_PORT = 8082

# Configuration du logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class CORSProxyHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        """Override pour éviter trop de logs"""
        pass
    
    def do_OPTIONS(self):
        """Gérer les requêtes preflight CORS"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Gérer les requêtes GET"""
        if self.path == '/health':
            self.health_check()
            return
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
    
    def health_check(self):
        """Route de santé pour vérifier le proxy"""
        self.send_response(200)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        response = {
            'status': 'ok',
            'proxy_version': '1.0',
            'faraday_url': FARADAY_URL,
            'message': 'Proxy CORS opérationnel'
        }
        self.wfile.write(json.dumps(response).encode())
    
    def send_cors_headers(self):
        """Envoyer les en-têtes CORS"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Credentials', 'true')
    
    def proxy_request(self):
        """Proxy de la requête vers Faraday"""
        try:
            # Construction de l'URL complète
            target_url = FARADAY_URL + self.path
            logging.info(f"Proxying {self.command} to: {target_url}")
            
            # Préparation des headers
            headers = {}
            
            # Copier les headers importants
            for header_name, header_value in self.headers.items():
                if header_name.lower() not in ['host', 'connection', 'content-length']:
                    headers[header_name] = header_value
            
            # Authentification par défaut
            auth_string = base64.b64encode(b'faraday:faraday').decode('ascii')
            headers['Authorization'] = f'Basic {auth_string}'
            
            # Lire le body pour POST/PUT
            content_length = int(self.headers.get('Content-Length', 0))
            body = None
            if content_length > 0:
                body = self.rfile.read(content_length)
            
            # Créer et exécuter la requête
            req = urllib.request.Request(target_url, data=body, headers=headers, method=self.command)
            
            with urllib.request.urlopen(req, timeout=10) as response:
                response_data = response.read()
                
                # Envoyer la réponse
                self.send_response(response.status)
                self.send_cors_headers()
                
                # Copier les headers de réponse
                for header_name, header_value in response.headers.items():
                    if header_name.lower() not in ['connection', 'transfer-encoding']:
                        self.send_header(header_name, header_value)
                
                self.end_headers()
                
                if response_data:
                    self.wfile.write(response_data)
                    
        except HTTPError as e:
            logging.error(f"HTTP Error: {e.code}")
            self.send_error_response(e.code, f"HTTP {e.code}", str(e.reason))
            
        except URLError as e:
            logging.error(f"Connection Error: {e.reason}")
            self.send_error_response(502, "Connection Error", str(e.reason))
            
        except Exception as e:
            logging.error(f"Proxy Error: {e}")
            self.send_error_response(500, "Internal Error", str(e))
    
    def send_error_response(self, status_code, error_type, message):
        """Envoyer une réponse d'erreur JSON"""
        self.send_response(status_code)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        error_response = {
            'error': error_type,
            'message': message,
            'status_code': status_code
        }
        self.wfile.write(json.dumps(error_response).encode())

def main():
    """Fonction principale"""
    try:
        server_address = ('localhost', PROXY_PORT)
        httpd = HTTPServer(server_address, CORSProxyHandler)
        
        print(f"🚀 Proxy CORS démarré sur http://localhost:{PROXY_PORT}")
        print(f"📡 Redirection vers Faraday: {FARADAY_URL}")
        print(f"🔗 Test: http://localhost:{PROXY_PORT}/health")
        print("✋ Appuyez sur Ctrl+C pour arrêter\n")
        
        httpd.serve_forever()
        
    except KeyboardInterrupt:
        print("\n🛑 Arrêt du proxy...")
        httpd.shutdown()
        sys.exit(0)
    except Exception as e:
        print(f"❌ Erreur démarrage: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
