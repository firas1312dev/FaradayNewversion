/**
 * Faraday API Simple - Version directe pour connexion réelle
 */

class SimpleFaradayAPI {
    constructor() {
        this.baseURL = 'http://localhost:5985';
        this.apiVersion = '_api/v3';
        this.credentials = null;
    }

    /**
     * Effectuer une requête HTTP directe
     */
    async request(method, endpoint, data = null) {
        const url = `${this.baseURL}/${this.apiVersion}/${endpoint}`;
        
        console.log(`🌐 Requête ${method} vers: ${url}`);
        
        const config = {
            method: method.toUpperCase(),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors'
        };

        // Ajouter l'authentification si disponible
        if (this.credentials) {
            config.headers['Authorization'] = `Basic ${this.credentials}`;
        }

        // Ajouter le body pour POST/PUT
        if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, config);
            
            console.log(`📊 Statut: ${response.status}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`✅ Données reçues:`, result);
            return result;
            
        } catch (error) {
            console.error(`❌ Erreur requête:`, error);
            throw error;
        }
    }

    /**
     * Connexion avec authentification
     */
    async login(username, password) {
        console.log(`🔑 Tentative de connexion: ${username}`);
        
        // Stocker les credentials
        this.credentials = btoa(`${username}:${password}`);
        
        try {
            // Tester avec l'endpoint info
            const response = await this.request('GET', 'info');
            
            if (response && (response.Version || response['Faraday Server'])) {
                console.log('✅ Connexion réelle réussie!');
                return {
                    success: true,
                    user: { username: username },
                    version: response.Version || 'Inconnue',
                    server: response['Faraday Server'] || 'Inconnu',
                    mock: false,
                    realConnection: true
                };
            } else {
                throw new Error('Réponse invalide du serveur');
            }
            
        } catch (error) {
            console.error('❌ Échec de connexion:', error);
            this.credentials = null;
            throw error;
        }
    }

    /**
     * Obtenir les informations du serveur
     */
    async getInfo() {
        return this.request('GET', 'info');
    }

    /**
     * Obtenir la liste des workspaces
     */
    async getWorkspaces() {
        return this.request('GET', 'ws');
    }

    /**
     * Test complet de connectivité
     */
    async testConnectivity() {
        const results = {
            serverReachable: false,
            authenticationWorking: false,
            dataAccessible: false,
            realData: false,
            errors: []
        };

        try {
            // Test 1: Accès au serveur
            console.log('🔍 Test 1: Accès au serveur...');
            await fetch(`${this.baseURL}/${this.apiVersion}/info`, {
                method: 'HEAD',
                mode: 'no-cors'
            });
            results.serverReachable = true;
            console.log('✅ Serveur accessible');
        } catch (error) {
            results.errors.push('Serveur inaccessible');
            console.log('❌ Serveur inaccessible');
        }

        try {
            // Test 2: Authentification
            console.log('🔍 Test 2: Authentification...');
            this.credentials = btoa('faraday:faraday');
            const authResponse = await this.request('GET', 'info');
            
            if (authResponse && (authResponse.Version || authResponse['Faraday Server'])) {
                results.authenticationWorking = true;
                results.dataAccessible = true;
                results.realData = true;
                console.log('✅ Authentification et données réelles');
            }
        } catch (error) {
            results.errors.push(`Authentification échouée: ${error.message}`);
            console.log('❌ Authentification échouée');
        }

        try {
            // Test 3: Accès aux workspaces
            console.log('🔍 Test 3: Accès aux workspaces...');
            const workspaces = await this.request('GET', 'ws');
            
            if (Array.isArray(workspaces)) {
                console.log(`✅ ${workspaces.length} workspace(s) trouvé(s)`);
                results.workspaceCount = workspaces.length;
            }
        } catch (error) {
            results.errors.push(`Workspaces inaccessibles: ${error.message}`);
            console.log('❌ Workspaces inaccessibles');
        }

        return results;
    }
}

// Créer l'instance API
window.simpleFaradayAPI = new SimpleFaradayAPI();
