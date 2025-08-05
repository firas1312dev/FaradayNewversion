#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔧 Script de Diagnostic et Redémarrage Faraday
Diagnostique les problèmes et redémarre tous les services
"""

import os
import sys
import time
import signal
import socket
import subprocess
import psutil
import requests
from pathlib import Path

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🔧 {title}")
    print(f"{'='*60}")

def print_step(step_num, description):
    print(f"\n📍 Étape {step_num}: {description}...")

def check_port(port, host='localhost'):
    """Vérifier si un port est ouvert"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except:
        return False

def kill_processes_on_port(port):
    """Tuer tous les processus utilisant un port spécifique"""
    killed = 0
    for proc in psutil.process_iter(['pid', 'name', 'connections']):
        try:
            for conn in proc.info['connections'] or []:
                if conn.laddr.port == port:
                    print(f"   🔴 Arrêt du processus {proc.info['name']} (PID: {proc.info['pid']})")
                    proc.kill()
                    killed += 1
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return killed

def test_faraday_api():
    """Tester la connectivité de l'API Faraday"""
    try:
        auth = ('faraday', 'faraday')
        response = requests.get('http://localhost:5985/_api/v3/info', 
                              auth=auth, timeout=5)
        return response.status_code == 200
    except:
        return False

def main():
    print_header("DIAGNOSTIC ET REDÉMARRAGE FARADAY SERVER")
    
    # Étape 1: Diagnostic des ports
    print_step(1, "Diagnostic des ports")
    ports = {5985: "Faraday Server", 8082: "Proxy CORS", 8888: "Serveur Web"}
    
    for port, service in ports.items():
        is_open = check_port(port)
        status = "🟢 OUVERT" if is_open else "🔴 FERMÉ"
        print(f"   Port {port} ({service}): {status}")
    
    # Étape 2: Arrêt des processus sur les ports
    print_step(2, "Nettoyage des ports")
    for port in ports.keys():
        if check_port(port):
            killed = kill_processes_on_port(port)
            if killed > 0:
                print(f"   ✅ {killed} processus arrêtés sur le port {port}")
    
    # Attente pour le nettoyage
    print("   ⏳ Attente de 3 secondes pour le nettoyage...")
    time.sleep(3)
    
    # Étape 3: Vérification des dossiers
    print_step(3, "Vérification des dossiers")
    
    faraday_root = Path("C:/Users/LENOVO/OneDrive/Bureau/faraday/faraday")
    web_interface = Path("C:/Users/LENOVO/OneDrive/Bureau/faraday/faraday/custom-web-interface")
    
    if not faraday_root.exists():
        print(f"   ❌ Dossier Faraday non trouvé: {faraday_root}")
        return False
    
    if not web_interface.exists():
        print(f"   ❌ Dossier interface web non trouvé: {web_interface}")
        return False
    
    print(f"   ✅ Dossier Faraday: {faraday_root}")
    print(f"   ✅ Dossier interface: {web_interface}")
    
    # Étape 4: Démarrage de Faraday Server
    print_step(4, "Démarrage du serveur Faraday")
    os.chdir(faraday_root)
    
    try:
        # Tentative avec manage.py
        cmd = [sys.executable, "manage.py", "runserver", 
               "--host", "0.0.0.0", "--port", "5985"]
        
        print(f"   🚀 Commande: {' '.join(cmd)}")
        
        # Démarrer dans un nouveau processus
        if os.name == 'nt':  # Windows
            subprocess.Popen(cmd, creationflags=subprocess.CREATE_NEW_CONSOLE)
        else:
            subprocess.Popen(cmd)
        
        print("   ⏳ Attente de 10 secondes pour le démarrage...")
        time.sleep(10)
        
        # Test de connectivité
        if check_port(5985):
            print("   ✅ Serveur Faraday démarré !")
            
            # Test API
            if test_faraday_api():
                print("   ✅ API Faraday fonctionnelle !")
            else:
                print("   ⚠️ Port ouvert mais API non accessible")
        else:
            print("   ❌ Échec du démarrage du serveur Faraday")
            return False
            
    except Exception as e:
        print(f"   ❌ Erreur lors du démarrage: {e}")
        return False
    
    # Étape 5: Démarrage du proxy CORS
    print_step(5, "Démarrage du proxy CORS")
    os.chdir(web_interface)
    
    if (web_interface / "cors-proxy-enhanced.py").exists():
        cmd = [sys.executable, "cors-proxy-enhanced.py"]
        print(f"   🚀 Commande: {' '.join(cmd)}")
        
        if os.name == 'nt':
            subprocess.Popen(cmd, creationflags=subprocess.CREATE_NEW_CONSOLE)
        else:
            subprocess.Popen(cmd)
        
        time.sleep(3)
        
        if check_port(8082):
            print("   ✅ Proxy CORS démarré !")
        else:
            print("   ⚠️ Problème avec le proxy CORS")
    else:
        print("   ❌ Fichier cors-proxy-enhanced.py non trouvé")
    
    # Étape 6: Démarrage du serveur web
    print_step(6, "Démarrage du serveur web")
    
    cmd = [sys.executable, "-m", "http.server", "8888"]
    print(f"   🚀 Commande: {' '.join(cmd)}")
    
    if os.name == 'nt':
        subprocess.Popen(cmd, creationflags=subprocess.CREATE_NEW_CONSOLE)
    else:
        subprocess.Popen(cmd)
    
    time.sleep(2)
    
    if check_port(8888):
        print("   ✅ Serveur web démarré !")
    else:
        print("   ⚠️ Problème avec le serveur web")
    
    # Étape 7: Ouverture de l'interface
    print_step(7, "Ouverture de l'interface")
    
    interface_url = "http://localhost:8888/index-new.html"
    
    try:
        if os.name == 'nt':
            os.system(f'start {interface_url}')
        elif os.name == 'posix':
            os.system(f'open {interface_url}')  # macOS
        else:
            os.system(f'xdg-open {interface_url}')  # Linux
        
        print(f"   ✅ Interface ouverte: {interface_url}")
    except:
        print(f"   ⚠️ Ouverture manuelle requise: {interface_url}")
    
    # Résumé final
    print_header("RÉSUMÉ DU DÉMARRAGE")
    
    services_status = [
        ("Faraday Server", 5985, "http://localhost:5985"),
        ("Proxy CORS", 8082, "http://localhost:8082"),
        ("Interface Web", 8888, "http://localhost:8888/index-new.html")
    ]
    
    all_ok = True
    for service, port, url in services_status:
        status = "✅ OK" if check_port(port) else "❌ ERREUR"
        print(f"{service:15} (port {port}): {status} - {url}")
        if not check_port(port):
            all_ok = False
    
    if all_ok:
        print("\n🎉 TOUS LES SERVICES SONT DÉMARRÉS AVEC SUCCÈS !")
        print("📊 Vous pouvez maintenant utiliser l'interface Faraday")
    else:
        print("\n⚠️ CERTAINS SERVICES ONT DES PROBLÈMES")
        print("🔧 Vérifiez les logs dans les fenêtres de console ouvertes")
    
    return all_ok

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n🛑 Arrêt demandé par l'utilisateur")
    except Exception as e:
        print(f"\n❌ Erreur inattendue: {e}")
        import traceback
        traceback.print_exc()
    
    input("\nAppuyez sur Entrée pour continuer...")
