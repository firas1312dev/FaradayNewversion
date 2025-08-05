#!/usr/bin/env python3
"""
🔄 Script de Redémarrage Faraday Server
Redémarre proprement le serveur Faraday en cas d'arrêt
"""

import os
import sys
import time
import subprocess
import socket
import psutil
from pathlib import Path

def check_port(port, host='localhost'):
    """Vérifie si un port est ouvert"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except:
        return False

def kill_faraday_processes():
    """Arrête tous les processus Faraday"""
    print("🔄 Arrêt des processus Faraday existants...")
    
    killed_processes = []
    
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            name = proc.info['name'].lower()
            cmdline = ' '.join(proc.info['cmdline']).lower()
            
            # Processus Faraday à arrêter
            if any(keyword in name or keyword in cmdline for keyword in [
                'faraday', 'manage.py', 'runserver', 'start_server.py'
            ]):
                print(f"   🔫 Arrêt: {proc.info['name']} (PID: {proc.info['pid']})")
                try:
                    process = psutil.Process(proc.info['pid'])
                    process.terminate()
                    killed_processes.append(proc.info['pid'])
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
                    
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    
    # Attendre que les processus se terminent
    if killed_processes:
        print("   ⏳ Attente de l'arrêt des processus...")
        time.sleep(5)
        
        # Forcer l'arrêt si nécessaire
        for pid in killed_processes:
            try:
                if psutil.pid_exists(pid):
                    psutil.Process(pid).kill()
                    print(f"   💀 Processus {pid} forcé à s'arrêter")
            except:
                pass

def start_faraday_server():
    """Démarre le serveur Faraday"""
    print("🚀 Démarrage du serveur Faraday...")
    
    # Trouver le dossier Faraday
    faraday_paths = [
        Path("../"),
        Path("../../"),
        Path("C:/Users/LENOVO/OneDrive/Bureau/faraday/faraday")
    ]
    
    faraday_root = None
    for path in faraday_paths:
        if path.exists() and (path / "manage.py").exists():
            faraday_root = path.resolve()
            break
    
    if not faraday_root:
        print("❌ Dossier Faraday non trouvé")
        return False
    
    print(f"   📂 Faraday trouvé: {faraday_root}")
    
    # Changer vers le dossier Faraday
    original_cwd = os.getcwd()
    os.chdir(faraday_root)
    
    try:
        # Commandes de démarrage à essayer
        start_commands = [
            [sys.executable, "manage.py", "runserver"],
            [sys.executable, "start_server.py"],
            ["faraday-server"]
        ]
        
        for i, cmd in enumerate(start_commands, 1):
            print(f"   🔄 Tentative {i}: {' '.join(cmd)}")
            
            try:
                if os.name == 'nt':  # Windows
                    process = subprocess.Popen(
                        cmd,
                        creationflags=subprocess.CREATE_NEW_CONSOLE,
                        cwd=faraday_root
                    )
                else:  # Linux/Mac
                    process = subprocess.Popen(cmd, cwd=faraday_root)
                
                # Attendre le démarrage
                for attempt in range(20):  # 20 secondes max
                    time.sleep(1)
                    if check_port(5985):
                        print(f"   ✅ Serveur démarré avec succès!")
                        print(f"   🌐 Accessible sur: http://localhost:5985")
                        os.chdir(original_cwd)
                        return True
                    
                    if process.poll() is not None:
                        print(f"   ❌ Processus terminé prématurément")
                        break
                
                # Arrêter le processus si échec
                try:
                    process.terminate()
                    process.wait(timeout=5)
                except:
                    process.kill()
                    
            except Exception as e:
                print(f"   ❌ Erreur: {e}")
                continue
        
        os.chdir(original_cwd)
        return False
        
    except Exception as e:
        print(f"❌ Erreur générale: {e}")
        os.chdir(original_cwd)
        return False

def main():
    print("=" * 60)
    print("🔄 REDÉMARRAGE SERVEUR FARADAY")
    print("=" * 60)
    
    # Vérifier l'état actuel
    if check_port(5985):
        print("✅ Serveur Faraday déjà en cours d'exécution")
        
        response = input("Voulez-vous le redémarrer ? (o/N): ").lower().strip()
        if response not in ['o', 'oui', 'y', 'yes']:
            print("🚪 Annulation du redémarrage")
            return
    
    # Arrêter les processus existants
    kill_faraday_processes()
    
    # Attendre un peu
    print("⏳ Pause avant redémarrage...")
    time.sleep(3)
    
    # Démarrer le serveur
    if start_faraday_server():
        print("\n🎉 SERVEUR FARADAY REDÉMARRÉ AVEC SUCCÈS!")
        print("🔗 Vous pouvez maintenant utiliser l'interface web")
    else:
        print("\n❌ ÉCHEC DU REDÉMARRAGE")
        print("🔧 Utilisez debug_faraday_server.py pour plus de détails")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n🛑 Arrêt demandé par l'utilisateur")
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
    
    input("\nAppuyez sur Entrée pour continuer...")
