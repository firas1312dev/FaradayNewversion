#!/usr/bin/env python3
"""
🚀 Démarrage Complet Projet Faraday
Gère Docker + Proxy + Interface Web
"""

import socket
import subprocess
import time
import os
import sys
import requests

def print_step(step, description):
    print(f"\n{'='*50}")
    print(f"🔄 ÉTAPE {step}: {description}")
    print(f"{'='*50}")

def check_port_ipv4_ipv6(port):
    """Vérifie le port sur IPv4 ET IPv6"""
    ipv4_ok = False
    ipv6_ok = False
    
    # Test IPv4
    try:
        sock4 = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock4.settimeout(2)
        result4 = sock4.connect_ex(('127.0.0.1', port))
        sock4.close()
        ipv4_ok = (result4 == 0)
    except:
        pass
    
    # Test IPv6
    try:
        sock6 = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
        sock6.settimeout(2)
        result6 = sock6.connect_ex(('::1', port))
        sock6.close()
        ipv6_ok = (result6 == 0)
    except:
        pass
    
    return ipv4_ok or ipv6_ok

def check_docker():
    """Vérifie si Docker est disponible"""
    try:
        result = subprocess.run(['docker', '--version'], 
                              capture_output=True, text=True, timeout=10)
        return result.returncode == 0
    except:
        return False

def start_faraday_docker():
    """Démarre Faraday avec Docker"""
    print("🐳 Démarrage Faraday avec Docker...")
    
    # Aller dans le dossier parent
    original_dir = os.getcwd()
    parent_dir = os.path.dirname(os.getcwd())
    
    try:
        os.chdir(parent_dir)
        
        # Arrêter les conteneurs existants
        print("   🛑 Arrêt des conteneurs existants...")
        subprocess.run(['docker-compose', 'down'], 
                      capture_output=True, timeout=30)
        
        # Démarrer les conteneurs
        print("   🚀 Démarrage des conteneurs...")
        result = subprocess.run(['docker-compose', 'up', '-d'], 
                              capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0:
            print("   ✅ Conteneurs démarrés")
            return True
        else:
            print(f"   ❌ Erreur Docker: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        return False
    finally:
        os.chdir(original_dir)

def wait_for_faraday():
    """Attend que Faraday soit prêt"""
    print("⏳ Attente de Faraday...")
    
    for attempt in range(30):  # 30 secondes max
        if check_port_ipv4_ipv6(5985):
            print("   🔌 Port 5985 ouvert")
            
            # Test API
            try:
                response = requests.get(
                    "http://localhost:5985/_api/v3/info",
                    auth=("faraday", "faraday"),
                    timeout=5
                )
                if response.status_code == 200:
                    print("   ✅ API Faraday opérationnelle")
                    return True
            except:
                pass
        
        print(f"   ⏳ Tentative {attempt + 1}/30...")
        time.sleep(1)
    
    print("   ❌ Timeout - Faraday non accessible")
    return False

def start_proxy():
    """Démarre le proxy CORS"""
    print("🔗 Démarrage du proxy CORS...")
    
    if check_port_ipv4_ipv6(8082):
        print("   ✅ Proxy déjà en cours")
        return True
    
    try:
        if os.name == 'nt':  # Windows
            subprocess.Popen([
                "cmd", "/c", "start", "cmd", "/k", 
                "python cors-proxy-enhanced.py"
            ])
        else:  # Linux/Mac
            subprocess.Popen(["python", "cors-proxy-enhanced.py"])
        
        # Attendre le démarrage
        for attempt in range(10):
            time.sleep(1)
            if check_port_ipv4_ipv6(8082):
                print("   ✅ Proxy CORS démarré")
                return True
            print(f"   ⏳ Attente {attempt + 1}/10...")
        
        print("   ❌ Timeout proxy")
        return False
        
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        return False

def start_web_server():
    """Démarre le serveur web"""
    print("🌐 Démarrage du serveur web...")
    
    if check_port_ipv4_ipv6(8888):
        print("   ✅ Serveur web déjà en cours")
        return True
    
    try:
        if os.name == 'nt':  # Windows
            subprocess.Popen([
                "cmd", "/c", "start", "cmd", "/k", 
                "python -m http.server 8888"
            ])
        else:  # Linux/Mac
            subprocess.Popen(["python", "-m", "http.server", "8888"])
        
        # Attendre le démarrage
        for attempt in range(10):
            time.sleep(1)
            if check_port_ipv4_ipv6(8888):
                print("   ✅ Serveur web démarré")
                return True
            print(f"   ⏳ Attente {attempt + 1}/10...")
        
        print("   ❌ Timeout serveur web")
        return False
        
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        return False

def open_interface():
    """Ouvre l'interface dans le navigateur"""
    print("🌍 Ouverture de l'interface...")
    
    try:
        if os.name == 'nt':
            os.system("start http://localhost:8888/index-new.html")
        else:
            os.system("xdg-open http://localhost:8888/index-new.html")
        print("   ✅ Interface ouverte")
    except:
        print("   ⚠️ Ouverture manuelle requise: http://localhost:8888/index-new.html")

def main():
    print("🚀 DÉMARRAGE COMPLET PROJET FARADAY")
    print("=" * 60)
    
    # Étape 1: Vérifier Docker
    print_step(1, "Vérification Docker")
    if not check_docker():
        print("❌ Docker non disponible")
        print("💡 Installez Docker Desktop ou utilisez restart_faraday.py")
        return False
    print("✅ Docker disponible")
    
    # Étape 2: Démarrer Faraday
    print_step(2, "Démarrage Faraday Server")
    if not check_port_ipv4_ipv6(5985):
        if not start_faraday_docker():
            print("❌ Échec démarrage Faraday")
            return False
    else:
        print("✅ Faraday déjà en cours")
    
    # Étape 3: Attendre Faraday
    print_step(3, "Vérification API Faraday")
    if not wait_for_faraday():
        print("❌ API Faraday non accessible")
        return False
    
    # Étape 4: Démarrer Proxy
    print_step(4, "Démarrage Proxy CORS")
    if not start_proxy():
        print("❌ Échec démarrage proxy")
        return False
    
    # Étape 5: Démarrer Serveur Web
    print_step(5, "Démarrage Serveur Web")
    if not start_web_server():
        print("❌ Échec démarrage serveur web")
        return False
    
    # Étape 6: Ouvrir Interface
    print_step(6, "Ouverture Interface")
    open_interface()
    
    # Résumé final
    print("\n" + "=" * 60)
    print("🎉 PROJET FARADAY DÉMARRÉ AVEC SUCCÈS!")
    print("=" * 60)
    
    services = [
        ("Faraday Server", 5985, "http://localhost:5985"),
        ("Proxy CORS", 8082, "http://localhost:8082"),
        ("Interface Web", 8888, "http://localhost:8888/index-new.html")
    ]
    
    for name, port, url in services:
        status = "✅ OK" if check_port_ipv4_ipv6(port) else "❌ KO"
        print(f"{name:15}: {status} - {url}")
    
    print("\n🌟 Interface accessible: http://localhost:8888/index-new.html")
    return True

if __name__ == "__main__":
    try:
        success = main()
        if not success:
            print("\n⚠️ PROBLÈMES DÉTECTÉS")
            print("🔧 Consultez les messages d'erreur ci-dessus")
    except KeyboardInterrupt:
        print("\n🛑 Arrêt demandé par l'utilisateur")
    except Exception as e:
        print(f"\n❌ Erreur inattendue: {e}")
    
    input("\nAppuyez sur Entrée pour continuer...")
