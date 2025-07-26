/**
 * Gestionnaire des Workspaces pour Faraday
 * Gère les opérations CRUD sur les workspaces
 */

class WorkspaceManager {
    constructor() {
        this.workspaces = [];
        this.currentWorkspace = null;
        this.initializeWorkspaceManager();
    }

    /**
     * Initialiser le gestionnaire des workspaces
     */
    initializeWorkspaceManager() {
        console.log('🏢 Initialisation du gestionnaire de workspaces');
        this.setupEventListeners();
    }

    /**
     * Configurer les event listeners
     */
    setupEventListeners() {
        // Bouton Nouveau Workspace
        const newWorkspaceBtn = document.getElementById('newWorkspaceBtn');
        if (newWorkspaceBtn) {
            newWorkspaceBtn.addEventListener('click', () => this.showCreateWorkspaceModal());
        }

        // Bouton Rafraîchir
        const refreshWorkspacesBtn = document.getElementById('refreshWorkspacesBtn');
        if (refreshWorkspacesBtn) {
            refreshWorkspacesBtn.addEventListener('click', () => this.loadWorkspaces());
        }

        // Recherche de workspaces
        const workspaceSearch = document.getElementById('workspaceSearch');
        if (workspaceSearch) {
            workspaceSearch.addEventListener('input', (e) => this.filterWorkspaces(e.target.value));
        }
    }

    /**
     * Charger tous les workspaces depuis l'API
     */
    async loadWorkspaces() {
        try {
            console.log('🔄 Chargement des workspaces...');
            
            if (window.authManager) {
                window.authManager.showNotification('Chargement des workspaces...', 'info');
            }

            const workspaces = await faradayAPI.getWorkspaces();
            console.log('📊 Workspaces récupérés:', workspaces);
            
            this.workspaces = workspaces;
            this.renderWorkspacesList();
            this.updateWorkspaceSelector();

            if (window.authManager) {
                window.authManager.showNotification(`${workspaces.length} workspace(s) chargé(s)`, 'success');
            }

        } catch (error) {
            console.error('❌ Erreur lors du chargement des workspaces:', error);
            
            if (window.authManager) {
                window.authManager.showNotification('Erreur lors du chargement des workspaces', 'error');
            }
            
            // Afficher des workspaces de démonstration en cas d'erreur
            this.showDemoWorkspaces();
        }
    }

    /**
     * Afficher des workspaces de démonstration
     */
    showDemoWorkspaces() {
        this.workspaces = [
            {
                id: 1,
                name: 'demo-workspace',
                description: 'Workspace de démonstration',
                hosts_count: 5,
                services_count: 23,
                vulns_count: 12,
                active: true,
                start_date: new Date().toISOString(),
                end_date: null
            },
            {
                id: 2,
                name: 'test-workspace',
                description: 'Workspace de test',
                hosts_count: 2,
                services_count: 8,
                vulns_count: 3,
                active: false,
                start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                end_date: new Date().toISOString()
            }
        ];
        
        this.renderWorkspacesList();
        console.log('📋 Workspaces de démonstration affichés');
    }

    /**
     * Afficher la liste des workspaces
     */
    renderWorkspacesList() {
        const workspacesList = document.getElementById('workspacesList');
        if (!workspacesList) return;

        if (this.workspaces.length === 0) {
            workspacesList.innerHTML = `
                <div class="no-workspaces">
                    <i class="fas fa-folder-open"></i>
                    <h3>Aucun workspace trouvé</h3>
                    <p>Créez votre premier workspace pour commencer</p>
                    <button class="btn btn-primary" onclick="workspaceManager.showCreateWorkspaceModal()">
                        <i class="fas fa-plus"></i> Créer un workspace
                    </button>
                </div>
            `;
            return;
        }

        workspacesList.innerHTML = this.workspaces.map(workspace => `
            <div class="workspace-card" data-workspace-id="${workspace.id}">
                <div class="workspace-header">
                    <div class="workspace-info">
                        <h3 class="workspace-name">
                            <i class="fas fa-folder"></i>
                            ${workspace.name}
                            ${workspace.active ? '<span class="status-badge active">Actif</span>' : '<span class="status-badge inactive">Inactif</span>'}
                        </h3>
                        <p class="workspace-description">${workspace.description || 'Aucune description'}</p>
                    </div>
                    <div class="workspace-actions">
                        <button class="btn-icon" onclick="workspaceManager.selectWorkspace('${workspace.name}')" title="Sélectionner">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-icon" onclick="workspaceManager.showEditWorkspaceModal('${workspace.id}')" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="workspaceManager.showWorkspaceDetails('${workspace.id}')" title="Détails">
                            <i class="fas fa-info-circle"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="workspaceManager.confirmDeleteWorkspace('${workspace.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="workspace-stats">
                    <div class="stat-item">
                        <i class="fas fa-server"></i>
                        <span class="stat-value">${workspace.hosts_count || 0}</span>
                        <span class="stat-label">Hosts</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-network-wired"></i>
                        <span class="stat-value">${workspace.services_count || 0}</span>
                        <span class="stat-label">Services</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span class="stat-value">${workspace.vulns_count || 0}</span>
                        <span class="stat-label">Vulnérabilités</span>
                    </div>
                </div>
                
                <div class="workspace-dates">
                    <small class="workspace-date">
                        <i class="fas fa-calendar-plus"></i>
                        Créé: ${workspace.start_date ? new Date(workspace.start_date).toLocaleDateString() : 'Non défini'}
                    </small>
                    ${workspace.end_date ? `
                        <small class="workspace-date">
                            <i class="fas fa-calendar-times"></i>
                            Fermé: ${new Date(workspace.end_date).toLocaleDateString()}
                        </small>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * Mettre à jour le sélecteur de workspace dans le header
     */
    updateWorkspaceSelector() {
        const workspaceSelect = document.getElementById('workspaceSelect');
        if (!workspaceSelect) return;

        workspaceSelect.innerHTML = `
            <option value="">Sélectionner un workspace...</option>
            ${this.workspaces.map(ws => `
                <option value="${ws.name}" ${ws.name === faradayAPI.currentWorkspace ? 'selected' : ''}>
                    ${ws.name} ${ws.active ? '(Actif)' : '(Inactif)'}
                </option>
            `).join('')}
        `;

        // Event listener pour la sélection
        workspaceSelect.onchange = (e) => {
            if (e.target.value) {
                this.selectWorkspace(e.target.value);
            }
        };
    }

    /**
     * Sélectionner un workspace
     */
    async selectWorkspace(workspaceName) {
        try {
            console.log(`🎯 Sélection du workspace: ${workspaceName}`);
            
            faradayAPI.currentWorkspace = workspaceName;
            this.currentWorkspace = this.workspaces.find(ws => ws.name === workspaceName);
            
            // Mettre à jour l'interface
            this.updateWorkspaceSelector();
            this.highlightSelectedWorkspace(workspaceName);
            
            // Recharger les données du dashboard si disponible
            if (window.dashboardManager && document.querySelector('.nav-link[data-section="dashboard"]').classList.contains('active')) {
                await window.dashboardManager.loadDashboard();
            }
            
            if (window.authManager) {
                window.authManager.showNotification(`Workspace "${workspaceName}" sélectionné`, 'success');
            }

        } catch (error) {
            console.error('❌ Erreur lors de la sélection du workspace:', error);
            if (window.authManager) {
                window.authManager.showNotification('Erreur lors de la sélection du workspace', 'error');
            }
        }
    }

    /**
     * Mettre en évidence le workspace sélectionné
     */
    highlightSelectedWorkspace(workspaceName) {
        // Supprimer les anciennes sélections
        document.querySelectorAll('.workspace-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Ajouter la sélection au nouveau workspace
        const selectedCard = document.querySelector(`[data-workspace-id]`);
        if (selectedCard) {
            const workspace = this.workspaces.find(ws => ws.name === workspaceName);
            if (workspace) {
                const targetCard = document.querySelector(`[data-workspace-id="${workspace.id}"]`);
                if (targetCard) {
                    targetCard.classList.add('selected');
                }
            }
        }
    }

    /**
     * Afficher la modal de création de workspace
     */
    showCreateWorkspaceModal() {
        const modalHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-plus-circle"></i> Nouveau Workspace</h2>
                    <button class="close-btn" onclick="this.closest('.modal').style.display = 'none'">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="createWorkspaceForm">
                        <div class="form-group">
                            <label for="workspaceName">Nom du workspace *</label>
                            <input type="text" id="workspaceName" required pattern="[a-zA-Z0-9_-]+" 
                                   placeholder="ex: projet-test" title="Lettres, chiffres, tirets et underscores uniquement">
                            <small>Utilisez uniquement des lettres, chiffres, tirets et underscores</small>
                        </div>
                        <div class="form-group">
                            <label for="workspaceDescription">Description</label>
                            <textarea id="workspaceDescription" rows="3" 
                                      placeholder="Description du workspace (optionnel)"></textarea>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="workspaceActive" checked> 
                                Workspace actif
                            </label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').style.display = 'none'">
                        Annuler
                    </button>
                    <button type="button" class="btn btn-primary" onclick="workspaceManager.createWorkspace()">
                        <i class="fas fa-plus"></i> Créer
                    </button>
                </div>
            </div>
        `;

        this.showModal(modalHTML);
    }

    /**
     * Créer un nouveau workspace
     */
    async createWorkspace() {
        const form = document.getElementById('createWorkspaceForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const name = document.getElementById('workspaceName').value.trim();
        const description = document.getElementById('workspaceDescription').value.trim();
        const active = document.getElementById('workspaceActive').checked;

        try {
            console.log(`🏗️ Création du workspace: ${name}`);
            
            if (window.authManager) {
                window.authManager.showNotification('Création du workspace...', 'info');
            }

            const newWorkspace = await faradayAPI.createWorkspace({
                name: name,
                description: description,
                active: active
            });

            console.log('✅ Workspace créé:', newWorkspace);
            
            // Recharger la liste
            await this.loadWorkspaces();
            
            // Fermer la modal
            document.querySelector('.modal').style.display = 'none';
            
            if (window.authManager) {
                window.authManager.showNotification(`Workspace "${name}" créé avec succès`, 'success');
            }

        } catch (error) {
            console.error('❌ Erreur lors de la création du workspace:', error);
            
            if (window.authManager) {
                window.authManager.showNotification('Erreur lors de la création du workspace', 'error');
            }
        }
    }

    /**
     * Afficher la modal d'édition de workspace
     */
    showEditWorkspaceModal(workspaceId) {
        const workspace = this.workspaces.find(ws => ws.id == workspaceId);
        if (!workspace) return;

        const modalHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-edit"></i> Modifier Workspace</h2>
                    <button class="close-btn" onclick="this.closest('.modal').style.display = 'none'">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editWorkspaceForm">
                        <input type="hidden" id="editWorkspaceId" value="${workspace.id}">
                        <div class="form-group">
                            <label for="editWorkspaceName">Nom du workspace *</label>
                            <input type="text" id="editWorkspaceName" required pattern="[a-zA-Z0-9_-]+" 
                                   value="${workspace.name}" title="Lettres, chiffres, tirets et underscores uniquement">
                        </div>
                        <div class="form-group">
                            <label for="editWorkspaceDescription">Description</label>
                            <textarea id="editWorkspaceDescription" rows="3">${workspace.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="editWorkspaceActive" ${workspace.active ? 'checked' : ''}> 
                                Workspace actif
                            </label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').style.display = 'none'">
                        Annuler
                    </button>
                    <button type="button" class="btn btn-primary" onclick="workspaceManager.updateWorkspace()">
                        <i class="fas fa-save"></i> Sauvegarder
                    </button>
                </div>
            </div>
        `;

        this.showModal(modalHTML);
    }

    /**
     * Mettre à jour un workspace
     */
    async updateWorkspace() {
        const form = document.getElementById('editWorkspaceForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const id = document.getElementById('editWorkspaceId').value;
        const name = document.getElementById('editWorkspaceName').value.trim();
        const description = document.getElementById('editWorkspaceDescription').value.trim();
        const active = document.getElementById('editWorkspaceActive').checked;

        try {
            console.log(`🔄 Mise à jour du workspace: ${name}`);
            
            if (window.authManager) {
                window.authManager.showNotification('Mise à jour du workspace...', 'info');
            }

            const updatedWorkspace = await faradayAPI.updateWorkspace(id, {
                name: name,
                description: description,
                active: active
            });

            console.log('✅ Workspace mis à jour:', updatedWorkspace);
            
            // Recharger la liste
            await this.loadWorkspaces();
            
            // Fermer la modal
            document.querySelector('.modal').style.display = 'none';
            
            if (window.authManager) {
                window.authManager.showNotification(`Workspace "${name}" mis à jour`, 'success');
            }

        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour du workspace:', error);
            
            if (window.authManager) {
                window.authManager.showNotification('Erreur lors de la mise à jour du workspace', 'error');
            }
        }
    }

    /**
     * Confirmer la suppression d'un workspace
     */
    confirmDeleteWorkspace(workspaceId) {
        const workspace = this.workspaces.find(ws => ws.id == workspaceId);
        if (!workspace) return;

        const modalHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-exclamation-triangle text-danger"></i> Supprimer Workspace</h2>
                    <button class="close-btn" onclick="this.closest('.modal').style.display = 'none'">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Attention !</strong> Cette action est irréversible.
                    </div>
                    <p>Êtes-vous sûr de vouloir supprimer le workspace <strong>"${workspace.name}"</strong> ?</p>
                    <p>Toutes les données associées (hosts, services, vulnérabilités) seront définitivement supprimées.</p>
                    
                    <div class="workspace-stats">
                        <div class="stat-item">
                            <i class="fas fa-server"></i>
                            <span class="stat-value">${workspace.hosts_count || 0}</span>
                            <span class="stat-label">Hosts</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-network-wired"></i>
                            <span class="stat-value">${workspace.services_count || 0}</span>
                            <span class="stat-label">Services</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span class="stat-value">${workspace.vulns_count || 0}</span>
                            <span class="stat-label">Vulnérabilités</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').style.display = 'none'">
                        Annuler
                    </button>
                    <button type="button" class="btn btn-danger" onclick="workspaceManager.deleteWorkspace('${workspace.id}')">
                        <i class="fas fa-trash"></i> Supprimer définitivement
                    </button>
                </div>
            </div>
        `;

        this.showModal(modalHTML);
    }

    /**
     * Supprimer un workspace
     */
    async deleteWorkspace(workspaceId) {
        try {
            console.log(`🗑️ Suppression du workspace: ${workspaceId}`);
            
            if (window.authManager) {
                window.authManager.showNotification('Suppression du workspace...', 'info');
            }

            await faradayAPI.deleteWorkspace(workspaceId);

            console.log('✅ Workspace supprimé');
            
            // Si c'était le workspace actuel, le désélectionner
            const deletedWorkspace = this.workspaces.find(ws => ws.id == workspaceId);
            if (deletedWorkspace && faradayAPI.currentWorkspace === deletedWorkspace.name) {
                faradayAPI.currentWorkspace = null;
                this.currentWorkspace = null;
            }
            
            // Recharger la liste
            await this.loadWorkspaces();
            
            // Fermer la modal
            document.querySelector('.modal').style.display = 'none';
            
            if (window.authManager) {
                window.authManager.showNotification('Workspace supprimé avec succès', 'success');
            }

        } catch (error) {
            console.error('❌ Erreur lors de la suppression du workspace:', error);
            
            if (window.authManager) {
                window.authManager.showNotification('Erreur lors de la suppression du workspace', 'error');
            }
        }
    }

    /**
     * Afficher les détails d'un workspace
     */
    showWorkspaceDetails(workspaceId) {
        const workspace = this.workspaces.find(ws => ws.id == workspaceId);
        if (!workspace) return;

        const modalHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2><i class="fas fa-info-circle"></i> Détails du Workspace</h2>
                    <button class="close-btn" onclick="this.closest('.modal').style.display = 'none'">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="workspace-details">
                        <div class="detail-section">
                            <h3><i class="fas fa-folder"></i> Informations générales</h3>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>Nom:</label>
                                    <span>${workspace.name}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Description:</label>
                                    <span>${workspace.description || 'Aucune description'}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Statut:</label>
                                    <span class="status-badge ${workspace.active ? 'active' : 'inactive'}">
                                        ${workspace.active ? 'Actif' : 'Inactif'}
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <label>Date de création:</label>
                                    <span>${workspace.start_date ? new Date(workspace.start_date).toLocaleString() : 'Non définie'}</span>
                                </div>
                                ${workspace.end_date ? `
                                    <div class="detail-item">
                                        <label>Date de fermeture:</label>
                                        <span>${new Date(workspace.end_date).toLocaleString()}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h3><i class="fas fa-chart-bar"></i> Statistiques</h3>
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-server"></i>
                                    </div>
                                    <div class="stat-info">
                                        <div class="stat-number">${workspace.hosts_count || 0}</div>
                                        <div class="stat-label">Hosts</div>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-network-wired"></i>
                                    </div>
                                    <div class="stat-info">
                                        <div class="stat-number">${workspace.services_count || 0}</div>
                                        <div class="stat-label">Services</div>
                                    </div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-icon">
                                        <i class="fas fa-exclamation-triangle"></i>
                                    </div>
                                    <div class="stat-info">
                                        <div class="stat-number">${workspace.vulns_count || 0}</div>
                                        <div class="stat-label">Vulnérabilités</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').style.display = 'none'">
                        Fermer
                    </button>
                    <button type="button" class="btn btn-primary" onclick="workspaceManager.selectWorkspace('${workspace.name}'); this.closest('.modal').style.display = 'none'">
                        <i class="fas fa-check"></i> Sélectionner ce workspace
                    </button>
                </div>
            </div>
        `;

        this.showModal(modalHTML);
    }

    /**
     * Filtrer les workspaces
     */
    filterWorkspaces(searchTerm) {
        const cards = document.querySelectorAll('.workspace-card');
        const term = searchTerm.toLowerCase();
        
        cards.forEach(card => {
            const name = card.querySelector('.workspace-name').textContent.toLowerCase();
            const description = card.querySelector('.workspace-description').textContent.toLowerCase();
            
            if (name.includes(term) || description.includes(term)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    /**
     * Afficher une modal
     */
    showModal(content) {
        let modal = document.getElementById('workspaceModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'workspaceModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = content;
        modal.style.display = 'flex';
        
        // Fermer en cliquant à l'extérieur
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
}

// Initialiser le gestionnaire global
window.workspaceManager = new WorkspaceManager();
