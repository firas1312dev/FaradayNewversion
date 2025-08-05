#!/usr/bin/env python3
"""
Script de test pour vérifier la connectivité du proxy CORS et de l'API Faraday
"""

import requests
import json

# URLs de test
PROXY_URL = "http://localhost:8082"
FARADAY_DIRECT_URL = "http://localhost:5985"

def test_proxy_health():
    """Test de la route de santé du proxy"""
    print("🔍 Test de la santé du proxy...")
    try:
        response = requests.get(f"{PROXY_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Proxy opérationnel: {data}")
            return True
        else:
            print(f"❌ Proxy répond avec code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter au proxy sur localhost:8082")
        return False
    except Exception as e:
        print(f"❌ Erreur proxy: {e}")
        return False

def test_faraday_direct():
    """Test de connexion directe à Faraday"""
    print("\n🔍 Test de connexion directe à Faraday...")
    try:
        response = requests.get(f"{FARADAY_DIRECT_URL}/_api/v3/info", timeout=5)
        print(f"✅ Faraday répond avec code: {response.status_code}")
        if response.status_code == 200:
            print(f"   Info: {response.json()}")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter à Faraday sur localhost:5985")
        return False
    except Exception as e:
        print(f"❌ Erreur Faraday: {e}")
        return False

def test_proxy_api():
    """Test d'accès à l'API via le proxy"""
    print("\n🔍 Test d'accès à l'API via le proxy...")
    try:
        # Test de l'endpoint info via le proxy
        response = requests.get(f"{PROXY_URL}/_api/v3/info", timeout=5)
        print(f"Status code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type', 'Non défini')}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"✅ API accessible via proxy: {data}")
                return True
            except json.JSONDecodeError:
                print("❌ Réponse non-JSON reçue du proxy:")
                print(f"   Début de la réponse: {response.text[:200]}...")
                return False
        else:
            print(f"❌ Erreur HTTP: {response.status_code}")
            print(f"   Réponse: {response.text[:200]}...")
            return False
    except Exception as e:
        print(f"❌ Erreur proxy API: {e}")
        return False

def main():
    print("=== Test de connectivité Faraday ===\n")
    
    # Tests séquentiels
    proxy_ok = test_proxy_health()
    faraday_ok = test_faraday_direct()
    
    if proxy_ok and faraday_ok:
        test_proxy_api()
    elif not proxy_ok:
        print("\n💡 Démarrez le proxy avec: python faraday-cors-proxy.py")
    elif not faraday_ok:
        print("\n💡 Vérifiez que Faraday est démarré sur localhost:5985")
    
    print("\n=== Fin des tests ===")

if __name__ == "__main__":
    main()
