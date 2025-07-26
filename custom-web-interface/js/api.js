/**
 * Faraday API Client
 * Gère les interactions avec l'API REST de Faraday
 */

class FaradayAPI {
    constructor() {
        // CONFIGURATION FIXE BASÉE SUR LA PAGE QUI FONCTIONNE
        this.isUsingProxy = window.location.port === '8888'; // Interface sur 8888 = utiliser proxy
        this.baseURL = this.isUsingProxy ? 'http://localhost:8082' : 'http://localhost:5985';  // CORRECTION: Sans /proxy
        this.apiVersion = '_api/v3';
        this.csrfToken = null;
        this.sessionCookie = null;
        this.currentWorkspace = null;
        this.socket = null;
        // Configurer les credentials par défaut pour faraday/faraday
        this.credentials = btoa('faraday:faraday');
        
        // Debug forcé pour vérifier la configuration
        console.log(`🔧 API Configuration CORRIGÉE (basée sur test-port-8082.html):`, {
            baseURL: this.baseURL,
            usingProxy: this.isUsingProxy,
            currentPort: window.location.port,
            hasCredentials: !!this.credentials,
            finalURL: `${this.baseURL}/${this.apiVersion}/ws`,
            windowLocation: window.location.href
        });
        
        // Alerte pour confirmer la configuration
        if (this.isUsingProxy) {
            console.warn(`✅ CONFIGURATION PROXY CORRIGÉE: ${this.baseURL}/_api/v3/`);
        }
    }

    /**
     * Configuration de l'URL de base
     */
    setBaseURL(url) {
        this.baseURL = url.replace(/\/$/, ''); // Supprimer le slash final
    }

    /**
     * Obtenir l'URL complète pour un endpoint
     */
    getURL(endpoint) {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        let finalUrl;
        
        if (this.isUsingProxy) {
            // Pour le proxy, utiliser le chemin complet de l'API
            finalUrl = `${this.baseURL}/${this.apiVersion}/${cleanEndpoint}`;
        } else {
            finalUrl = `${this.baseURL}/${this.apiVersion}/${cleanEndpoint}`;
        }
        
        // Debug explicite pour voir l'URL finale
        console.log(`🌐 URL construite pour "${endpoint}": ${finalUrl}`);
        console.log(`🔧 Détails: proxy=${this.isUsingProxy}, baseURL=${this.baseURL}`);
        
        return finalUrl;
    }

    /**
     * Obtenir l'URL de base (sans API version) pour les endpoints d'authentification
     */
    getBaseURL(endpoint) {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        return `${this.baseURL}/${cleanEndpoint}`;
    }

    /**
     * Effectuer une requête HTTP avec gestion des erreurs
     */
    async request(method, endpoint, data = null, headers = {}, useBaseURL = false) {
        const url = useBaseURL ? this.getBaseURL(endpoint) : this.getURL(endpoint);
        
        const config = {
            method: method.toUpperCase(),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...headers
            },
            mode: 'cors'
            // Ne pas utiliser credentials: 'include' car cela cause des problèmes CORS
        };

        // Ajouter l'authentification Basic Auth si les credentials sont disponibles
        if (this.credentials) {
            config.headers['Authorization'] = `Basic ${this.credentials}`;
        }

        // Ajouter le token CSRF si disponible
        if (this.csrfToken) {
            config.headers['X-CSRFToken'] = this.csrfToken;
        }

        // Pour les endpoints d'authentification, utiliser application/x-www-form-urlencoded
        if (useBaseURL && data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            config.body = new URLSearchParams(data).toString();
        } else if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            config.body = JSON.stringify(data);
        }

        try {
            console.log(`🌐 Requête ${method} vers: ${url}`);
            console.log('📋 Headers:', config.headers);
            
            const response = await fetch(url, config);
            
            console.log(`📡 Réponse: ${response.status} ${response.statusText}`);
            console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
            
            // Récupérer le token CSRF depuis les headers de réponse
            const csrfToken = response.headers.get('X-CSRFToken');
            if (csrfToken) {
                this.csrfToken = csrfToken;
            }

            if (!response.ok) {
                // Essayer de lire le contenu pour voir si c'est JSON ou HTML
                const contentType = response.headers.get('content-type') || '';
                let errorMessage;
                
                if (contentType.includes('application/json')) {
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
                    } catch (parseError) {
                        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    }
                } else {
                    // Si ce n'est pas du JSON, lire comme texte
                    const errorText = await response.text();
                    console.warn('⚠️ Réponse non-JSON reçue:', errorText.substring(0, 200));
                    errorMessage = `HTTP ${response.status}: ${response.statusText}. Réponse non-JSON reçue.`;
                }
                
                throw new Error(errorMessage);
            }

            // Vérifier le content-type avant de parser en JSON
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const textContent = await response.text();
                console.warn('⚠️ Réponse non-JSON reçue:', textContent.substring(0, 200));
                throw new Error('La réponse du serveur Faraday n\'est pas au format JSON attendu. Vérifiez que le serveur fonctionne correctement.');
            }

            return await response.json();
        } catch (error) {
            // Gestion spéciale des erreurs CORS
            if (error.message.includes('CORS') || error.name === 'TypeError' && error.message.includes('fetch')) {
                console.warn('⚠️ Erreur CORS détectée, tentative avec mode no-cors...');
                
                try {
                    // Retry avec no-cors pour les requêtes GET simples
                    if (method.toUpperCase() === 'GET') {
                        const noCorsConfig = {
                            ...config,
                            mode: 'no-cors'
                        };
                        const noCorsResponse = await fetch(url, noCorsConfig);
                        // Avec no-cors, on ne peut pas lire la réponse, donc on simule
                        console.log('✅ Requête no-cors réussie (réponse opaque)');
                        return {}; // Retour vide car on ne peut pas lire la réponse
                    }
                } catch (noCorsError) {
                    console.error('❌ Échec même avec no-cors:', noCorsError);
                }
                
                throw new Error(`Erreur CORS: Impossible d'accéder à l'API Faraday. 
                    Assurez-vous que:
                    1. Faraday est démarré sur ${this.baseURL}
                    2. Vous accédez à l'interface via http:// (pas file://)
                    3. Les CORS sont configurés sur le serveur Faraday`);
            }
            
            console.error(`❌ Erreur API ${method} ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Méthodes HTTP simplifiées
     */
    async get(endpoint, headers = {}) {
        return this.request('GET', endpoint, null, headers);
    }

    async post(endpoint, data, headers = {}) {
        return this.request('POST', endpoint, data, headers);
    }

    async put(endpoint, data, headers = {}) {
        return this.request('PUT', endpoint, data, headers);
    }

    async patch(endpoint, data, headers = {}) {
        return this.request('PATCH', endpoint, data, headers);
    }

    async delete(endpoint, headers = {}) {
        return this.request('DELETE', endpoint, null, headers);
    }

    /**
     * AUTHENTIFICATION
     */

    /**
     * Connexion avec nom d'utilisateur et mot de passe
     */
    async login(username, password) {
        try {
            // Stocker les credentials pour Basic Auth
            this.credentials = btoa(`${username}:${password}`);
            
            console.log('🔑 Tentative de connexion pour:', username);
            console.log('🌐 Mode:', this.isUsingProxy ? 'Proxy CORS' : 'Direct');
            console.log('🌐 URL de base:', this.baseURL);
            
            // Test simple avec l'endpoint info d'abord
            console.log('🔍 Test de l\'endpoint info...');
            let infoResponse;
            try {
                infoResponse = await fetch(`${this.baseURL}/_api/v3/info`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${this.credentials}`,
                        'Accept': 'application/json'
                    },
                    mode: 'cors'
                });
                
                console.log('📡 Réponse info status:', infoResponse.status);
                console.log('📡 Réponse info headers:', Object.fromEntries(infoResponse.headers.entries()));
                
                if (infoResponse.ok) {
                    const infoText = await infoResponse.text();
                    console.log('📡 Réponse info raw:', infoText);
                    
                    try {
                        const infoData = JSON.parse(infoText);
                        console.log('✅ Info JSON parsé:', infoData);
                        
                        if (infoData && (infoData.Version || infoData['Faraday Server'])) {
                            console.log('✅ Connexion confirmée via info!');
                            this.currentUser = username;
                            return {
                                success: true,
                                user: { username: username },
                                version: infoData.Version || '5.14.1',
                                mode: this.isUsingProxy ? 'Proxy CORS' : 'Direct',
                                realConnection: true,
                                serverData: infoData
                            };
                        }
                    } catch (parseError) {
                        console.warn('⚠️ Réponse info n\'est pas du JSON:', infoText.substring(0, 200));
                    }
                }
            } catch (infoError) {
                console.log('❌ Erreur test info:', infoError.message);
            }
            
            // Si info échoue, tester avec workspaces
            console.log('🔍 Test de l\'endpoint workspaces...');
            const wsResponse = await fetch(`${this.baseURL}/_api/v3/ws`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${this.credentials}`,
                    'Accept': 'application/json'
                },
                mode: 'cors'
            });
            
            console.log('📡 Réponse ws status:', wsResponse.status);
            console.log('📡 Réponse ws headers:', Object.fromEntries(wsResponse.headers.entries()));
            
            if (wsResponse.ok) {
                const wsText = await wsResponse.text();
                console.log('📡 Réponse ws raw:', wsText.substring(0, 300));
                
                try {
                    const wsData = JSON.parse(wsText);
                    console.log('✅ WS JSON parsé:', wsData);
                    
                    // Vérifier si la réponse contient les données attendues de Faraday (workspaces)
                    if (wsData && (wsData.rows || Array.isArray(wsData) || 
                         (typeof wsData === 'object' && Object.keys(wsData).length > 0))) {
                        
                        // L'authentification a réussi, stocker les informations
                        this.currentUser = username;
                        console.log('✅ Connexion réelle réussie via workspaces!');
                        return {
                            success: true,
                            user: { username: username },
                            version: '5.14.1',
                            mode: this.isUsingProxy ? 'Proxy CORS' : 'Direct',
                            realConnection: true,
                            serverData: wsData,
                            workspaces: wsData.rows || wsData || []
                        };
                    }
                } catch (parseError) {
                    console.warn('⚠️ Réponse ws n\'est pas du JSON:', wsText.substring(0, 200));
                    
                    // Si c'est du HTML, c'est probablement une page de login
                    if (wsText.includes('<html') || wsText.includes('<!DOCTYPE')) {
                        throw new Error('Authentification échouée - le serveur a retourné une page de login HTML. Vérifiez vos identifiants.');
                    }
                }
            } else if (wsResponse.status === 401) {
                throw new Error('Authentification échouée - nom d\'utilisateur ou mot de passe incorrect.');
            } else if (wsResponse.status === 403) {
                throw new Error('Accès refusé - permissions insuffisantes.');
            }
            
            throw new Error('La réponse du serveur Faraday n\'est pas au format attendu. Vérifiez que le serveur fonctionne correctement.');
            
        } catch (error) {
            console.error('❌ Erreur de connexion:', error);
            
            // Ne pas basculer automatiquement en mode simulation pour les erreurs de format
            if (error.message.includes('Réponse de connexion invalide - format inattendu') ||
                error.message.includes('format attendu') ||
                error.message.includes('page de login HTML')) {
                this.credentials = null;
                throw error;
            }
            
            // Basculer en mode simulation seulement pour les erreurs de réseau/CORS réelles
            if (error.message.includes('CORS') || 
                error.message.includes('Failed to fetch') ||
                error.message.includes('ERR_FAILED') ||
                error.message.includes('ERR_ABORTED') ||
                error.message.includes('net::') ||
                error.name === 'TypeError') {
                
                console.warn('⚠️ Mode développement activé - Problème de réseau/CORS détecté');
                console.log('Raison:', error.message);
                
                // Vérifier que les credentials sont corrects (simulation)
                if (username === 'faraday' && password === 'faraday') {
                    this.currentUser = username;
                    this.credentials = btoa(`${username}:${password}`);
                    
                    console.log('✅ Connexion simulée en mode développement');
                    
                    return {
                        success: true,
                        user: { username: username },
                        version: '5.14.1 (Mode Dev)',
                        mode: 'Simulation',
                        mock: true
                    };
                } else {
                    this.credentials = null;
                    throw new Error('Nom d\'utilisateur ou mot de passe incorrect. Utilisez: faraday/faraday');
                }
            }
            
            // Pour toutes les autres erreurs (401, etc.), les relancer directement
            this.credentials = null;
            throw error;
        }
    }

    /**
     * Déconnexion
     */
    async logout() {
        try {
            await this.request('GET', 'logout', null, {}, true);  // useBaseURL = true
            this.csrfToken = null;
            this.currentWorkspace = null;
            if (this.socket) {
                this.socket.disconnect();
                this.socket = null;
            }
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
            throw error;
        }
    }

    /**
     * Vérifier l'état de la session
     */
    async checkSession() {
        try {
            const response = await this.get('session');
            return response;
        } catch (error) {
            return null;
        }
    }

    /**
     * WORKSPACES
     */

    /**
     * Obtenir la liste des workspaces
     */
    async getWorkspaces() {
        return this.get('ws');
    }

    /**
     * Obtenir les détails d'un workspace
     */
    async getWorkspace(workspaceName) {
        return this.get(`ws/${workspaceName}`);
    }

    /**
     * Créer un nouveau workspace
     */
    async createWorkspace(data) {
        return this.post('ws', data);
    }

    /**
     * Supprimer un workspace
     */
    async deleteWorkspace(workspaceName) {
        return this.delete(`ws/${workspaceName}`);
    }

    /**
     * Mettre à jour un workspace
     */
    async updateWorkspace(workspaceName, data) {
        return this.put(`ws/${workspaceName}`, data);
    }

    /**
     * Définir le workspace actuel
     */
    setCurrentWorkspace(workspaceName) {
        this.currentWorkspace = workspaceName;
    }

    /**
     * HOSTS
     */

    /**
     * Obtenir la liste des hosts
     */
    async getHosts(workspaceName = null, params = {}) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');

        const queryParams = new URLSearchParams(params).toString();
        const endpoint = `ws/${ws}/hosts${queryParams ? '?' + queryParams : ''}`;
        return this.get(endpoint);
    }

    /**
     * Obtenir un host spécifique
     */
    async getHost(hostId, workspaceName = null) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');
        return this.get(`ws/${ws}/hosts/${hostId}`);
    }

    /**
     * Créer un nouveau host
     */
    async createHost(data, workspaceName = null) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');
        return this.post(`ws/${ws}/hosts`, data);
    }

    /**
     * Mettre à jour un host
     */
    async updateHost(hostId, data, workspaceName = null) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');
        return this.put(`ws/${ws}/hosts/${hostId}`, data);
    }

    /**
     * Supprimer un host
     */
    async deleteHost(hostId, workspaceName = null) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');
        return this.delete(`ws/${ws}/hosts/${hostId}`);
    }

    /**
     * SERVICES
     */

    /**
     * Obtenir la liste des services
     */
    async getServices(workspaceName = null, params = {}) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');

        const queryParams = new URLSearchParams(params).toString();
        const endpoint = `ws/${ws}/services${queryParams ? '?' + queryParams : ''}`;
        return this.get(endpoint);
    }

    /**
     * Obtenir un service spécifique
     */
    async getService(serviceId, workspaceName = null) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');
        return this.get(`ws/${ws}/services/${serviceId}`);
    }

    /**
     * Créer un nouveau service
     */
    async createService(data, workspaceName = null) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');
        return this.post(`ws/${ws}/services`, data);
    }

    /**
     * VULNÉRABILITÉS
     */

    /**
     * Obtenir la liste des vulnérabilités
     */
    async getVulnerabilities(workspaceName = null, params = {}) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');

        const queryParams = new URLSearchParams(params).toString();
        const endpoint = `ws/${ws}/vulns${queryParams ? '?' + queryParams : ''}`;
        return this.get(endpoint);
    }

    /**
     * Obtenir une vulnérabilité spécifique
     */
    async getVulnerability(vulnId, workspaceName = null) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');
        return this.get(`ws/${ws}/vulns/${vulnId}`);
    }

    /**
     * Créer une nouvelle vulnérabilité
     */
    async createVulnerability(data, workspaceName = null) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');
        return this.post(`ws/${ws}/vulns`, data);
    }

    /**
     * Mettre à jour une vulnérabilité
     */
    async updateVulnerability(vulnId, data, workspaceName = null) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');
        return this.put(`ws/${ws}/vulns/${vulnId}`, data);
    }

    /**
     * COMMANDES
     */

    /**
     * Obtenir la liste des commandes
     */
    async getCommands(workspaceName = null, params = {}) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');

        const queryParams = new URLSearchParams(params).toString();
        const endpoint = `ws/${ws}/commands${queryParams ? '?' + queryParams : ''}`;
        return this.get(endpoint);
    }

    /**
     * Obtenir une commande spécifique
     */
    async getCommand(commandId, workspaceName = null) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');
        return this.get(`ws/${ws}/commands/${commandId}`);
    }

    /**
     * Créer une nouvelle commande
     */
    async createCommand(data, workspaceName = null) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');
        return this.post(`ws/${ws}/commands`, data);
    }

    /**
     * AGENTS
     */

    /**
     * Obtenir la liste des agents
     */
    async getAgents(workspaceName = null) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');
        return this.get(`ws/${ws}/agents`);
    }

    /**
     * Obtenir un agent spécifique
     */
    async getAgent(agentId, workspaceName = null) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');
        return this.get(`ws/${ws}/agents/${agentId}`);
    }

    /**
     * Créer un nouvel agent
     */
    async createAgent(data, workspaceName = null) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');
        return this.post(`ws/${ws}/agents`, data);
    }

    /**
     * Supprimer un agent
     */
    async deleteAgent(agentId, workspaceName = null) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');
        return this.delete(`ws/${ws}/agents/${agentId}`);
    }

    /**
     * ACTIVITÉ
     */

    /**
     * Obtenir le flux d'activité
     */
    async getActivityFeed(workspaceName = null, params = {}) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');

        const queryParams = new URLSearchParams(params).toString();
        const endpoint = `ws/${ws}/activities${queryParams ? '?' + queryParams : ''}`;
        return this.get(endpoint);
    }

    /**
     * STATISTIQUES
     */

    /**
     * Obtenir les statistiques du workspace
     */
    async getWorkspaceStats(workspaceName = null) {
        const ws = workspaceName || this.currentWorkspace;
        if (!ws) throw new Error('Aucun workspace sélectionné');
        
        try {
            // Obtenir les données en parallèle
            const [hosts, services, vulns, commands] = await Promise.all([
                this.getHosts(ws),
                this.getServices(ws),
                this.getVulnerabilities(ws),
                this.getCommands(ws)
            ]);

            return {
                hosts: hosts.length || 0,
                services: services.length || 0,
                vulnerabilities: vulns.length || 0,
                commands: commands.length || 0,
                hostsData: hosts,
                servicesData: services,
                vulnerabilitiesData: vulns,
                commandsData: commands
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            return {
                hosts: 0,
                services: 0,
                vulnerabilities: 0,
                commands: 0,
                hostsData: [],
                servicesData: [],
                vulnerabilitiesData: [],
                commandsData: []
            };
        }
    }

    /**
     * WEBSOCKET CONNECTIONS
     */

    /**
     * Initialiser la connexion WebSocket
     */
    initWebSocket() {
        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io(this.baseURL, {
            transports: ['websocket', 'polling'],
            withCredentials: true
        });

        this.socket.on('connect', () => {
            console.log('WebSocket connecté');
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket déconnecté');
        });

        this.socket.on('error', (error) => {
            console.error('Erreur WebSocket:', error);
        });

        return this.socket;
    }

    /**
     * S'abonner aux mises à jour d'un workspace
     */
    subscribeToWorkspace(workspaceName) {
        if (!this.socket) {
            this.initWebSocket();
        }

        this.socket.emit('join-workspace', { workspace: workspaceName });
    }

    /**
     * Se désabonner des mises à jour d'un workspace
     */
    unsubscribeFromWorkspace(workspaceName) {
        if (this.socket) {
            this.socket.emit('leave-workspace', { workspace: workspaceName });
        }
    }

    /**
     * UTILITAIRES
     */

    /**
     * Obtenir l'URL d'un avatar par défaut
     */
    getDefaultAvatar(name) {
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        const colorIndex = name.length % colors.length;
        const initial = name.charAt(0).toUpperCase();
        
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="20" fill="${colors[colorIndex]}"/>
                <text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">${initial}</text>
            </svg>
        `)}`;
    }

    /**
     * Formater une date
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Formater la durée
     */
    formatDuration(seconds) {
        if (!seconds) return 'N/A';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    /**
     * Obtenir la classe CSS pour la sévérité
     */
    getSeverityClass(severity) {
        const severityMap = {
            'critical': 'severity-critical',
            'high': 'severity-high',
            'medium': 'severity-medium',
            'low': 'severity-low',
            'info': 'severity-info',
            'informational': 'severity-info'
        };
        
        return severityMap[severity?.toLowerCase()] || 'severity-info';
    }

    /**
     * Obtenir la classe CSS pour le statut
     */
    getStatusClass(status) {
        const statusMap = {
            'confirmed': 'status-confirmed',
            'open': 'status-open',
            'closed': 'status-closed',
            're-opened': 'status-open',
            'risk-accepted': 'status-closed',
            'false-positive': 'status-closed'
        };
        
        return statusMap[status?.toLowerCase()] || 'status-open';
    }
}

// Exporter l'instance API globale
window.faradayAPI = new FaradayAPI();
