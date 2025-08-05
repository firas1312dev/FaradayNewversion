#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 Solution Rapide pour Démarrer Faraday
=======================================

Script pour installer et démarrer Faraday rapidement
"""

import subprocess
import sys
import os
import time
import socket
from pathlib import Path

def print_step(num, title):
    print(f"\n🔹 Étape {num}: {title}")
    print("-" * 50)

def check_port(port):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0
    except:
        return False

def install_faraday():
    """Installe Faraday via pip"""
    print_step(1, "Installation de Faraday")
    
    try:
        # Vérifier si Faraday est déjà installé
        result = subprocess.run([sys.executable, '-c', 'import faraday'], 
                              capture_output=True)
        if result.returncode == 0:
            print("   ✅ Faraday déjà installé")
            return True
    except:
        pass
    
    print("   📦 Installation de Faraday...")
    try:
        # Installer Faraday
        result = subprocess.run([sys.executable, '-m', 'pip', 'install', 'faradaysec'], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print("   ✅ Faraday installé avec succès")
            return True
        else:
            print(f"   ❌ Erreur installation: {result.stderr}")
            
            # Essayer avec --user
            print("   🔄 Tentative avec --user...")
            result = subprocess.run([sys.executable, '-m', 'pip', 'install', '--user', 'faradaysec'], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                print("   ✅ Faraday installé avec --user")
                return True
            else:
                print(f"   ❌ Échec: {result.stderr}")
                return False
                
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        return False

def install_dependencies():
    """Installe les dépendances nécessaires"""
    print_step(2, "Installation des dépendances")
    
    dependencies = [
        'flask', 'flask-cors', 'requests', 'psutil',
        'gevent', 'werkzeug', 'sqlalchemy', 'alembic'
    ]
    
    try:
        for dep in dependencies:
            print(f"   📦 Installation de {dep}...")
            result = subprocess.run([sys.executable, '-m', 'pip', 'install', dep], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                print(f"   ✅ {dep} installé")
            else:
                print(f"   ⚠️ {dep} peut-être déjà installé")
        
        return True
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        return False

def start_faraday_with_docker():
    """Démarre Faraday avec Docker"""
    print_step(3, "Tentative de démarrage avec Docker")
    
    # Chercher docker-compose.yml
    faraday_root = Path.cwd().parent.parent
    docker_compose_path = faraday_root / "docker-compose.yaml"
    
    if docker_compose_path.exists():
        print(f"   📁 Docker Compose trouvé: {docker_compose_path}")
        
        try:
            os.chdir(faraday_root)
            print("   🐳 Démarrage avec Docker Compose...")
            
            # Arrêter d'abord si nécessaire
            subprocess.run(['docker-compose', 'down'], capture_output=True)
            
            # Démarrer
            result = subprocess.run(['docker-compose', 'up', '-d'], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                print("   ✅ Docker Compose démarré")
                
                # Attendre que le service soit prêt
                for i in range(30):
                    if check_port(5985):
                        print("   🎉 Faraday accessible via Docker!")
                        return True
                    time.sleep(1)
                    print(f"   ⏳ Attente Docker... ({i+1}/30)")
                
                print("   ⚠️ Docker démarré mais service non accessible")
                return False
            else:
                print(f"   ❌ Erreur Docker: {result.stderr}")
                return False
                
        except FileNotFoundError:
            print("   ❌ Docker ou Docker Compose non installé")
            return False
        except Exception as e:
            print(f"   ❌ Erreur: {e}")
            return False
    else:
        print("   ⚠️ Fichier docker-compose.yaml non trouvé")
        return False

def start_faraday_simple():
    """Démarre Faraday de manière simple"""
    print_step(4, "Démarrage simple de Faraday")
    
    # Aller dans le dossier faraday principal
    faraday_dir = Path.cwd().parent
    
    if (faraday_dir / "manage.py").exists():
        print(f"   📁 Dossier Faraday trouvé: {faraday_dir}")
        
        try:
            os.chdir(faraday_dir)
            
            # Essayer de démarrer avec manage.py
            print("   🚀 Démarrage avec manage.py...")
            
            if os.name == 'nt':
                proc = subprocess.Popen([sys.executable, 'manage.py', 'runserver'], 
                                      creationflags=subprocess.CREATE_NEW_CONSOLE)
            else:
                proc = subprocess.Popen([sys.executable, 'manage.py', 'runserver'])
            
            # Attendre le démarrage
            for i in range(20):
                if check_port(5985):
                    print("   ✅ Faraday démarré avec manage.py!")
                    return True
                time.sleep(1)
                print(f"   ⏳ Attente démarrage... ({i+1}/20)")
            
            print("   ❌ Faraday ne répond pas sur le port 5985")
            return False
            
        except Exception as e:
            print(f"   ❌ Erreur: {e}")
            return False
    else:
        print("   ❌ manage.py non trouvé")
        return False

def create_simple_server():
    """Crée un serveur Faraday simulé pour les tests"""
    print_step(5, "Création d'un serveur de test")
    
    server_content = '''#!/usr/bin/env python3
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Données de test
test_workspaces = [
    {
        "id": 1,
        "name": "test-workspace-1",
        "active": True,
        "customer": "Client Test",
        "description": "Workspace de test",
        "stats": {
            "hosts": 5,
            "services": 15,
            "total_vulns": 8
        }
    },
    {
        "id": 2,
        "name": "test-workspace-2",
        "active": False,
        "customer": "Autre Client",
        "description": "Second workspace de test",
        "stats": {
            "hosts": 3,
            "services": 8,
            "total_vulns": 12
        }
    }
]

@app.route('/')
def home():
    return jsonify({"message": "Faraday Test Server", "status": "running"})

@app.route('/_api/v3/info')
def info():
    return jsonify({
        "version": "Test-1.0",
        "server": "Faraday Test Server",
        "status": "OK"
    })

@app.route('/_api/v3/ws')
def workspaces():
    return jsonify({"rows": test_workspaces})

@app.route('/_api/v3/ws/<workspace_name>')
def workspace_detail(workspace_name):
    for ws in test_workspaces:
        if ws["name"] == workspace_name:
            return jsonify(ws)
    return jsonify({"error": "Workspace not found"}), 404

if __name__ == '__main__':
    print("🧪 Démarrage du serveur Faraday de test...")
    print("📍 Accessible sur: http://localhost:5985")
    app.run(host='0.0.0.0', port=5985, debug=True)
'''
    
    try:
        with open('faraday_test_server.py', 'w') as f:
            f.write(server_content)
        
        print("   📄 Serveur de test créé: faraday_test_server.py")
        
        # Démarrer le serveur de test
        print("   🚀 Démarrage du serveur de test...")
        
        if os.name == 'nt':
            proc = subprocess.Popen([sys.executable, 'faraday_test_server.py'],
                                  creationflags=subprocess.CREATE_NEW_CONSOLE)
        else:
            proc = subprocess.Popen([sys.executable, 'faraday_test_server.py'])
        
        # Attendre le démarrage
        for i in range(10):
            if check_port(5985):
                print("   ✅ Serveur de test démarré!")
                return True
            time.sleep(1)
            print(f"   ⏳ Attente serveur de test... ({i+1}/10)")
        
        print("   ❌ Serveur de test non accessible")
        return False
        
    except Exception as e:
        print(f"   ❌ Erreur création serveur test: {e}")
        return False

def main():
    print("🚀 SOLUTION RAPIDE FARADAY")
    print("=" * 50)
    print("🎯 Objectif: Démarrer Faraday rapidement pour les tests")
    
    # Vérifier si déjà en cours
    if check_port(5985):
        print("✅ Un serveur Faraday est déjà en cours sur le port 5985!")
        return True
    
    # Essayer différentes approches
    approaches = [
        ("Installation de Faraday", install_faraday),
        ("Installation des dépendances", install_dependencies),
        ("Démarrage avec Docker", start_faraday_with_docker),
        ("Démarrage simple", start_faraday_simple),
        ("Serveur de test", create_simple_server)
    ]
    
    for name, func in approaches:
        print(f"\n🔄 Tentative: {name}")
        try:
            if func():
                if check_port(5985):
                    print(f"\n🎉 SUCCÈS avec: {name}")
                    print("📍 Faraday accessible sur: http://localhost:5985")
                    print("🔐 Credentials: faraday / faraday")
                    return True
        except Exception as e:
            print(f"❌ Erreur {name}: {e}")
            continue
    
    print("\n❌ ÉCHEC: Impossible de démarrer Faraday")
    print("\n💡 Solutions manuelles:")
    print("1. Installer Docker et utiliser docker-compose up")
    print("2. Installer Faraday: pip install faradaysec")
    print("3. Utiliser le serveur de test créé")
    
    return False

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n🛑 Arrêt demandé")
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
    
    input("\nAppuyez sur Entrée pour continuer...")
