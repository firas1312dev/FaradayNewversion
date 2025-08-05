#!/usr/bin/env python3
"""
Proxy CORS pour Faraday avec projets statiques
Permet d'accéder à l'API Faraday depuis un navigateur web en contournant les restrictions CORS
Inclut des projets statiques de démonstration
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.parse
import json
import base64
from urllib.error import HTTPError, URLError
import logging
import random
from datetime import datetime, timedelta

# Configuration
FARADAY_URL = "http://localhost:5985"
PROXY_PORT = 8082

# Configuration du logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Projets statiques de démonstration
STATIC_WORKSPACES = [
    {
        "id": 1,
        "name": "E-commerce Security Assessment",
        "description": "Audit de sécurité d'une plateforme e-commerce",
        "customer": "TechCorp Ltd",
        "start_date": "2024-01-15",
        "end_date": "2024-03-15",
        "scope": ["Web Application", "Network Infrastructure", "Mobile API"],
        "stats": {
            "hosts": 15,
            "services": 42,
            "vulns": 28,
            "confirmed_vulns": 12,
            "false_positive_vulns": 3,
            "open_vulns": 25
        }
    },
    {
        "id": 2,
        "name": "Banking Mobile App Pentest",
        "description": "Test d'intrusion sur application mobile bancaire",
        "customer": "SecureBank SA",
        "start_date": "2024-02-01",
        "end_date": "2024-02-28",
        "scope": ["Mobile Application", "REST API", "Authentication"],
        "stats": {
            "hosts": 8,
            "services": 23,
            "vulns": 15,
            "confirmed_vulns": 8,
            "false_positive_vulns": 1,
            "open_vulns": 14
        }
    },
    {
        "id": 3,
        "name": "Cloud Infrastructure Review",
        "description": "Revue de sécurité infrastructure cloud AWS",
        "customer": "CloudTech Solutions",
        "start_date": "2024-03-01",
        "end_date": "2024-04-15",
        "scope": ["AWS Infrastructure", "Container Security", "IAM Policies"],
        "stats": {
            "hosts": 32,
            "services": 67,
            "vulns": 41,
            "confirmed_vulns": 18,
            "false_positive_vulns": 5,
            "open_vulns": 36
        }
    },
    {
        "id": 4,
        "name": "IoT Device Security Testing",
        "description": "Évaluation de sécurité dispositifs IoT industriels",
        "customer": "IndustrialTech Corp",
        "start_date": "2024-03-15",
        "end_date": "2024-05-15",
        "scope": ["IoT Devices", "Firmware Analysis", "Network Protocols"],
        "stats": {
            "hosts": 25,
            "services": 34,
            "vulns": 33,
            "confirmed_vulns": 15,
            "false_positive_vulns": 2,
            "open_vulns": 31
        }
    },
    {
        "id": 5,
        "name": "Healthcare System Audit",
        "description": "Audit de sécurité système de gestion hospitalière",
        "customer": "MedSecure Hospital",
        "start_date": "2024-04-01",
        "end_date": "2024-06-30",
        "scope": ["Web Portal", "Database Security", "Medical Devices"],
        "stats": {
            "hosts": 18,
            "services": 45,
            "vulns": 22,
            "confirmed_vulns": 10,
            "false_positive_vulns": 2,
            "open_vulns": 20
        }
    }
]

# Vulnérabilités statiques par projet
STATIC_VULNERABILITIES = {
    1: [  # E-commerce Security Assessment
        {
            "id": 101,
            "name": "SQL Injection in Product Search",
            "severity": "high",
            "status": "open",
            "description": "Injection SQL dans la fonction de recherche de produits permettant l'extraction de données",
            "target": "shop.example.com",
            "service": "Web Application",
            "port": 443,
            "protocol": "HTTPS",
            "cvss": 8.1,
            "cwe": "CWE-89",
            "created": "2024-01-20T10:30:00Z"
        },
        {
            "id": 102,
            "name": "Cross-Site Scripting (XSS) in Comments",
            "severity": "medium",
            "status": "open",
            "description": "XSS stocké dans les commentaires de produits",
            "target": "shop.example.com",
            "service": "Web Application",
            "port": 443,
            "protocol": "HTTPS",
            "cvss": 6.1,
            "cwe": "CWE-79",
            "created": "2024-01-22T14:15:00Z"
        },
        {
            "id": 103,
            "name": "Weak Password Policy",
            "severity": "medium",
            "status": "confirmed",
            "description": "Politique de mots de passe faible permettant des mots de passe simples",
            "target": "shop.example.com",
            "service": "Authentication",
            "port": 443,
            "protocol": "HTTPS",
            "cvss": 5.3,
            "cwe": "CWE-521",
            "created": "2024-01-25T09:45:00Z"
        }
    ],
    2: [  # Banking Mobile App Pentest
        {
            "id": 201,
            "name": "Insecure Data Storage",
            "severity": "high",
            "status": "open",
            "description": "Stockage de données sensibles en clair dans le cache de l'application",
            "target": "mobile.securebank.com",
            "service": "Mobile API",
            "port": 443,
            "protocol": "HTTPS",
            "cvss": 7.5,
            "cwe": "CWE-312",
            "created": "2024-02-05T11:20:00Z"
        },
        {
            "id": 202,
            "name": "Weak Certificate Pinning",
            "severity": "medium",
            "status": "open",
            "description": "Épinglage de certificat faible permettant les attaques man-in-the-middle",
            "target": "api.securebank.com",
            "service": "REST API",
            "port": 443,
            "protocol": "HTTPS",
            "cvss": 6.8,
            "cwe": "CWE-295",
            "created": "2024-02-08T16:30:00Z"
        }
    ],
    3: [  # Cloud Infrastructure Review
        {
            "id": 301,
            "name": "S3 Bucket Public Read Access",
            "severity": "critical",
            "status": "open",
            "description": "Bucket S3 avec accès en lecture public contenant des données sensibles",
            "target": "backup-data.s3.amazonaws.com",
            "service": "AWS S3",
            "port": 443,
            "protocol": "HTTPS",
            "cvss": 9.1,
            "cwe": "CWE-732",
            "created": "2024-03-10T08:15:00Z"
        },
        {
            "id": 302,
            "name": "Overprivileged IAM Role",
            "severity": "high",
            "status": "confirmed",
            "description": "Rôle IAM avec des permissions excessives sur plusieurs services AWS",
            "target": "arn:aws:iam::123456789:role/AppRole",
            "service": "AWS IAM",
            "port": 443,
            "protocol": "HTTPS",
            "cvss": 7.8,
            "cwe": "CWE-269",
            "created": "2024-03-12T13:45:00Z"
        }
    ],
    4: [  # IoT Device Security Testing
        {
            "id": 401,
            "name": "Default Credentials on IoT Device",
            "severity": "critical",
            "status": "open",
            "description": "Dispositif IoT utilisant les identifiants par défaut admin/admin",
            "target": "192.168.1.100",
            "service": "Web Management",
            "port": 80,
            "protocol": "HTTP",
            "cvss": 9.8,
            "cwe": "CWE-798",
            "created": "2024-03-20T12:00:00Z"
        },
        {
            "id": 402,
            "name": "Unencrypted Communication",
            "severity": "high",
            "status": "open",
            "description": "Communication non chiffrée entre dispositifs IoT",
            "target": "192.168.1.0/24",
            "service": "IoT Protocol",
            "port": 1883,
            "protocol": "MQTT",
            "cvss": 8.2,
            "cwe": "CWE-319",
            "created": "2024-03-22T15:30:00Z"
        }
    ],
    5: [  # Healthcare System Audit
        {
            "id": 501,
            "name": "PHI Data Exposure",
            "severity": "critical",
            "status": "open",
            "description": "Exposition de données PHI via une API non sécurisée",
            "target": "api.medsecure.com",
            "service": "Medical API",
            "port": 443,
            "protocol": "HTTPS",
            "cvss": 9.3,
            "cwe": "CWE-200",
            "created": "2024-04-10T09:20:00Z"
        },
        {
            "id": 502,
            "name": "Weak Session Management",
            "severity": "medium",
            "status": "confirmed",
            "description": "Gestion de session faible avec des tokens prévisibles",
            "target": "portal.medsecure.com",
            "service": "Web Portal",
            "port": 443,
            "protocol": "HTTPS",
            "cvss": 6.5,
            "cwe": "CWE-384",
            "created": "2024-04-15T14:10:00Z"
        }
    ]
}

class CORSProxyHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Gérer les requêtes preflight CORS"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Gérer les requêtes GET"""
        # Route de santé pour tester la connectivité
        if self.path == '/health':
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {
                'status': 'ok', 
                'proxy_version': '2.0', 
                'faraday_url': FARADAY_URL,
                'message': 'Proxy CORS opérationnel avec projets statiques'
            }
            self.wfile.write(json.dumps(response).encode())
            return
        
        # Route pour les workspaces/projets
        if self.path == '/_api/v3/ws' or self.path == '/_api/v3/workspaces':
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(STATIC_WORKSPACES).encode())
            return
        
        # Route pour les vulnérabilités d'un workspace spécifique
        if self.path.startswith('/_api/v3/ws/') and '/vulns' in self.path:
            # Extraire l'ID du workspace
            parts = self.path.split('/')
            try:
                ws_id = int(parts[4])  # /_api/v3/ws/{id}/vulns
                vulns = STATIC_VULNERABILITIES.get(ws_id, [])
                self.send_response(200)
                self.send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(vulns).encode())
                return
            except (ValueError, IndexError):
                pass
        
        # Route pour info de l'API
        if self.path == '/_api/v3/info':
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            info = {
                'Faraday Server': 'Demo Mode',
                'Version': '5.0.0-static',
                'API': '3.0',
                'Status': 'Running with static data'
            }
            self.wfile.write(json.dumps(info).encode())
            return
        
        # Pour toutes les autres routes, essayer de contacter Faraday réel
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
        """Envoyer les en-têtes CORS"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Credentials', 'true')
    
    def proxy_request(self):
        """Proxy de la requête vers Faraday (si disponible)"""
        try:
            # Construction de l'URL complète
            target_url = FARADAY_URL + self.path
            logging.info(f"Proxying {self.command} request to: {target_url}")
            
            # Préparation des headers
            headers = {}
            
            # Copier les headers de la requête (sauf Host)
            for header_name, header_value in self.headers.items():
                if header_name.lower() not in ['host', 'connection']:
                    headers[header_name] = header_value
            
            # Ajouter l'authentification Basic (faraday:faraday par défaut)
            auth_string = base64.b64encode(b'faraday:faraday').decode('ascii')
            headers['Authorization'] = f'Basic {auth_string}'
            
            # Lire le body pour POST/PUT
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else None
            
            # Créer la requête
            req = urllib.request.Request(target_url, data=body, headers=headers, method=self.command)
            
            # Exécuter la requête
            with urllib.request.urlopen(req, timeout=10) as response:
                # Lire la réponse
                response_data = response.read()
                
                # Envoyer la réponse
                self.send_response(response.status)
                self.send_cors_headers()
                
                # Copier les headers de réponse
                for header_name, header_value in response.headers.items():
                    if header_name.lower() not in ['connection', 'transfer-encoding']:
                        self.send_header(header_name, header_value)
                
                self.end_headers()
                
                # Envoyer le contenu
                if response_data:
                    self.wfile.write(response_data)
                    
                logging.info(f"Successfully proxied request - Status: {response.status}")
                
        except Exception as e:
            logging.warning(f"Could not connect to Faraday, using static data: {e}")
            # Si Faraday n'est pas disponible, retourner une réponse vide JSON
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps([]).encode())

def main():
    """Fonction principale"""
    server_address = ('localhost', PROXY_PORT)
    httpd = HTTPServer(server_address, CORSProxyHandler)
    
    print(f"🚀 Proxy CORS Faraday démarré sur http://localhost:{PROXY_PORT}")
    print(f"📡 Redirections vers Faraday: {FARADAY_URL}")
    print(f"📊 {len(STATIC_WORKSPACES)} projets statiques disponibles")
    print(f"🔍 {sum(len(vulns) for vulns in STATIC_VULNERABILITIES.values())} vulnérabilités de démonstration")
    print("✋ Appuyez sur Ctrl+C pour arrêter")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Arrêt du proxy...")
        httpd.shutdown()

if __name__ == "__main__":
    main()
