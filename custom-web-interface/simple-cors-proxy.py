#!/usr/bin/env python3
"""
Proxy CORS Simple pour Faraday
Version corrigée avec gestion d'erreurs robuste
"""

import http.server
import socketserver
import urllib.request
import urllib.parse
import json
import sys
from urllib.error import URLError, HTTPError

class SimpleCORSHandler(http.server.BaseHTTPRequestHandler):
    
    def log_message(self, format, *args):
        """Logs avec timestamp"""
        print(f"[PROXY] {format % args}")
    
    def send_cors_headers(self):
        """Envoyer headers CORS essentiels"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    def do_OPTIONS(self):
        """Gérer preflight CORS"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Proxy GET requests"""
        self.proxy_request('GET')
    
    def do_POST(self):
        """Proxy POST requests"""
        self.proxy_request('POST')
    
    def do_PUT(self):
        """Proxy PUT requests"""
        self.proxy_request('PUT')
    
    def do_DELETE(self):
        """Proxy DELETE requests"""
        self.proxy_request('DELETE')
    
    def proxy_request(self, method):
        """Proxifier la requête vers Faraday"""
        try:
            # Construire l'URL cible
            faraday_url = f"http://localhost:5985{self.path}"
            print(f"[PROXY] {method} {self.path} -> {faraday_url}")
            
            # Préparer les headers
            headers = {}
            if 'Authorization' in self.headers:
                headers['Authorization'] = self.headers['Authorization']
            if 'Content-Type' in self.headers:
                headers['Content-Type'] = self.headers['Content-Type']
            
            # Lire le body si présent
            data = None
            if method in ['POST', 'PUT'] and 'Content-Length' in self.headers:
                try:
                    content_length = int(self.headers['Content-Length'])
                    data = self.rfile.read(content_length)
                    print(f"[PROXY] Body: {len(data)} bytes")
                except:
                    print("[PROXY] Erreur lecture body")
            
            # Faire la requête vers Faraday
            req = urllib.request.Request(faraday_url, data=data, headers=headers, method=method)
            
            with urllib.request.urlopen(req, timeout=30) as response:
                # Envoyer la réponse
                self.send_response(response.getcode())
                self.send_cors_headers()
                
                # Copier les headers de réponse importants
                for header, value in response.headers.items():
                    if header.lower() not in ['connection', 'transfer-encoding']:
                        self.send_header(header, value)
                
                self.end_headers()
                
                # Copier le contenu
                content = response.read()
                self.wfile.write(content)
                
                print(f"[PROXY] ✅ Succès: {response.getcode()} ({len(content)} bytes)")
                
                # Debug: afficher le contenu si c'est petit
                if len(content) < 200:
                    try:
                        content_str = content.decode('utf-8')
                        print(f"[PROXY] Content: {content_str}")
                    except:
                        pass
        
        except HTTPError as e:
            print(f"[PROXY] ❌ HTTP Error: {e.code} {e.reason}")
            self.send_error_response(e.code, f"HTTP {e.code}: {e.reason}")
            
        except URLError as e:
            print(f"[PROXY] ❌ URL Error: {e.reason}")
            self.send_error_response(502, f"Connection failed: {e.reason}")
            
        except Exception as e:
            print(f"[PROXY] ❌ Unexpected error: {e}")
            self.send_error_response(500, f"Internal error: {str(e)}")
    
    def send_error_response(self, code, message):
        """Envoyer une réponse d'erreur JSON"""
        try:
            self.send_response(code)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            error_data = {
                'error': message,
                'code': code
            }
            error_json = json.dumps(error_data).encode('utf-8')
            self.wfile.write(error_json)
        except:
            pass

def main():
    PORT = 8082
    
    print("🚀 Démarrage du proxy CORS simple pour Faraday")
    print(f"📡 Port: {PORT}")
    print(f"🎯 Target: http://localhost:5985")
    print("-" * 50)
    
    try:
        with socketserver.TCPServer(("", PORT), SimpleCORSHandler) as httpd:
            print(f"✅ Proxy démarré sur http://localhost:{PORT}")
            print("🔄 Prêt à recevoir les requêtes...")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Arrêt du proxy")
    except Exception as e:
        print(f"❌ Erreur démarrage: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
