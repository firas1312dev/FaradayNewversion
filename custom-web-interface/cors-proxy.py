#!/usr/bin/env python3
"""
Proxy CORS pour Faraday
Ce script créé un proxy qui ajoute les headers CORS nécessaires
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import requests
import json
import base64
from urllib.parse import urlparse, parse_qs

class CORSProxyHandler(BaseHTTPRequestHandler):
    
    def add_cors_headers(self):
        """Ajouter les headers CORS"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRFToken')
        self.send_header('Access-Control-Expose-Headers', 'X-CSRFToken')
        self.send_header('Access-Control-Allow-Credentials', 'true')
    
    def do_OPTIONS(self):
        """Gérer les requêtes preflight"""
        self.send_response(200)
        self.add_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Proxifier les requêtes GET"""
        self.proxy_request('GET')
    
    def do_POST(self):
        """Proxifier les requêtes POST"""
        self.proxy_request('POST')
    
    def do_PUT(self):
        """Proxifier les requêtes PUT"""
        self.proxy_request('PUT')
    
    def do_DELETE(self):
        """Proxifier les requêtes DELETE"""
        self.proxy_request('DELETE')
    
    def do_PATCH(self):
        """Proxifier les requêtes PATCH"""
        self.proxy_request('PATCH')
    
    def proxy_request(self, method):
        """Proxifier la requête vers Faraday"""
        try:
            # URL de destination (Faraday)
            faraday_url = f"http://localhost:5985{self.path}"
            
            # Headers à transférer
            headers = {}
            for header_name, header_value in self.headers.items():
                if header_name.lower() not in ['host', 'origin']:
                    headers[header_name] = header_value
            
            # Données de la requête
            content_length = self.headers.get('Content-Length')
            data = None
            if content_length:
                data = self.rfile.read(int(content_length))
            
            print(f"🔄 Proxy {method} {faraday_url}")
            print(f"   Headers: {headers}")
            
            # Faire la requête vers Faraday
            response = requests.request(
                method=method,
                url=faraday_url,
                headers=headers,
                data=data,
                timeout=30
            )
            
            print(f"✅ Réponse: {response.status_code}")
            
            # Renvoyer la réponse avec headers CORS
            self.send_response(response.status_code)
            self.add_cors_headers()
            
            # Transférer les headers de réponse (sauf ceux qui posent problème)
            for header_name, header_value in response.headers.items():
                if header_name.lower() not in ['transfer-encoding', 'connection']:
                    self.send_header(header_name, header_value)
            
            self.end_headers()
            
            # Transférer le contenu
            if response.content:
                self.wfile.write(response.content)
            
        except Exception as e:
            print(f"❌ Erreur proxy: {e}")
            self.send_response(500)
            self.add_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({
                'error': f'Proxy error: {str(e)}'
            }).encode('utf-8')
            self.wfile.write(error_response)

def run_proxy(port=8086):
    """Démarrer le serveur proxy"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, CORSProxyHandler)
    print(f"🚀 Proxy CORS démarré sur http://localhost:{port}")
    print(f"   Proxifie vers: http://localhost:5985")
    print(f"   Pour arrêter: Ctrl+C")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Arrêt du proxy")
        httpd.shutdown()

if __name__ == '__main__':
    run_proxy()
