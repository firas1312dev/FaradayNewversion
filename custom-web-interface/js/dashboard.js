/**
 * Gestionnaire du Dashboard pour l'interface Faraday
 */

class DashboardManager {
    constructor() {
        this.charts = {};
        this.refreshInterval = null;
        this.initializeDashboard();
    }

    /**
     * Initialiser le dashboard
     */
    initializeDashboard() {
        this.setupRefreshButton();
        this.setupAutoRefresh();
    }

    /**
     * Configurer le bouton de rafraîchissement
     */
    setupRefreshButton() {
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboard();
            });
        }
    }

    /**
     * Configurer le rafraîchissement automatique
     */
    setupAutoRefresh() {
        // Rafraîchir toutes les 5 minutes
        this.refreshInterval = setInterval(() => {
            if (faradayAPI.currentWorkspace) {
                this.loadDashboard();
            }
        }, 5 * 60 * 1000);
    }

    /**
     * Charger toutes les données du dashboard
     */
    async loadDashboard() {
        if (!faradayAPI.currentWorkspace) {
            console.log('Aucun workspace sélectionné pour le dashboard');
            return;
        }

        try {
            // Afficher le loading pour le dashboard
            this.showDashboardLoading();

            // Charger les statistiques générales
            await this.loadGeneralStats();

            // Charger les graphiques
            await this.loadSeverityChart();

            // Charger l'activité récente
            await this.loadRecentActivity();

        } catch (error) {
            console.error('Erreur lors du chargement du dashboard:', error);
            if (window.authManager) {
                window.authManager.showNotification('Erreur lors du chargement du dashboard', 'error');
            }
        } finally {
            this.hideDashboardLoading();
        }
    }

    /**
     * Charger les statistiques générales
     */
    async loadGeneralStats() {
        try {
            const stats = await faradayAPI.getWorkspaceStats();

            // Mettre à jour les compteurs
            this.updateStatCounter('totalHosts', stats.hosts);
            this.updateStatCounter('totalServices', stats.services);
            this.updateStatCounter('totalVulns', stats.vulnerabilities);
            this.updateStatCounter('totalCommands', stats.commands);

        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
            this.updateStatCounter('totalHosts', 0);
            this.updateStatCounter('totalServices', 0);
            this.updateStatCounter('totalVulns', 0);
            this.updateStatCounter('totalCommands', 0);
        }
    }

    /**
     * Mettre à jour un compteur de statistique
     */
    updateStatCounter(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            // Animation du compteur
            this.animateCounter(element, 0, value, 1000);
        }
    }

    /**
     * Animer un compteur
     */
    animateCounter(element, start, end, duration) {
        const startTime = performance.now();
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * progress);
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };
        
        requestAnimationFrame(updateCounter);
    }

    /**
     * Charger le graphique de sévérité
     */
    async loadSeverityChart() {
        try {
            const vulns = await faradayAPI.getVulnerabilities();
            
            // Compter les vulnérabilités par sévérité
            const severityCounts = {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                info: 0
            };

            vulns.forEach(vuln => {
                const severity = vuln.severity?.toLowerCase() || 'info';
                if (severityCounts.hasOwnProperty(severity)) {
                    severityCounts[severity]++;
                } else {
                    severityCounts.info++;
                }
            });

            this.createSeverityChart(severityCounts);

        } catch (error) {
            console.error('Erreur lors du chargement du graphique de sévérité:', error);
            this.createSeverityChart({ critical: 0, high: 0, medium: 0, low: 0, info: 0 });
        }
    }

    /**
     * Créer le graphique de sévérité
     */
    createSeverityChart(data) {
        const ctx = document.getElementById('severityChart');
        if (!ctx) return;

        // Détruire le graphique existant s'il existe
        if (this.charts.severity) {
            this.charts.severity.destroy();
        }

        this.charts.severity = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Critique', 'Élevée', 'Moyenne', 'Faible', 'Info'],
                datasets: [{
                    data: [
                        data.critical,
                        data.high,
                        data.medium,
                        data.low,
                        data.info
                    ],
                    backgroundColor: [
                        '#e74c3c', // Critique - Rouge
                        '#f39c12', // Élevée - Orange
                        '#17a2b8', // Moyenne - Bleu
                        '#27ae60', // Faible - Vert
                        '#6c757d'  // Info - Gris
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Charger l'activité récente
     */
    async loadRecentActivity() {
        try {
            const activity = await faradayAPI.getActivityFeed(null, {
                limit: 10,
                order: 'desc'
            });

            this.displayRecentActivity(activity);

        } catch (error) {
            console.error('Erreur lors du chargement de l\'activité:', error);
            this.displayRecentActivity([]);
        }
    }

    /**
     * Afficher l'activité récente
     */
    displayRecentActivity(activities) {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        if (!activities || activities.length === 0) {
            container.innerHTML = '<p class="loading">Aucune activité récente</p>';
            return;
        }

        const activityHTML = activities.map(activity => {
            const iconClass = this.getActivityIcon(activity.type);
            const iconColor = this.getActivityColor(activity.type);
            
            return `
                <div class="activity-item">
                    <div class="activity-icon" style="background-color: ${iconColor};">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${this.formatActivityTitle(activity)}</div>
                        <div class="activity-time">${faradayAPI.formatDate(activity.create_date)}</div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = activityHTML;
    }

    /**
     * Obtenir l'icône pour un type d'activité
     */
    getActivityIcon(type) {
        const iconMap = {
            'vulnerability': 'fas fa-bug',
            'host': 'fas fa-server',
            'service': 'fas fa-cogs',
            'command': 'fas fa-terminal',
            'agent': 'fas fa-robot',
            'default': 'fas fa-info-circle'
        };

        return iconMap[type] || iconMap.default;
    }

    /**
     * Obtenir la couleur pour un type d'activité
     */
    getActivityColor(type) {
        const colorMap = {
            'vulnerability': '#e74c3c',
            'host': '#3498db',
            'service': '#2ecc71',
            'command': '#9b59b6',
            'agent': '#f39c12',
            'default': '#6c757d'
        };

        return colorMap[type] || colorMap.default;
    }

    /**
     * Formater le titre d'une activité
     */
    formatActivityTitle(activity) {
        if (activity.description) {
            return activity.description;
        }

        // Générer un titre basé sur le type et les données
        const typeMap = {
            'vulnerability': 'Nouvelle vulnérabilité détectée',
            'host': 'Nouveau host découvert',
            'service': 'Nouveau service identifié',
            'command': 'Commande exécutée',
            'agent': 'Activité d\'agent',
            'default': 'Activité système'
        };

        return typeMap[activity.type] || typeMap.default;
    }

    /**
     * Afficher le loading du dashboard
     */
    showDashboardLoading() {
        const stats = ['totalHosts', 'totalServices', 'totalVulns', 'totalCommands'];
        stats.forEach(statId => {
            const element = document.getElementById(statId);
            if (element) {
                element.textContent = '...';
            }
        });

        const activityContainer = document.getElementById('recentActivity');
        if (activityContainer) {
            activityContainer.innerHTML = '<p class="loading">Chargement des activités...</p>';
        }
    }

    /**
     * Masquer le loading du dashboard
     */
    hideDashboardLoading() {
        // Le loading est automatiquement masqué quand les données sont chargées
    }

    /**
     * Nettoyer les ressources du dashboard
     */
    destroy() {
        // Arrêter le rafraîchissement automatique
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Détruire tous les graphiques
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });

        this.charts = {};
    }

    /**
     * Redimensionner les graphiques
     */
    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }
}

// Initialiser le gestionnaire de dashboard quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();

    // Redimensionner les graphiques lors du redimensionnement de la fenêtre
    window.addEventListener('resize', () => {
        if (window.dashboardManager) {
            window.dashboardManager.resizeCharts();
        }
    });
});

// Nettoyer les ressources lors de la fermeture de la page
window.addEventListener('beforeunload', () => {
    if (window.dashboardManager) {
        window.dashboardManager.destroy();
    }
});
