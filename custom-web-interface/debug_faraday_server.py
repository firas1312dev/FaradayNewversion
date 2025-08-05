#!/usr/bin/env python3
"""
🔧 Script de Diagnostic Faraday Server
Diagnostique et résout les problèmes de démarrage du serveur Faraday
"""

import os
import sys
import time
import subprocess
import socket
import requests
import psutil
from pathlib import Path

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print(f"{'='*60}")

def print_step(step, description):
    print(f"\n📋 Étape {step}: {description}")
    print("-" * 50)

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

def kill_process_on_port(port):
    """Tue le processus utilisant un port spécifique"""
    try:
        for proc in psutil.process_iter(['pid', 'name', 'connections']):
            try:
                connections = proc.info['connections']
                if connections:
                    for conn in connections:
                        if conn.laddr.port == port:
                            print(f"   🔫 Arrêt du processus {proc.info['name']} (PID: {proc.info['pid']}) sur port {port}")
                            psutil.Process(proc.info['pid']).terminate()
                            time.sleep(2)
                            if psutil.pid_exists(proc.info['pid']):
                                psutil.Process(proc.info['pid']).kill()
                            return True
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
        return False
    except Exception as e:
        print(f"   ⚠️ Erreur lors de l'arrêt du processus: {e}")
        return False

def check_faraday_installation():
    """Vérifie l'installation de Faraday"""
    print_step(1, "Vérification de l'installation Faraday")
    
    # Vérifier Python
    python_version = sys.version_info
    print(f"   🐍 Python: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    if python_version < (3, 7):
        print("   ❌ Python 3.7+ requis")
        return False
    
    # Vérifier Faraday
    faraday_paths = [
        Path("faraday"),
        Path("../faraday"),
        Path("../../faraday"),
        Path("C:/Users/LENOVO/OneDrive/Bureau/faraday/faraday")
    ]
    
    faraday_root = None
    for path in faraday_paths:
        if path.exists() and (path / "manage.py").exists():
            faraday_root = path.resolve()
            break
    
    if faraday_root:
        print(f"   ✅ Faraday trouvé: {faraday_root}")
        return faraday_root
    else:
        print("   ❌ Faraday non trouvé")
        return False

def check_database():
    """Vérifie la base de données"""
    print_step(2, "Vérification de la base de données")
    
    try:
        # Vérifier PostgreSQL
        if check_port(5432):
            print("   ✅ PostgreSQL détecté (port 5432)")
            return True
        else:
            print("   ⚠️ PostgreSQL non détecté, utilisation SQLite")
            return True
    except Exception as e:
        print(f"   ⚠️ Erreur base de données: {e}")
        return True

def check_faraday_config(faraday_root):
    """Vérifie la configuration Faraday"""
    print_step(3, "Vérification de la configuration")
    
    try:
        config_path = faraday_root / "faraday_data" / "config"
        if config_path.exists():
            print(f"   ✅ Dossier config: {config_path}")
        else:
            print(f"   ⚠️ Création du dossier config: {config_path}")
            config_path.mkdir(parents=True, exist_ok=True)
        
        # Vérifier server.ini
        server_ini = config_path / "server.ini"
        if not server_ini.exists():
            print("   📝 Création du fichier server.ini")
            with open(server_ini, 'w') as f:
                f.write("""[database]
connection_string = sqlite:///faraday_data/faraday.db

[server]
bind_address = 0.0.0.0
port = 5985
websocket_port = 9000
session_timeout = 43200

[storage]
path = faraday_data/storage

[reports]
path = faraday_data/uploaded_reports
""")
        
        print(f"   ✅ Configuration: {server_ini}")
        return True
        
    except Exception as e:
        print(f"   ❌ Erreur configuration: {e}")
        return False

def start_faraday_server(faraday_root):
    """Démarre le serveur Faraday"""
    print_step(4, "Démarrage du serveur Faraday")
    
    # Nettoyer le port 5985
    if check_port(5985):
        print("   🔄 Port 5985 occupé, nettoyage...")
        kill_process_on_port(5985)
        time.sleep(3)
    
    try:
        # Changer vers le dossier Faraday
        original_cwd = os.getcwd()
        os.chdir(faraday_root)
        
        # Différentes méthodes de démarrage
        start_commands = [
            [sys.executable, "manage.py", "runserver"],
            [sys.executable, "-m", "faraday.server.web"],
            ["faraday-server"],
            [sys.executable, "start_server.py"]
        ]
        
        for i, cmd in enumerate(start_commands, 1):
            print(f"   🚀 Tentative {i}: {' '.join(cmd)}")
            
            try:
                # Démarrer le processus en arrière-plan
                if os.name == 'nt':  # Windows
                    process = subprocess.Popen(
                        cmd,
                        creationflags=subprocess.CREATE_NEW_CONSOLE,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE
                    )
                else:  # Linux/Mac
                    process = subprocess.Popen(
                        cmd,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE
                    )
                
                # Attendre le démarrage
                print("   ⏳ Attente du démarrage...")
                for attempt in range(15):  # 15 secondes max
                    time.sleep(1)
                    if check_port(5985):
                        print(f"   ✅ Serveur démarré sur le port 5985 !")
                        os.chdir(original_cwd)
                        return process
                    
                    # Vérifier si le processus est encore vivant
                    if process.poll() is not None:
                        stdout, stderr = process.communicate()
                        print(f"   ❌ Processus terminé")
                        if stderr:
                            print(f"   📝 Erreur: {stderr.decode()[:200]}")
                        break
                
                # Arrêter le processus si pas de succès
                try:
                    process.terminate()
                    process.wait(timeout=5)
                except:
                    process.kill()
                
            except Exception as e:
                print(f"   ❌ Erreur commande {i}: {e}")
                continue
        
        os.chdir(original_cwd)
        print("   ❌ Aucune méthode de démarrage n'a fonctionné")
        return None
        
    except Exception as e:
        print(f"   ❌ Erreur générale: {e}")
        return None

def test_faraday_api():
    """Teste l'API Faraday"""
    print_step(5, "Test de l'API Faraday")
    
    try:
        # Test de connexion basic
        response = requests.get(
            "http://localhost:5985/_api/v3/info",
            auth=("faraday", "faraday"),
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ API accessible")
            print(f"   📊 Version: {data.get('version', 'N/A')}")
            print(f"   📊 Faraday: {data.get('faraday_version', 'N/A')}")
            return True
        else:
            print(f"   ❌ API erreur HTTP {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Impossible de se connecter à l'API")
        return False
    except Exception as e:
        print(f"   ❌ Erreur API: {e}")
        return False

def show_logs(faraday_root):
    """Affiche les logs récents"""
    print_step(6, "Vérification des logs")
    
    try:
        logs_path = faraday_root / "faraday_data" / "logs"
        if logs_path.exists():
            log_files = list(logs_path.glob("*.log"))
            if log_files:
                latest_log = max(log_files, key=os.path.getmtime)
                print(f"   📋 Log le plus récent: {latest_log}")
                
                try:
                    with open(latest_log, 'r', encoding='utf-8', errors='ignore') as f:
                        lines = f.readlines()
                        last_lines = lines[-20:] if len(lines) > 20 else lines
                        
                    print("   📝 Dernières lignes du log:")
                    for line in last_lines:
                        print(f"      {line.strip()}")
                        
                except Exception as e:
                    print(f"   ⚠️ Erreur lecture log: {e}")
            else:
                print("   ⚠️ Aucun fichier log trouvé")
        else:
            print("   ⚠️ Dossier logs non trouvé")
            
    except Exception as e:
        print(f"   ❌ Erreur logs: {e}")

def main():
    print_header("DIAGNOSTIC SERVEUR FARADAY")
    
    # Étape 1: Vérification installation
    faraday_root = check_faraday_installation()
    if not faraday_root:
        print("\n❌ Installation Faraday non trouvée")
        return False
    
    # Étape 2: Vérification base de données
    check_database()
    
    # Étape 3: Vérification configuration
    if not check_faraday_config(faraday_root):
        print("\n❌ Problème de configuration")
        return False
    
    # Étape 4: Démarrage serveur
    process = start_faraday_server(faraday_root)
    if not process:
        print("\n❌ Impossible de démarrer le serveur")
        show_logs(faraday_root)
        return False
    
    # Étape 5: Test API
    api_ok = test_faraday_api()
    
    # Étape 6: Logs si problème
    if not api_ok:
        show_logs(faraday_root)
    
    # Résumé
    print_header("RÉSUMÉ")
    
    services_status = [
        ("Faraday Server", check_port(5985), "http://localhost:5985"),
        ("API Faraday", api_ok, "http://localhost:5985/_api/v3/info")
    ]
    
    all_ok = True
    for service, status, url in services_status:
        status_text = "✅ OK" if status else "❌ ERREUR"
        print(f"{service:15}: {status_text} - {url}")
        if not status:
            all_ok = False
    
    if all_ok:
        print("\n🎉 SERVEUR FARADAY OPÉRATIONNEL !")
        print("🔗 Vous pouvez maintenant démarrer le proxy et l'interface")
    else:
        print("\n⚠️ PROBLÈMES DÉTECTÉS")
        print("🔧 Consultez les logs ci-dessus pour plus de détails")
    
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
