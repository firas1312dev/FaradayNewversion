#!/usr/bin/env python3
"""
🔍 Test Rapide Serveur Faraday
Vérifie rapidement l'état du serveur Faraday
"""

import socket
import requests
import subprocess
import time

def check_port(port, host='localhost'):
    """Vérifie si un port est ouvert"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except:
        return False

def test_faraday_api():
    """Teste l'API Faraday"""
    try:
        response = requests.get(
            "http://localhost:5985/_api/v3/info",
            auth=("faraday", "faraday"),
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return True, data
        else:
            return False, f"HTTP {response.status_code}"
            
    except requests.exceptions.ConnectionError:
        return False, "Connexion refusée"
    except Exception as e:
        return False, str(e)

def main():
    print("🔍 TEST RAPIDE SERVEUR FARADAY")
    print("=" * 40)
    
    # Test du port
    port_open = check_port(5985)
    print(f"Port 5985: {'✅ OUVERT' if port_open else '❌ FERMÉ'}")
    
    if not port_open:
        print("\n❌ Serveur Faraday non démarré")
        print("💡 Utilisez restart_faraday.py pour le démarrer")
        return
    
    # Test de l'API
    print("🔄 Test de l'API...")
    api_ok, result = test_faraday_api()
    
    if api_ok:
        print("✅ API Faraday opérationnelle")
        print(f"📊 Version: {result.get('version', 'N/A')}")
        print(f"📊 Faraday: {result.get('faraday_version', 'N/A')}")
        
        # Test des workspaces
        try:
            ws_response = requests.get(
                "http://localhost:5985/_api/v3/ws",
                auth=("faraday", "faraday"),
                timeout=5
            )
            if ws_response.status_code == 200:
                ws_data = ws_response.json()
                ws_count = len(ws_data.get('rows', []))
                print(f"📁 Workspaces: {ws_count}")
            else:
                print(f"⚠️ Workspaces: Erreur HTTP {ws_response.status_code}")
        except Exception as e:
            print(f"⚠️ Workspaces: {e}")
        
        print("\n🎉 SERVEUR FARADAY FONCTIONNEL")
        print("🔗 Vous pouvez utiliser l'interface web")
        
    else:
        print(f"❌ API non accessible: {result}")
        print("\n🔧 SOLUTIONS POSSIBLES:")
        print("1. Redémarrer avec restart_faraday.py")
        print("2. Vérifier les logs Faraday")
        print("3. Vérifier les credentials (faraday:faraday)")

if __name__ == "__main__":
    main()
    input("\nAppuyez sur Entrée pour continuer...")
