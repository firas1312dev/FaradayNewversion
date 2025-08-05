#!/usr/bin/env python3
"""
Proxy CORS amélioré pour l'API Faraday avec support complet des vulnérabilités
Permet de contourner les restrictions CORS entre le frontend et l'API Faraday
"""

import json
import logging
import re
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, urljoin
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import base64

# Configuration
FARADAY_API_BASE = "http://localhost:5985"
PROXY_PORT = 8082
FARADAY_CREDENTIALS = base64.b64encode(b'faraday:faraday').decode('ascii')

# Configuration des logs
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FaradayVulnCORSProxy(BaseHTTPRequestHandler):
    """Proxy CORS pour l'API Faraday avec support spécialisé pour les vulnérabilités"""
    
    def log_message(self, format, *args):
        """Override pour utiliser notre logger"""
        logger.info("%s - %s" % (self.address_string(), format % args))
    
    def do_OPTIONS(self):
        """Gérer les requêtes OPTIONS pour CORS"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Gérer les requêtes GET"""
        self.handle_request()
    
    def do_POST(self):
        """Gérer les requêtes POST"""
        self.handle_request()
    
    def do_PUT(self):
        """Gérer les requêtes PUT"""
        self.handle_request()
    
    def do_DELETE(self):
        """Gérer les requêtes DELETE"""
        self.handle_request()
    
    def send_cors_headers(self):
        """Envoyer les en-têtes CORS nécessaires"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Access-Control-Max-Age', '86400')
    
    def handle_request(self):
        """Traiter toutes les requêtes HTTP"""
        try:
            # Extraire le chemin de l'API depuis l'URL
            path = self.path
            if path.startswith('/'):
                path = path[1:]
            
            # Construire l'URL complète vers l'API Faraday
            api_url = urljoin(FARADAY_API_BASE + '/', path)
            
            logger.info(f"🔄 {self.command} {path} -> {api_url}")
            
            # Préparer les en-têtes
            headers = {
                'Authorization': f'Basic {FARADAY_CREDENTIALS}',
                'Content-Type': 'application/json',
                'User-Agent': 'FaradayVulnProxy/1.0'
            }
            
            # Copier certains en-têtes de la requête originale
            for header_name in ['Content-Type', 'Accept']:
                if header_name in self.headers:
                    headers[header_name] = self.headers[header_name]
            
            # Lire le corps de la requête pour POST/PUT
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = None
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                logger.info(f"📤 Données envoyées: {post_data[:200]}...")
            
            # Créer et envoyer la requête
            request = Request(api_url, data=post_data, headers=headers, method=self.command)
            
            try:
                with urlopen(request, timeout=30) as response:
                    # Lire la réponse
                    response_data = response.read()
                    
                    # Envoyer la réponse
                    self.send_response(response.status)
                    self.send_cors_headers()
                    
                    # Copier les en-têtes de la réponse
                    for header, value in response.headers.items():
                        if header.lower() not in ['access-control-allow-origin', 'access-control-allow-methods', 
                                                'access-control-allow-headers', 'access-control-max-age']:
                            self.send_header(header, value)
                    
                    self.end_headers()
                    
                    # Envoyer le corps de la réponse
                    if response_data:
                        self.wfile.write(response_data)
                        
                        # Log pour debug
                        if response.headers.get('Content-Type', '').startswith('application/json'):
                            try:
                                json_data = json.loads(response_data.decode('utf-8'))
                                if 'vulnerabilities' in json_data:
                                    logger.info(f"✅ Vulnérabilités récupérées: {len(json_data['vulnerabilities'])}")
                                elif isinstance(json_data, list):
                                    logger.info(f"✅ Liste récupérée: {len(json_data)} éléments")
                                else:
                                    logger.info(f"✅ Réponse JSON: {str(json_data)[:100]}...")
                            except:
                                logger.info(f"✅ Réponse: {response_data[:100]}...")
                    
                    logger.info(f"✅ {self.command} {path} - {response.status}")
                    
            except HTTPError as e:
                logger.error(f"❌ Erreur HTTP {e.code}: {e.reason}")
                
                # Lire le corps de l'erreur
                error_body = e.read() if hasattr(e, 'read') else b''
                
                self.send_response(e.code)
                self.send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                # Retourner les détails de l'erreur
                if error_body:
                    self.wfile.write(error_body)
                else:
                    error_response = {
                        'error': f'HTTP {e.code}: {e.reason}',
                        'message': 'Erreur lors de la communication avec l\'API Faraday'
                    }
                    self.wfile.write(json.dumps(error_response).encode('utf-8'))
                
        except URLError as e:
            logger.error(f"❌ Erreur de connexion: {e}")
            self.send_error_response(502, f"Impossible de se connecter à l'API Faraday: {e}")
            
        except Exception as e:
            logger.error(f"❌ Erreur inattendue: {e}")
            self.send_error_response(500, f"Erreur interne du proxy: {e}")
    
    def send_error_response(self, status_code, message):
        """Envoyer une réponse d'erreur avec CORS"""
        self.send_response(status_code)
        self.send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        error_response = {
            'error': message,
            'status_code': status_code
        }
        self.wfile.write(json.dumps(error_response).encode('utf-8'))

def main():
    """Fonction principale pour démarrer le serveur proxy"""
    try:
        server = HTTPServer(('localhost', PROXY_PORT), FaradayVulnCORSProxy)
        
        print("🚀 Démarrage du proxy CORS pour vulnérabilités Faraday...")
        print(f"📍 Proxy: http://localhost:{PROXY_PORT}")
        print(f"🎯 API Faraday: {FARADAY_API_BASE}")
        print(f"🔐 Authentification: {'✅ Configurée' if FARADAY_CREDENTIALS else '❌ Manquante'}")
        print("\n📋 Endpoints supportés:")
        print("   • GET  /_api/v3/ws                    - Liste des workspaces")
        print("   • GET  /_api/v3/ws/{name}/vulns       - Vulnérabilités d'un workspace")
        print("   • POST /_api/v3/ws/{name}/vulns       - Créer une vulnérabilité")
        print("   • PUT  /_api/v3/ws/{name}/vulns/{id}  - Modifier une vulnérabilité")
        print("   • DELETE /_api/v3/ws/{name}/vulns/{id} - Supprimer une vulnérabilité")
        print("\n🔄 Proxy en écoute...")
        
        server.serve_forever()
        
    except KeyboardInterrupt:
        print("\n🛑 Arrêt du proxy...")
        server.shutdown()
        
    except Exception as e:
        print(f"❌ Erreur lors du démarrage: {e}")

if __name__ == '__main__':
    main()
