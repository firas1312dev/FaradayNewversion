#!/usr/bin/env python3
"""
Script pour mettre à jour tous les fichiers de l'interface
pour utiliser le bon port du proxy CORS (8082)
"""
import os
import glob

def update_port_in_file(file_path, old_port, new_port):
    """Mettre à jour le port dans un fichier"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        old_url = f'localhost:{old_port}'
        new_url = f'localhost:{new_port}'
        
        if old_url in content:
            new_content = content.replace(old_url, new_url)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            count = content.count(old_url)
            print(f"✅ {file_path}: {count} occurrences mises à jour")
            return True
        else:
            print(f"⏭️ {file_path}: aucun changement nécessaire")
            return False
            
    except Exception as e:
        print(f"❌ Erreur avec {file_path}: {e}")
        return False

def main():
    print("🔧 Mise à jour des ports dans les fichiers de l'interface")
    print("=" * 50)
    
    # Ports à changer
    old_port = "8081"
    new_port = "8082"
    
    # Types de fichiers à traiter
    patterns = [
        "*.html",
        "*.js",
        "*.py"
    ]
    
    updated_files = 0
    total_files = 0
    
    for pattern in patterns:
        files = glob.glob(pattern)
        for file_path in files:
            # Ignorer le script actuel
            if file_path.endswith('update-ports.py'):
                continue
                
            total_files += 1
            if update_port_in_file(file_path, old_port, new_port):
                updated_files += 1
    
    print("=" * 50)
    print(f"📊 Résumé: {updated_files}/{total_files} fichiers mis à jour")
    print(f"🎯 Port changé: {old_port} → {new_port}")
    
    if updated_files > 0:
        print("✅ Mise à jour terminée !")
        print("💡 Redémarrez vos serveurs si nécessaire")
    else:
        print("ℹ️ Aucune mise à jour nécessaire")

if __name__ == "__main__":
    main()
