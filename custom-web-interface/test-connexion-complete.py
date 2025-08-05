#!/usr/bin/env python3
"""
Test de connexion rapide pour vérifier tous les services Faraday
"""

import requests
import time
import sys

def test_connection(url, name):
    """Test une URL de connexion"""
    try:
        print(f"🔍 Test de {name}: {url}")
        
        # Essayer avec authentification
        auth_headers = {
            'Authorization': 'Basic ZmFyYWRheTpmYXJhZGF5',  # faraday:faraday en base64
            'Content-Type': 'application/json'
        }
        
        response = requests.get(f"{url}/_api/v3/info", headers=auth_headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            version = data.get('faraday_version', 'Unknown')
            print(f"✅ {name} OK - Version: {version}")
            return True
        else:
            print(f"❌ {name} - Status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ {name} - Connexion refusée")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ {name} - Timeout")
        return False
    except Exception as e:
        print(f"❌ {name} - Erreur: {e}")
        return False

def main():
    print("=" * 60)
    print("🚀 TEST DE CONNEXION FARADAY - TOUS LES SERVICES")
    print("=" * 60)
    print()
    
    # Liste des services à tester
    services = [
        ("http://localhost:5985", "Serveur Faraday Direct"),
        ("http://localhost:8082", "Proxy CORS Principal"),
        ("http://localhost:8081", "Proxy CORS Amélioré"),
        ("http://localhost:8080", "Proxy CORS Simple"),
    ]
    
    working_services = []
    
    for url, name in services:
        if test_connection(url, name):
            working_services.append((url, name))
        print()
    
    print("=" * 60)
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 60)
    
    if working_services:
        print(f"✅ Services actifs: {len(working_services)}/{len(services)}")
        print()
        print("🔗 Services disponibles:")
        for url, name in working_services:
            print(f"   • {name}: {url}")
        print()
        print("🎉 L'interface web pourra se connecter !")
    else:
        print("❌ Aucun service disponible")
        print("⚠️  L'interface passera en mode hors ligne")
    
    print()
    print("💡 Pour démarrer tous les services:")
    print("   start-faraday-with-proxies.bat")
    print()

if __name__ == "__main__":
    main()
