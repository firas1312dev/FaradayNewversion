#!/usr/bin/env python3
"""
🩺 Diagnostic Simple Faraday
Vérifie et corrige les problèmes les plus courants
"""

import socket
import subprocess
import time
import os
import sys

def check_port(port):
    """Vérifie si un port est ouvert"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0
    except:
        return False

def start_proxy():
    """Démarre le proxy CORS"""
    print("🔄 Démarrage du proxy CORS...")
    try:
        if os.name == 'nt':  # Windows
            subprocess.Popen([
                "cmd", "/c", "start", "cmd", "/k", 
                "python cors-proxy-enhanced.py"
            ])
        else:  # Linux/Mac
            subprocess.Popen([
                "python", "cors-proxy-enhanced.py"
            ])
        return True
    except Exception as e:
        print(f"❌ Erreur démarrage proxy: {e}")
        return False

def start_web_server():
    """Démarre le serveur web"""
    print("🔄 Démarrage du serveur web...")
    try:
        if os.name == 'nt':  # Windows
            subprocess.Popen([
                "cmd", "/c", "start", "cmd", "/k", 
                "python -m http.server 8888"
            ])
        else:  # Linux/Mac
            subprocess.Popen([
                "python", "-m", "http.server", "8888"
            ])
        return True
    except Exception as e:
        print(f"❌ Erreur démarrage serveur web: {e}")
        return False

def main():
    print("🩺 DIAGNOSTIC SIMPLE FARADAY")
    print("=" * 40)
    
    # Vérifier Faraday Server
    print("1️⃣ Vérification Serveur Faraday...")
    if check_port(5985):
        print("   ✅ Serveur Faraday en cours d'exécution")
    else:
        print("   ❌ Serveur Faraday arrêté")
        print("   💡 Démarrez-le avec: python restart_faraday.py")
        print("   💡 Ou utilisez Docker: docker-compose up -d")
        return
    
    # Vérifier Proxy CORS
    print("\n2️⃣ Vérification Proxy CORS...")
    if check_port(8082):
        print("   ✅ Proxy CORS en cours d'exécution")
    else:
        print("   ❌ Proxy CORS arrêté")
        print("   🔄 Démarrage automatique...")
        if start_proxy():
            print("   ⏳ Attente démarrage...")
            time.sleep(3)
            if check_port(8082):
                print("   ✅ Proxy CORS démarré")
            else:
                print("   ❌ Échec démarrage proxy")
                return
    
    # Vérifier Serveur Web
    print("\n3️⃣ Vérification Serveur Web...")
    if check_port(8888):
        print("   ✅ Serveur Web en cours d'exécution")
    else:
        print("   ❌ Serveur Web arrêté")
        print("   🔄 Démarrage automatique...")
        if start_web_server():
            print("   ⏳ Attente démarrage...")
            time.sleep(3)
            if check_port(8888):
                print("   ✅ Serveur Web démarré")
            else:
                print("   ❌ Échec démarrage serveur web")
                return
    
    # Résumé
    print("\n🎉 DIAGNOSTIC TERMINÉ")
    print("=" * 40)
    
    services = [
        ("Faraday Server", 5985, "http://localhost:5985"),
        ("Proxy CORS", 8082, "http://localhost:8082"),
        ("Interface Web", 8888, "http://localhost:8888/index-new.html")
    ]
    
    all_ok = True
    for name, port, url in services:
        status = "✅ OK" if check_port(port) else "❌ KO"
        print(f"{name:15}: {status} - {url}")
        if not check_port(port):
            all_ok = False
    
    if all_ok:
        print("\n🚀 TOUS LES SERVICES SONT OPÉRATIONNELS!")
        print("🌐 Interface accessible: http://localhost:8888/index-new.html")
        
        # Ouvrir l'interface
        try:
            if os.name == 'nt':
                os.system("start http://localhost:8888/index-new.html")
            else:
                os.system("xdg-open http://localhost:8888/index-new.html")
        except:
            pass
    else:
        print("\n⚠️ CERTAINS SERVICES ONT DES PROBLÈMES")
        print("🔧 Utilisez start-all-services.bat pour un démarrage manuel")

if __name__ == "__main__":
    main()
    input("\nAppuyez sur Entrée pour continuer...")
