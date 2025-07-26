/**
 * Application principale - Orchestrateur pour l'interface Faraday
 */

class FaradayApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.managers = {};
        this.isInitialized = false;
        this.initializeApp();
    }

    /**
     * Initialiser l'application
     */
    initializeApp() {
        this.setupNavigation();
        this.setupDataLoaders();
        this.setupWebSocketHandlers();
        this.setupKeyboardShortcuts();
        this.isInitialized = true;
    }

    /**
     * Configurer la navigation
     */
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                if (section) {
                    this.navigateToSection(section);
                }
            });
        });

        // Navigation initiale vers le dashboard
        this.navigateToSection('dashboard');
    }

    /**
     * Naviguer vers une section
     */
    navigateToSection(sectionName) {
        // Masquer toutes les sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Désactiver tous les liens de navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Afficher la section demandée
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Activer le lien de navigation correspondant
        const targetNavLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (targetNavLink) {
            targetNavLink.classList.add('active');
        }

        // Mettre à jour la section actuelle
        this.currentSection = sectionName;

        // Charger les données de la section si nécessaire
        this.loadSectionData(sectionName);

        // Mettre à jour l'URL (optionnel)
        history.pushState({ section: sectionName }, '', `#${sectionName}`);
    }

    /**
     * Charger les données d'une section
     */
    async loadSectionData(sectionName) {
        if (!faradayAPI.currentWorkspace) {
            console.log('Aucun workspace sélectionné');
            return;
        }

        try {
            switch (sectionName) {
                case 'dashboard':
                    if (window.dashboardManager) {
                        await window.dashboardManager.loadDashboard();
                    }
                    break;

                case 'hosts':
                    await this.loadHosts();
                    break;

                case 'services':
                    await this.loadServices();
                    break;

                case 'vulnerabilities':
                    await this.loadVulnerabilities();
                    break;

                case 'graphics':
                    if (window.graphicsManager) {
                        await window.graphicsManager.loadAllGraphics();
                    }
                    break;

                case 'planner':
                    if (window.plannerManager) {
                        await window.plannerManager.loadPlanner();
                    }
                    break;

                case 'workspaces':
                    if (window.workspaceManager) {
                        await window.workspaceManager.loadWorkspaces();
                    }
                    break;

                case 'commands':
                    await this.loadCommands();
                    break;

                case 'agents':
                    await this.loadAgents();
                    break;
            }
        } catch (error) {
            console.error(`Erreur lors du chargement de la section ${sectionName}:`, error);
            if (window.authManager) {
                window.authManager.showNotification(`Erreur lors du chargement de la section ${sectionName}`, 'error');
            }
        }
    }

    /**
     * Configurer les chargeurs de données
     */
    setupDataLoaders() {
        // Configurer les boutons de rafraîchissement pour chaque section
        this.setupRefreshButtons();
        this.setupSearchInputs();
        this.setupFilterSelects();
    }

    /**
     * Configurer les boutons de rafraîchissement
     */
    setupRefreshButtons() {
        const refreshButtons = {
            'refreshHosts': () => this.loadHosts(),
            'refreshServices': () => this.loadServices(),
            'refreshVulns': () => this.loadVulnerabilities(),
            'refreshCommands': () => this.loadCommands(),
            'refreshAgents': () => this.loadAgents()
        };

        Object.entries(refreshButtons).forEach(([buttonId, handler]) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', handler);
            }
        });
    }

    /**
     * Configurer les champs de recherche
     */
    setupSearchInputs() {
        const searchInputs = {
            'hostsSearch': (query) => this.filterHosts(query),
            'servicesSearch': (query) => this.filterServices(query),
            'vulnsSearch': (query) => this.filterVulnerabilities(query),
            'commandsSearch': (query) => this.filterCommands(query)
        };

        Object.entries(searchInputs).forEach(([inputId, handler]) => {
            const input = document.getElementById(inputId);
            if (input) {
                let timeout;
                input.addEventListener('input', (e) => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => handler(e.target.value), 300);
                });
            }
        });
    }

    /**
     * Configurer les sélecteurs de filtre
     */
    setupFilterSelects() {
        const severityFilter = document.getElementById('severityFilter');
        if (severityFilter) {
            severityFilter.addEventListener('change', (e) => {
                this.filterVulnerabilitiesBySeverity(e.target.value);
            });
        }
    }

    /**
     * Charger les hosts
     */
    async loadHosts() {
        try {
            if (window.authManager) {
                window.authManager.showLoading('Chargement des hosts...');
            }

            const hosts = await faradayAPI.getHosts();
            this.displayHosts(hosts);

        } catch (error) {
            console.error('Erreur lors du chargement des hosts:', error);
            this.displayHosts([]);
        } finally {
            if (window.authManager) {
                window.authManager.hideLoading();
            }
        }
    }

    /**
     * Afficher les hosts
     */
    displayHosts(hosts) {
        const tbody = document.querySelector('#hostsTable tbody');
        if (!tbody) return;

        if (hosts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Aucun host trouvé</td></tr>';
            return;
        }

        const hostsHTML = hosts.map(host => `
            <tr>
                <td>${host.ip || 'N/A'}</td>
                <td>${host.hostnames ? host.hostnames.join(', ') : 'N/A'}</td>
                <td>${host.os || 'N/A'}</td>
                <td>${host.services_count || 0}</td>
                <td>${host.vulns_count || 0}</td>
                <td>
                    <span class="status-badge ${host.services_count > 0 ? 'status-open' : 'status-closed'}">
                        ${host.services_count > 0 ? 'Actif' : 'Inactif'}
                    </span>
                </td>
                <td>
                    <button class="btn-small btn-primary view-host" data-host-id="${host.id}">
                        <i class="fas fa-eye"></i> Voir
                    </button>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = hostsHTML;
        this.setupHostActions();
    }

    /**
     * Configurer les actions des hosts
     */
    setupHostActions() {
        document.querySelectorAll('.view-host').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const hostId = e.target.closest('button').dataset.hostId;
                this.viewHostDetails(hostId);
            });
        });
    }

    /**
     * Voir les détails d'un host
     */
    async viewHostDetails(hostId) {
        try {
            const host = await faradayAPI.getHost(hostId);
            this.showHostModal(host);
        } catch (error) {
            console.error('Erreur lors du chargement du host:', error);
            if (window.authManager) {
                window.authManager.showNotification('Erreur lors du chargement du host', 'error');
            }
        }
    }

    /**
     * Charger les services
     */
    async loadServices() {
        try {
            if (window.authManager) {
                window.authManager.showLoading('Chargement des services...');
            }

            const services = await faradayAPI.getServices();
            this.displayServices(services);

        } catch (error) {
            console.error('Erreur lors du chargement des services:', error);
            this.displayServices([]);
        } finally {
            if (window.authManager) {
                window.authManager.hideLoading();
            }
        }
    }

    /**
     * Afficher les services
     */
    displayServices(services) {
        const tbody = document.querySelector('#servicesTable tbody');
        if (!tbody) return;

        if (services.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Aucun service trouvé</td></tr>';
            return;
        }

        const servicesHTML = services.map(service => `
            <tr>
                <td>${service.host?.ip || 'N/A'}</td>
                <td>${service.port || 'N/A'}</td>
                <td>${service.protocol || 'N/A'}</td>
                <td>${service.name || 'N/A'}</td>
                <td>${service.version || 'N/A'}</td>
                <td>
                    <span class="status-badge status-open">Actif</span>
                </td>
                <td>
                    <button class="btn-small btn-primary view-service" data-service-id="${service.id}">
                        <i class="fas fa-eye"></i> Voir
                    </button>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = servicesHTML;
        this.setupServiceActions();
    }

    /**
     * Configurer les actions des services
     */
    setupServiceActions() {
        document.querySelectorAll('.view-service').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const serviceId = e.target.closest('button').dataset.serviceId;
                this.viewServiceDetails(serviceId);
            });
        });
    }

    /**
     * Charger les vulnérabilités
     */
    async loadVulnerabilities() {
        try {
            if (window.authManager) {
                window.authManager.showLoading('Chargement des vulnérabilités...');
            }

            const vulns = await faradayAPI.getVulnerabilities();
            this.displayVulnerabilities(vulns);

        } catch (error) {
            console.error('Erreur lors du chargement des vulnérabilités:', error);
            this.displayVulnerabilities([]);
        } finally {
            if (window.authManager) {
                window.authManager.hideLoading();
            }
        }
    }

    /**
     * Afficher les vulnérabilités
     */
    displayVulnerabilities(vulns) {
        const tbody = document.querySelector('#vulnsTable tbody');
        if (!tbody) return;

        if (vulns.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Aucune vulnérabilité trouvée</td></tr>';
            return;
        }

        const vulnsHTML = vulns.map(vuln => `
            <tr>
                <td>${vuln.name || 'N/A'}</td>
                <td>
                    <span class="${faradayAPI.getSeverityClass(vuln.severity)}">
                        ${vuln.severity || 'N/A'}
                    </span>
                </td>
                <td>${vuln.host?.ip || 'N/A'}</td>
                <td>${vuln.service ? `${vuln.service.name}:${vuln.service.port}` : 'N/A'}</td>
                <td>
                    <span class="${faradayAPI.getStatusClass(vuln.status)}">
                        ${vuln.status || 'N/A'}
                    </span>
                </td>
                <td>${faradayAPI.formatDate(vuln.create_date)}</td>
                <td>
                    <button class="btn-small btn-primary view-vuln" data-vuln-id="${vuln.id}">
                        <i class="fas fa-eye"></i> Voir
                    </button>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = vulnsHTML;
        this.setupVulnActions();
    }

    /**
     * Configurer les actions des vulnérabilités
     */
    setupVulnActions() {
        document.querySelectorAll('.view-vuln').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const vulnId = e.target.closest('button').dataset.vulnId;
                this.viewVulnDetails(vulnId);
            });
        });
    }

    /**
     * Charger les commandes
     */
    async loadCommands() {
        try {
            if (window.authManager) {
                window.authManager.showLoading('Chargement des commandes...');
            }

            const commands = await faradayAPI.getCommands();
            this.displayCommands(commands);

        } catch (error) {
            console.error('Erreur lors du chargement des commandes:', error);
            this.displayCommands([]);
        } finally {
            if (window.authManager) {
                window.authManager.hideLoading();
            }
        }
    }

    /**
     * Afficher les commandes
     */
    displayCommands(commands) {
        const tbody = document.querySelector('#commandsTable tbody');
        if (!tbody) return;

        if (commands.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Aucune commande trouvée</td></tr>';
            return;
        }

        const commandsHTML = commands.map(command => `
            <tr>
                <td>${command.command || 'N/A'}</td>
                <td>${command.tool || 'N/A'}</td>
                <td>${command.user || 'N/A'}</td>
                <td>${faradayAPI.formatDate(command.create_date)}</td>
                <td>${faradayAPI.formatDuration(command.duration)}</td>
                <td>
                    <span class="status-badge ${command.end_date ? 'status-closed' : 'status-open'}">
                        ${command.end_date ? 'Terminée' : 'En cours'}
                    </span>
                </td>
                <td>
                    <button class="btn-small btn-primary view-command" data-command-id="${command.id}">
                        <i class="fas fa-eye"></i> Voir
                    </button>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = commandsHTML;
        this.setupCommandActions();
    }

    /**
     * Configurer les actions des commandes
     */
    setupCommandActions() {
        document.querySelectorAll('.view-command').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commandId = e.target.closest('button').dataset.commandId;
                this.viewCommandDetails(commandId);
            });
        });
    }

    /**
     * Charger les agents
     */
    async loadAgents() {
        try {
            if (window.authManager) {
                window.authManager.showLoading('Chargement des agents...');
            }

            const agents = await faradayAPI.getAgents();
            this.displayAgents(agents);

        } catch (error) {
            console.error('Erreur lors du chargement des agents:', error);
            this.displayAgents([]);
        } finally {
            if (window.authManager) {
                window.authManager.hideLoading();
            }
        }
    }

    /**
     * Afficher les agents
     */
    displayAgents(agents) {
        const container = document.getElementById('agentsList');
        if (!container) return;

        if (agents.length === 0) {
            container.innerHTML = '<p class="loading">Aucun agent trouvé</p>';
            return;
        }

        const agentsHTML = agents.map(agent => `
            <div class="agent-card">
                <div class="agent-header">
                    <h4>${agent.name || 'Agent sans nom'}</h4>
                    <span class="agent-status ${agent.is_online ? 'online' : 'offline'}">
                        ${agent.is_online ? 'En ligne' : 'Hors ligne'}
                    </span>
                </div>
                <div class="agent-details">
                    <p><strong>Token:</strong> ${agent.token ? agent.token.substring(0, 8) + '...' : 'N/A'}</p>
                    <p><strong>Dernière activité:</strong> ${faradayAPI.formatDate(agent.last_run)}</p>
                    <p><strong>Executors:</strong> ${agent.executors ? agent.executors.length : 0}</p>
                </div>
                <div class="agent-actions">
                    <button class="btn btn-primary view-agent" data-agent-id="${agent.id}">
                        <i class="fas fa-eye"></i> Détails
                    </button>
                    <button class="btn btn-error delete-agent" data-agent-id="${agent.id}">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = agentsHTML;
        this.setupAgentActions();
    }

    /**
     * Configurer les actions des agents
     */
    setupAgentActions() {
        document.querySelectorAll('.view-agent').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const agentId = e.target.closest('button').dataset.agentId;
                this.viewAgentDetails(agentId);
            });
        });

        document.querySelectorAll('.delete-agent').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const agentId = e.target.closest('button').dataset.agentId;
                if (confirm('Êtes-vous sûr de vouloir supprimer cet agent ?')) {
                    try {
                        await faradayAPI.deleteAgent(agentId);
                        await this.loadAgents();
                        if (window.authManager) {
                            window.authManager.showNotification('Agent supprimé avec succès', 'success');
                        }
                    } catch (error) {
                        console.error('Erreur lors de la suppression de l\'agent:', error);
                        if (window.authManager) {
                            window.authManager.showNotification('Erreur lors de la suppression de l\'agent', 'error');
                        }
                    }
                }
            });
        });
    }

    /**
     * Configurer les gestionnaires WebSocket
     */
    setupWebSocketHandlers() {
        // Les gestionnaires WebSocket seront configurés après la connexion
        document.addEventListener('faraday-websocket-connected', () => {
            this.setupWebSocketListeners();
        });
    }

    /**
     * Configurer les écouteurs WebSocket
     */
    setupWebSocketListeners() {
        if (faradayAPI.socket) {
            faradayAPI.socket.on('new-vulnerability', (data) => {
                this.handleNewVulnerability(data);
            });

            faradayAPI.socket.on('host-updated', (data) => {
                this.handleHostUpdate(data);
            });

            faradayAPI.socket.on('service-updated', (data) => {
                this.handleServiceUpdate(data);
            });

            faradayAPI.socket.on('command-finished', (data) => {
                this.handleCommandFinished(data);
            });
        }
    }

    /**
     * Gérer une nouvelle vulnérabilité
     */
    handleNewVulnerability(data) {
        if (window.authManager) {
            window.authManager.showNotification(`Nouvelle vulnérabilité détectée: ${data.name}`, 'warning');
        }

        // Recharger les données si on est sur la section vulnérabilités
        if (this.currentSection === 'vulnerabilities') {
            this.loadVulnerabilities();
        }

        // Mettre à jour le dashboard si nécessaire
        if (this.currentSection === 'dashboard' && window.dashboardManager) {
            window.dashboardManager.loadDashboard();
        }
    }

    /**
     * Configurer les raccourcis clavier
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + numéro pour naviguer entre les sections
            if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '8') {
                e.preventDefault();
                const sections = ['dashboard', 'hosts', 'services', 'vulnerabilities', 'graphics', 'planner', 'commands', 'agents'];
                const index = parseInt(e.key) - 1;
                if (sections[index]) {
                    this.navigateToSection(sections[index]);
                }
            }

            // F5 pour rafraîchir la section actuelle
            if (e.key === 'F5') {
                e.preventDefault();
                this.loadSectionData(this.currentSection);
            }
        });
    }

    /**
     * Filtrer les hosts
     */
    filterHosts(query) {
        const rows = document.querySelectorAll('#hostsTable tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    /**
     * Filtrer les services
     */
    filterServices(query) {
        const rows = document.querySelectorAll('#servicesTable tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    /**
     * Filtrer les vulnérabilités
     */
    filterVulnerabilities(query) {
        const rows = document.querySelectorAll('#vulnsTable tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    /**
     * Filtrer les vulnérabilités par sévérité
     */
    filterVulnerabilitiesBySeverity(severity) {
        const rows = document.querySelectorAll('#vulnsTable tbody tr');
        rows.forEach(row => {
            if (!severity) {
                row.style.display = '';
            } else {
                const severityCell = row.cells[1];
                const hasSeverity = severityCell && severityCell.textContent.toLowerCase().includes(severity.toLowerCase());
                row.style.display = hasSeverity ? '' : 'none';
            }
        });
    }

    /**
     * Filtrer les commandes
     */
    filterCommands(query) {
        const rows = document.querySelectorAll('#commandsTable tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    /**
     * Afficher les détails d'un élément (placeholder pour modals)
     */
    showHostModal(host) {
        alert(`Détails du host:\nIP: ${host.ip}\nNom: ${host.hostnames ? host.hostnames.join(', ') : 'N/A'}\nOS: ${host.os || 'N/A'}`);
    }

    viewServiceDetails(serviceId) {
        console.log('Voir service:', serviceId);
    }

    viewVulnDetails(vulnId) {
        console.log('Voir vulnérabilité:', vulnId);
    }

    viewCommandDetails(commandId) {
        console.log('Voir commande:', commandId);
    }

    viewAgentDetails(agentId) {
        console.log('Voir agent:', agentId);
    }

    /**
     * Gérer les mises à jour temps réel
     */
    handleHostUpdate(data) {
        console.log('Host mis à jour:', data);
    }

    handleServiceUpdate(data) {
        console.log('Service mis à jour:', data);
    }

    handleCommandFinished(data) {
        if (window.authManager) {
            window.authManager.showNotification(`Commande terminée: ${data.command}`, 'info');
        }
    }
}

// Initialiser l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.faradayApp = new FaradayApp();
    
    // Gérer la navigation par l'historique du navigateur
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.section) {
            window.faradayApp.navigateToSection(e.state.section);
        }
    });
    
    // Navigation basée sur l'URL au chargement
    const hash = window.location.hash.substring(1);
    if (hash && ['dashboard', 'hosts', 'services', 'vulnerabilities', 'graphics', 'planner', 'commands', 'agents'].includes(hash)) {
        window.faradayApp.navigateToSection(hash);
    }
});
