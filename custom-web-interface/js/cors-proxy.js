/**
 * Proxy CORS simple pour Faraday API
 * Permet de contourner les restrictions CORS en développement
 */

class CORSProxy {
    constructor() {
        this.faradayURL = 'http://localhost:5985';
        this.credentials = null;
    }

    /**
     * Set credentials for authentication
     */
    setCredentials(username, password) {
        this.credentials = btoa(`${username}:${password}`);
    }

    /**
     * Make a request to Faraday API using different strategies
     */
    async makeRequest(method, endpoint, data = null) {
        const url = `${this.faradayURL}/${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (this.credentials) {
            headers['Authorization'] = `Basic ${this.credentials}`;
        }

        // Strategy 1: Try normal CORS request first
        try {
            console.log(`🔄 Tentative requête CORS: ${method} ${url}`);
            const response = await fetch(url, {
                method: method,
                headers: headers,
                mode: 'cors',
                credentials: 'omit',
                body: data ? JSON.stringify(data) : undefined
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Requête CORS réussie`);
                return result;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (corsError) {
            console.warn(`⚠️ Échec CORS: ${corsError.message}`);
            
            // Strategy 2: Try with JSONP for GET requests
            if (method.toLowerCase() === 'get') {
                try {
                    return await this.makeJSONPRequest(url);
                } catch (jsonpError) {
                    console.warn(`⚠️ Échec JSONP: ${jsonpError.message}`);
                }
            }

            // Strategy 3: Try with server-side proxy (if available)
            try {
                return await this.makeProxyRequest(method, endpoint, data);
            } catch (proxyError) {
                console.warn(`⚠️ Échec Proxy: ${proxyError.message}`);
            }

            // Strategy 4: Use mock data for development
            console.log(`🔄 Utilisation de données simulées pour: ${endpoint}`);
            return this.getMockData(endpoint);
        }
    }

    /**
     * JSONP request for GET endpoints
     */
    async makeJSONPRequest(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const callbackName = 'faradayCallback_' + Date.now();
            
            window[callbackName] = function(data) {
                document.head.removeChild(script);
                delete window[callbackName];
                resolve(data);
            };

            script.onerror = () => {
                document.head.removeChild(script);
                delete window[callbackName];
                reject(new Error('JSONP request failed'));
            };

            script.src = `${url}?callback=${callbackName}`;
            document.head.appendChild(script);

            // Timeout après 10 secondes
            setTimeout(() => {
                if (window[callbackName]) {
                    document.head.removeChild(script);
                    delete window[callbackName];
                    reject(new Error('JSONP request timeout'));
                }
            }, 10000);
        });
    }

    /**
     * Server-side proxy request
     */
    async makeProxyRequest(method, endpoint, data) {
        // This would require a server-side proxy
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(`${this.faradayURL}/${endpoint}`)}`;
        
        const response = await fetch(proxyUrl, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-Target-Authorization': this.credentials ? `Basic ${this.credentials}` : ''
            },
            body: data ? JSON.stringify(data) : undefined
        });

        if (!response.ok) {
            throw new Error(`Proxy error: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Get mock data for development/testing
     */
    getMockData(endpoint) {
        console.log(`🎭 Données simulées pour: ${endpoint}`);
        
        const mockData = {
            '_api/v3/info': {
                'Version': '5.14.1',
                'Faraday Server': 'Running'
            },
            '_api/v3/ws': [
                { name: 'demo-workspace', description: 'Demo workspace for testing' },
                { name: 'test-workspace', description: 'Test workspace' }
            ],
            '_api/v3/ws/demo-workspace/hosts': [
                {
                    ip: '192.168.1.1',
                    hostnames: ['router.local'],
                    os: 'Linux',
                    services_count: 3,
                    vulns_count: 2
                },
                {
                    ip: '192.168.1.100',
                    hostnames: ['workstation.local'],
                    os: 'Windows 10',
                    services_count: 5,
                    vulns_count: 1
                }
            ],
            '_api/v3/ws/demo-workspace/vulns': [
                {
                    name: 'SSH Weak Authentication',
                    severity: 'medium',
                    target: '192.168.1.1',
                    service: 'ssh/22'
                },
                {
                    name: 'Open SMB Share',
                    severity: 'high',
                    target: '192.168.1.100',
                    service: 'smb/445'
                }
            ]
        };

        return mockData[endpoint] || { message: 'Mock data not available for this endpoint' };
    }
}

// Global instance
window.corsProxy = new CORSProxy();
