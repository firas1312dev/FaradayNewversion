/**
 * Gestionnaire d'authentification pour l'interface Faraday
 */

class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.loginModal = null;
        this.initializeAuth();
    }

    /**
     * Initialiser le système d'authentification
     */
    initializeAuth() {
        this.loginModal = document.getElementById('loginModal');
        this.setupLoginForm();
        this.setupLogoutButton();
        this.checkAuthenticationStatus();
    }

    /**
     * Configurer le formulaire de connexion
     */
    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const loginError = document.getElementById('loginError');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(loginForm);
            const credentials = {
                username: formData.get('username'),
                password: formData.get('password'),
                server: formData.get('server')
            };

            await this.performLogin(credentials, loginError);
        });
    }

    /**
     * Configurer le bouton de déconnexion
     */
    setupLogoutButton() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.performLogout();
            });
        }
    }

    /**
     * Effectuer la connexion
     */
    async performLogin(credentials, errorElement) {
        try {
            // Afficher le loading
            this.showLoading('Connexion en cours...');
            
            // Configurer l'URL du serveur Faraday
            faradayAPI.setBaseURL(credentials.server);
            
            // Tenter la connexion
            const response = await faradayAPI.login(credentials.username, credentials.password);
            
            if (response && response.user) {
                this.isAuthenticated = true;
                this.currentUser = response.user;
                
                // Masquer le modal de connexion
                this.hideLoginModal();
                
                // Afficher l'application
                this.showApplication();
                
                // Charger les données initiales
                await this.loadInitialData();
                
                // Initialiser WebSocket
                faradayAPI.initWebSocket();
                
                // Afficher notification de succès
                this.showNotification('Connexion réussie !', 'success');
                
            } else {
                throw new Error('Réponse de connexion invalide');
            }
            
        } catch (error) {
            console.error('Erreur de connexion:', error);
            this.showLoginError(errorElement, error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Effectuer la déconnexion
     */
    async performLogout() {
        try {
            await faradayAPI.logout();
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            this.isAuthenticated = false;
            this.currentUser = null;
            this.showLoginModal();
            this.hideApplication();
            this.showNotification('Déconnexion réussie', 'info');
        }
    }

    /**
     * Vérifier le statut d'authentification au chargement
     */
    async checkAuthenticationStatus() {
        try {
            const session = await faradayAPI.checkSession();
            if (session && session.user) {
                this.isAuthenticated = true;
                this.currentUser = session.user;
                this.showApplication();
                await this.loadInitialData();
                faradayAPI.initWebSocket();
            } else {
                this.showLoginModal();
            }
        } catch (error) {
            console.log('Aucune session active, affichage du formulaire de connexion');
            this.showLoginModal();
        }
    }

    /**
     * Charger les données initiales après connexion
     */
    async loadInitialData() {
        try {
            // Charger les workspaces
            await this.loadWorkspaces();
            
            // Mettre à jour les informations utilisateur
            this.updateUserInfo();
            
        } catch (error) {
            console.error('Erreur lors du chargement des données initiales:', error);
            this.showNotification('Erreur lors du chargement des données', 'error');
        }
    }

    /**
     * Charger la liste des workspaces
     */
    async loadWorkspaces() {
        try {
            const workspaces = await faradayAPI.getWorkspaces();
            const workspaceSelect = document.getElementById('workspaceSelect');
            
            if (workspaceSelect && workspaces) {
                // Vider le select
                workspaceSelect.innerHTML = '<option value="">Sélectionner un workspace...</option>';
                
                // Ajouter les workspaces
                workspaces.forEach(workspace => {
                    const option = document.createElement('option');
                    option.value = workspace.name;
                    option.textContent = workspace.name;
                    workspaceSelect.appendChild(option);
                });
                
                // Sélectionner le premier workspace par défaut
                if (workspaces.length > 0) {
                    workspaceSelect.value = workspaces[0].name;
                    faradayAPI.setCurrentWorkspace(workspaces[0].name);
                    
                    // Charger le dashboard pour ce workspace
                    if (window.dashboardManager) {
                        await window.dashboardManager.loadDashboard();
                    }
                }
                
                // Écouter les changements de workspace
                workspaceSelect.addEventListener('change', async (e) => {
                    const selectedWorkspace = e.target.value;
                    if (selectedWorkspace) {
                        faradayAPI.setCurrentWorkspace(selectedWorkspace);
                        faradayAPI.subscribeToWorkspace(selectedWorkspace);
                        
                        // Recharger les données du dashboard
                        if (window.dashboardManager) {
                            await window.dashboardManager.loadDashboard();
                        }
                        
                        this.showNotification(`Workspace "${selectedWorkspace}" sélectionné`, 'info');
                    }
                });
            }
        } catch (error) {
            console.error('Erreur lors du chargement des workspaces:', error);
            this.showNotification('Erreur lors du chargement des workspaces', 'error');
        }
    }

    /**
     * Mettre à jour les informations utilisateur dans l'interface
     */
    updateUserInfo() {
        const currentUserElement = document.getElementById('currentUser');
        if (currentUserElement && this.currentUser) {
            currentUserElement.textContent = this.currentUser.username || this.currentUser.email || 'Utilisateur';
        }
    }

    /**
     * Afficher le modal de connexion
     */
    showLoginModal() {
        if (this.loginModal) {
            this.loginModal.style.display = 'flex';
        }
    }

    /**
     * Masquer le modal de connexion
     */
    hideLoginModal() {
        if (this.loginModal) {
            this.loginModal.style.display = 'none';
        }
    }

    /**
     * Afficher l'application principale
     */
    showApplication() {
        const app = document.getElementById('app');
        if (app) {
            app.style.display = 'block';
        }
    }

    /**
     * Masquer l'application principale
     */
    hideApplication() {
        const app = document.getElementById('app');
        if (app) {
            app.style.display = 'none';
        }
    }

    /**
     * Afficher une erreur de connexion
     */
    showLoginError(errorElement, message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Masquer l'erreur après 5 secondes
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Afficher le loading overlay
     */
    showLoading(message = 'Chargement en cours...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            const loadingText = loadingOverlay.querySelector('p');
            if (loadingText) {
                loadingText.textContent = message;
            }
            loadingOverlay.style.display = 'flex';
        }
    }

    /**
     * Masquer le loading overlay
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    /**
     * Afficher une notification toast
     */
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notificationMessage');
        
        if (notification && notificationMessage) {
            // Nettoyer les classes précédentes
            notification.className = 'notification';
            
            // Ajouter la classe de type
            if (type !== 'info') {
                notification.classList.add(type);
            }
            
            // Définir le message
            notificationMessage.textContent = message;
            
            // Afficher la notification
            notification.style.display = 'flex';
            
            // Masquer automatiquement après 5 secondes
            setTimeout(() => {
                this.hideNotification();
            }, 5000);
        }
    }

    /**
     * Masquer la notification
     */
    hideNotification() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.style.display = 'none';
        }
    }

    /**
     * Configurer le bouton de fermeture de notification
     */
    setupNotificationClose() {
        const closeNotification = document.getElementById('closeNotification');
        if (closeNotification) {
            closeNotification.addEventListener('click', () => {
                this.hideNotification();
            });
        }
    }

    /**
     * Obtenir l'état d'authentification
     */
    getAuthenticationState() {
        return {
            isAuthenticated: this.isAuthenticated,
            currentUser: this.currentUser,
            currentWorkspace: faradayAPI.currentWorkspace
        };
    }

    /**
     * Middleware pour vérifier l'authentification
     */
    requireAuth(callback) {
        if (this.isAuthenticated) {
            return callback();
        } else {
            this.showNotification('Vous devez être connecté pour effectuer cette action', 'warning');
            this.showLoginModal();
        }
    }

    /**
     * Middleware pour vérifier la sélection d'un workspace
     */
    requireWorkspace(callback) {
        if (faradayAPI.currentWorkspace) {
            return callback();
        } else {
            this.showNotification('Vous devez sélectionner un workspace', 'warning');
        }
    }
}

// Initialiser le gestionnaire d'authentification quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
    
    // Configurer la fermeture de notification
    window.authManager.setupNotificationClose();
});
