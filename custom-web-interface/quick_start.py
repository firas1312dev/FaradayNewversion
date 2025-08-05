#!/usr/bin/env python3
"""
🚀 Démarrage Rapide Interface Faraday
Démarre uniquement le proxy et l'interface (Faraday doit déjà tourner)
"""

import socket
import subprocess
import time
import os

def check_port_any(port):
    """Vérifie le port sur IPv4 OU IPv6"""
    # Test IPv4
    try:
        sock4 = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock4.settimeout(2)
        result4 = sock4.connect_ex(('127.0.0.1', port))
        sock4.close()
        if result4 == 0:
            return True
    except:
        pass
    
    # Test IPv6
    try:
        sock6 = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
        sock6.settimeout(2)
        result6 = sock6.connect_ex(('::1', port))
        sock6.close()
        if result6 == 0:
            return True
    except:
        pass
    
    return False

def main():
    print("🚀 DÉMARRAGE RAPIDE INTERFACE FARADAY")
    print("=" * 50)
    
    # Vérifier Faraday
    print("1️⃣ Vérification Serveur Faraday...")
    if check_port_any(5985):
        print("   ✅ Serveur Faraday détecté")
    else:
        print("   ❌ Serveur Faraday non trouvé")
        print("   💡 Démarrez d'abord Faraday (Docker ou Python)")
        input("   Appuyez sur Entrée après avoir démarré Faraday...")
        if not check_port_any(5985):
            print("   ❌ Toujours pas accessible, abandon.")
            return
    
    # Démarrer proxy
    print("\n2️⃣ Démarrage Proxy CORS...")
    if check_port_any(8082):
        print("   ✅ Proxy déjà en cours")
    else:
        print("   🔄 Démarrage du proxy...")
        subprocess.Popen([
            "cmd", "/c", "start", "cmd", "/k", 
            "python cors-proxy-enhanced.py"
        ])
        
        # Attendre
        for i in range(10):
            time.sleep(1)
            if check_port_any(8082):
                print("   ✅ Proxy démarré")
                break
            print(f"   ⏳ Attente {i+1}/10...")
        else:
            print("   ❌ Échec démarrage proxy")
            return
    
    # Démarrer serveur web
    print("\n3️⃣ Démarrage Serveur Web...")
    if check_port_any(8888):
        print("   ✅ Serveur web déjà en cours")
    else:
        print("   🔄 Démarrage du serveur web...")
        subprocess.Popen([
            "cmd", "/c", "start", "cmd", "/k", 
            "python -m http.server 8888"
        ])
        
        # Attendre
        for i in range(10):
            time.sleep(1)
            if check_port_any(8888):
                print("   ✅ Serveur web démarré")
                break
            print(f"   ⏳ Attente {i+1}/10...")
        else:
            print("   ❌ Échec démarrage serveur web")
            return
    
    # Ouvrir interface
    print("\n4️⃣ Ouverture Interface...")
    time.sleep(2)
    os.system("start http://localhost:8888/index-new.html")
    print("   ✅ Interface ouverte dans le navigateur")
    
    # Résumé
    print("\n" + "=" * 50)
    print("🎉 INTERFACE FARADAY PRÊTE !")
    print("=" * 50)
    print("📊 Faraday Server : http://localhost:5985")
    print("🔗 Proxy CORS    : http://localhost:8082") 
    print("🌐 Interface Web : http://localhost:8888/index-new.html")
    print("\n💡 L'interface devrait maintenant se connecter automatiquement !")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n🛑 Arrêt demandé")
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
    
    input("\nAppuyez sur Entrée pour continuer...")
