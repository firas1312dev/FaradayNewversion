/**
 * Gestionnaire de Workspaces
 * Gère l'affichage et les opérations CRUD des workspaces
 */

class WorkspaceManager {
    constructor(api) {
        this.api = api;
        this.workspaces = [];
        this.currentWorkspace = null;
        this.selectedWorkspaces = new Set();
        this.currentEditingId = null;
        
        this.initializeEventListeners();
        
        // Auto-initialiser si on est dans la page workspaces
        if (window.location.pathname.includes('workspaces.html')) {
            this.loadWorkspaces();
        }
    }

    /**
     * Initialiser les écouteurs d'événements
     */
    initializeEventListeners() {
        // Bouton rafraîchir
        document.getElementById('refresh-workspaces')?.addEventListener('click', () => {
            this.loadWorkspaces();
        });

        // Bouton nouveau workspace
        document.getElementById('new-workspace-btn')?.addEventListener('click', () => {
            this.showCreateModal();
        });

        // Bouton supprimer sélectionnés
        document.getElementById('delete-selected-btn')?.addEventListener('click', () => {
            this.deleteSelectedWorkspaces();
        });

        // Formulaire création workspace
        document.getElementById('create-workspace-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createWorkspace();
        });

        // Formulaire édition workspace
        document.getElementById('edit-workspace-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateWorkspace();
        });
    }

    /**
     * Charger et afficher la liste des workspaces
     */
    async loadWorkspaces() {
        try {
            this.showLoading(true);
            console.log('📡 Chargement des workspaces...');
            
            const result = await this.api.getWorkspaces();
            console.log('✅ Résultat API getWorkspaces:', result);
            
            // Vérifier que le résultat est bien un tableau
            if (Array.isArray(result)) {
                this.workspaces = result;
            } else if (result && Array.isArray(result.data)) {
                // Peut-être que l'API retourne {data: [...]}
                this.workspaces = result.data;
            } else {
                console.warn('⚠️ API getWorkspaces n\'a pas retourné un tableau:', result);
                this.workspaces = [];
            }
            
            console.log('✅ Workspaces traités:', this.workspaces.length, 'workspaces');
            
            // Utiliser renderWorkspaces pour workspaces.html ou renderWorkspacesList pour index.html
            if (window.location.pathname.includes('workspaces.html')) {
                this.renderWorkspaces();
            } else {
                this.renderWorkspacesList();
            }
            this.updateStats();
            
        } catch (error) {
            console.error('❌ Erreur chargement workspaces:', error);
            this.workspaces = []; // S'assurer que workspaces est un tableau vide en cas d'erreur
            this.showError('Erreur lors du chargement des workspaces: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Afficher la liste des workspaces
     */
    renderWorkspacesList() {
        const container = document.getElementById('workspaces-list');
        if (!container) return;

        if (this.workspaces.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-folder-open"></i>
                    <h3>Aucun workspace trouvé</h3>
                    <p>Créez votre premier workspace pour commencer</p>
                    <button class="btn btn-primary" onclick="workspaceManager.showCreateModal()">
                        <i class="fas fa-plus"></i> Créer un workspace
                    </button>
                </div>
            `;
            return;
        }

        const workspacesHTML = this.workspaces.map(workspace => {
            const isSelected = this.selectedWorkspaces.has(workspace.name);
            const isActive = workspace.name === this.currentWorkspace;
            
            return `
                <div class="workspace-card ${isActive ? 'active' : ''}" data-workspace="${workspace.name}">
                    <div class="workspace-header">
                        <div class="workspace-selection">
                            <input type="checkbox" 
                                   id="select-${workspace.name}" 
                                   class="workspace-checkbox"
                                   ${isSelected ? 'checked' : ''}
                                   onchange="workspaceManager.toggleWorkspaceSelection('${workspace.name}')">
                            <label for="select-${workspace.name}"></label>
                        </div>
                        <div class="workspace-info">
                            <h3 class="workspace-name">
                                <i class="fas fa-folder"></i>
                                ${workspace.name}
                            </h3>
                            <p class="workspace-description">
                                ${workspace.description || 'Aucune description'}
                            </p>
                        </div>
                        <div class="workspace-actions">
                            <button class="btn btn-sm btn-outline" 
                                    onclick="workspaceManager.selectWorkspace('${workspace.name}')"
                                    title="Sélectionner ce workspace">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-outline" 
                                    onclick="workspaceManager.showEditModal('${workspace.name}')"
                                    title="Modifier">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" 
                                    onclick="workspaceManager.deleteWorkspace('${workspace.name}')"
                                    title="Supprimer">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="workspace-details">
                        <div class="workspace-stats">
                            <div class="stat">
                                <span class="stat-label">Créé le:</span>
                                <span class="stat-value">${this.formatDate(workspace.create_date)}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Modifié le:</span>
                                <span class="stat-value">${this.formatDate(workspace.update_date)}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">ID:</span>
                                <span class="stat-value">${workspace.id}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = workspacesHTML;
    }

    /**
     * Mettre à jour les statistiques
     */
    updateStats() {
        const totalElement = document.getElementById('total-workspaces');
        const selectedElement = document.getElementById('selected-workspaces');
        const activeElement = document.getElementById('active-workspace');

        if (totalElement) totalElement.textContent = this.workspaces.length;
        if (selectedElement) selectedElement.textContent = this.selectedWorkspaces.size;
        if (activeElement) activeElement.textContent = this.currentWorkspace || 'Aucun';
    }

    /**
     * Basculer la sélection d'un workspace
     */
    toggleWorkspaceSelection(workspaceName) {
        if (this.selectedWorkspaces.has(workspaceName)) {
            this.selectedWorkspaces.delete(workspaceName);
        } else {
            this.selectedWorkspaces.add(workspaceName);
        }
        this.updateStats();
        this.updateBulkActions();
    }

    /**
     * Sélectionner tous les workspaces
     */
    selectAllWorkspaces() {
        this.workspaces.forEach(ws => this.selectedWorkspaces.add(ws.name));
        this.renderWorkspacesList();
        this.updateStats();
        this.updateBulkActions();
    }

    /**
     * Désélectionner tous les workspaces
     */
    deselectAllWorkspaces() {
        this.selectedWorkspaces.clear();
        this.renderWorkspacesList();
        this.updateStats();
        this.updateBulkActions();
    }

    /**
     * Mettre à jour les actions groupées
     */
    updateBulkActions() {
        const deleteBtn = document.getElementById('delete-selected-btn');
        if (deleteBtn) {
            deleteBtn.disabled = this.selectedWorkspaces.size === 0;
        }
    }

    /**
     * Sélectionner un workspace actif
     */
    async selectWorkspace(workspaceName) {
        try {
            this.currentWorkspace = workspaceName;
            this.api.setCurrentWorkspace(workspaceName);
            
            this.renderWorkspacesList();
            this.updateStats();
            
            this.showSuccess(`Workspace "${workspaceName}" sélectionné`);
            
            // Déclencher un événement pour notifier les autres modules
            document.dispatchEvent(new CustomEvent('workspaceChanged', {
                detail: { workspaceName }
            }));
            
        } catch (error) {
            console.error('❌ Erreur sélection workspace:', error);
            this.showError('Erreur lors de la sélection du workspace');
        }
    }

    /**
     * Afficher le modal de création
     */
    showCreateModal() {
        const modal = document.getElementById('create-workspace-modal');
        if (modal) {
            modal.style.display = 'block';
            document.getElementById('workspace-name').focus();
        }
    }

    /**
     * Créer un nouveau workspace
     */
    async createWorkspace() {
        try {
            const name = document.getElementById('workspace-name').value.trim();
            const description = document.getElementById('workspace-description').value.trim();

            if (!name) {
                this.showError('Le nom du workspace est requis');
                return;
            }

            // Validation du nom
            if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
                this.showError('Le nom ne peut contenir que des lettres, chiffres, tirets et underscores');
                return;
            }

            const workspaceData = {
                name: name,
                description: description || `Workspace ${name}`
            };

            console.log('📡 Création workspace:', workspaceData);
            await this.api.createWorkspace(workspaceData);
            
            this.hideCreateModal();
            this.showSuccess(`Workspace "${name}" créé avec succès`);
            await this.loadWorkspaces();
            
        } catch (error) {
            console.error('❌ Erreur création workspace:', error);
            this.showError('Erreur lors de la création: ' + error.message);
        }
    }

    /**
     * Afficher le modal d'édition
     */
    async showEditModal(workspaceName) {
        try {
            const workspace = this.workspaces.find(ws => ws.name === workspaceName);
            if (!workspace) return;

            const modal = document.getElementById('edit-workspace-modal');
            if (modal) {
                document.getElementById('edit-workspace-name').value = workspace.name;
                document.getElementById('edit-workspace-description').value = workspace.description || '';
                document.getElementById('edit-workspace-original-name').value = workspace.name;
                
                modal.style.display = 'block';
                document.getElementById('edit-workspace-description').focus();
            }
        } catch (error) {
            console.error('❌ Erreur affichage modal édition:', error);
        }
    }

    /**
     * Mettre à jour un workspace
     */
    async updateWorkspace() {
        try {
            const originalName = document.getElementById('edit-workspace-original-name').value;
            const name = document.getElementById('edit-workspace-name').value.trim();
            const description = document.getElementById('edit-workspace-description').value.trim();

            if (!name) {
                this.showError('Le nom du workspace est requis');
                return;
            }

            const workspaceData = {
                name: name,
                description: description || `Workspace ${name}`
            };

            console.log('📡 Mise à jour workspace:', workspaceData);
            await this.api.updateWorkspace(originalName, workspaceData);
            
            this.hideEditModal();
            this.showSuccess(`Workspace "${name}" mis à jour avec succès`);
            await this.loadWorkspaces();
            
        } catch (error) {
            console.error('❌ Erreur mise à jour workspace:', error);
            this.showError('Erreur lors de la mise à jour: ' + error.message);
        }
    }

    /**
     * Supprimer un workspace
     */
    async deleteWorkspace(workspaceName) {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer le workspace "${workspaceName}" ?\n\nCette action est irréversible et supprimera toutes les données associées.`)) {
            return;
        }

        try {
            console.log('📡 Suppression workspace:', workspaceName);
            await this.api.deleteWorkspace(workspaceName);
            
            this.showSuccess(`Workspace "${workspaceName}" supprimé avec succès`);
            
            // Si c'était le workspace actuel, le désélectionner
            if (this.currentWorkspace === workspaceName) {
                this.currentWorkspace = null;
                this.api.setCurrentWorkspace(null);
            }
            
            await this.loadWorkspaces();
            
        } catch (error) {
            console.error('❌ Erreur suppression workspace:', error);
            this.showError('Erreur lors de la suppression: ' + error.message);
        }
    }

    /**
     * Supprimer les workspaces sélectionnés
     */
    async deleteSelectedWorkspaces() {
        const count = this.selectedWorkspaces.size;
        if (count === 0) return;

        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${count} workspace(s) ?\n\nCette action est irréversible.`)) {
            return;
        }

        try {
            const promises = Array.from(this.selectedWorkspaces).map(name => 
                this.api.deleteWorkspace(name)
            );
            
            await Promise.all(promises);
            
            this.selectedWorkspaces.clear();
            this.showSuccess(`${count} workspace(s) supprimé(s) avec succès`);
            await this.loadWorkspaces();
            
        } catch (error) {
            console.error('❌ Erreur suppression groupée:', error);
            this.showError('Erreur lors de la suppression groupée: ' + error.message);
        }
    }

    /**
     * Masquer le modal de création
     */
    hideCreateModal() {
        const modal = document.getElementById('create-workspace-modal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('create-workspace-form').reset();
        }
    }

    /**
     * Masquer le modal d'édition
     */
    hideEditModal() {
        const modal = document.getElementById('edit-workspace-modal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('edit-workspace-form').reset();
        }
    }

    /**
     * Afficher/masquer le loading
     */
    showLoading(show) {
        const loader = document.getElementById('workspaces-loading');
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Afficher un message de succès
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Afficher un message d'erreur
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Afficher un message
     */
    showMessage(message, type = 'info') {
        const container = document.getElementById('messages-container');
        if (!container) return;

        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
            <button class="message-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(messageEl);

        // Auto-suppression après 5 secondes
        setTimeout(() => {
            if (messageEl.parentElement) {
                messageEl.remove();
            }
        }, 5000);
    }

    /**
     * Formater une date
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
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
            
            const matches = name.includes(term) || description.includes(term);
            card.style.display = matches ? 'block' : 'none';
        });
    }

    // === ALIAS METHODS pour compatibilité avec workspaces.html ===

    /**
     * Alias pour showCreateModal()
     */
    openCreateModal() {
        this.showCreateModal();
    }

    /**
     * Alias pour hideModal()
     */
    closeModal() {
        this.hideModal();
    }

    /**
     * Créer un workspace (méthode simplifiée pour workspaces.html)
     */
    async createWorkspace(name, description) {
        try {
            console.log('🆕 Création workspace:', { name, description });
            
            const newWorkspace = await this.api.createWorkspace({
                name: name,
                description: description
            });
            
            console.log('✅ Workspace créé:', newWorkspace);
            this.showSuccess(`Workspace "${name}" créé avec succès`);
            await this.loadWorkspaces();
            
        } catch (error) {
            console.error('❌ Erreur création workspace:', error);
            throw error;
        }
    }

    /**
     * Mettre à jour un workspace (méthode simplifiée pour workspaces.html)
     */
    async updateWorkspace(name, data) {
        try {
            console.log('📝 Mise à jour workspace:', { name, data });
            
            const updatedWorkspace = await this.api.updateWorkspace(name, data);
            
            console.log('✅ Workspace mis à jour:', updatedWorkspace);
            this.showSuccess(`Workspace "${name}" mis à jour avec succès`);
            await this.loadWorkspaces();
            
        } catch (error) {
            console.error('❌ Erreur mise à jour workspace:', error);
            throw error;
        }
    }

    /**
     * Ouvrir un workspace (redirection vers interface principale)
     */
    openWorkspace(name) {
        const currentUrl = window.location.href;
        const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
        window.location.href = `${baseUrl}/index.html?workspace=${encodeURIComponent(name)}`;
    }

    /**
     * Éditer un workspace
     */
    editWorkspace(name) {
        const workspace = this.workspaces.find(w => w.name === name);
        if (!workspace) return;

        // Préremplir le formulaire et ouvrir le modal
        this.currentEditingId = name;
        this.showEditModal(workspace);
    }

    /**
     * Supprimer un workspace avec confirmation
     */
    async deleteWorkspace(name) {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer le workspace "${name}" ?\n\nCette action est irréversible et supprimera toutes les données associées.`)) {
            return;
        }

        try {
            console.log('🗑️ Suppression workspace:', name);
            
            await this.api.deleteWorkspace(name);
            
            console.log('✅ Workspace supprimé:', name);
            this.showSuccess(`Workspace "${name}" supprimé avec succès`);
            await this.loadWorkspaces();
            
        } catch (error) {
            console.error('❌ Erreur suppression workspace:', error);
            this.showError(`Erreur lors de la suppression: ${error.message}`);
        }
    }

    /**
     * Mettre à jour les statistiques globales
     */
    updateStats() {
        const total = this.workspaces.length;
        const active = this.workspaces.filter(w => w.active !== false).length;
        
        // Calculer les statistiques des hosts et vulnérabilités
        let totalHosts = 0;
        let totalVulns = 0;
        
        this.workspaces.forEach(workspace => {
            if (workspace.stats) {
                totalHosts += workspace.stats.hosts || 0;
                totalVulns += workspace.stats.vulnerabilities || 0;
            }
        });

        // Mettre à jour les éléments DOM
        const totalEl = document.getElementById('totalWorkspaces');
        const activeEl = document.getElementById('activeWorkspaces');
        const hostsEl = document.getElementById('totalHosts');
        const vulnsEl = document.getElementById('totalVulns');

        if (totalEl) totalEl.textContent = total;
        if (activeEl) activeEl.textContent = active;
        if (hostsEl) hostsEl.textContent = totalHosts;
        if (vulnsEl) vulnsEl.textContent = totalVulns;
    }

    /**
     * Afficher le state de chargement
     */
    showLoading(show) {
        const loadingEl = document.getElementById('loadingMessage');
        const containerEl = document.getElementById('workspacesContainer');
        const emptyEl = document.getElementById('emptyState');

        if (loadingEl) loadingEl.style.display = show ? 'block' : 'none';
        if (containerEl) containerEl.style.display = show ? 'none' : 'block';
        if (emptyEl) emptyEl.style.display = 'none';
    }

    /**
     * Renderiser la liste des workspaces pour workspaces.html
     */
    renderWorkspaces() {
        const container = document.getElementById('workspacesContainer');
        const emptyState = document.getElementById('emptyState');

        if (!container) return;

        if (this.workspaces.length === 0) {
            container.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = this.workspaces.map(workspace => this.renderWorkspaceCard(workspace)).join('');
    }

    /**
     * Renderiser une carte de workspace
     */
    renderWorkspaceCard(workspace) {
        const stats = workspace.stats || {};
        const isActive = workspace.active !== false;
        
        return `
            <div class="workspace-card ${isActive ? 'workspace-active' : ''}" data-workspace="${workspace.name}">
                <div class="workspace-header">
                    <h3>${workspace.name}</h3>
                    <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">
                        ${isActive ? 'Actif' : 'Inactif'}
                    </span>
                </div>
                
                <div class="workspace-description">
                    ${workspace.description || 'Aucune description disponible'}
                </div>
                
                <div class="workspace-stats">
                    <div class="workspace-stat">
                        <div class="number">${stats.hosts || 0}</div>
                        <div class="label">Hosts</div>
                    </div>
                    <div class="workspace-stat">
                        <div class="number">${stats.vulnerabilities || 0}</div>
                        <div class="label">Vulns</div>
                    </div>
                    <div class="workspace-stat">
                        <div class="number">${stats.services || 0}</div>
                        <div class="label">Services</div>
                    </div>
                </div>
                
                <div class="workspace-actions">
                    <button class="btn btn-primary btn-small" onclick="workspaceManager.openWorkspace('${workspace.name}')">
                        <i class="fas fa-eye"></i> Ouvrir
                    </button>
                    <button class="btn btn-warning btn-small" onclick="workspaceManager.editWorkspace('${workspace.name}')">
                        <i class="fas fa-edit"></i> Éditer
                    </button>
                    <button class="btn btn-danger btn-small" onclick="workspaceManager.deleteWorkspace('${workspace.name}')">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </div>
        `;
    }
}

// Initialisation globale
let workspaceManager = null;
