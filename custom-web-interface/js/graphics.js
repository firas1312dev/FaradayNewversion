/**
 * Gestionnaire du module Graphics pour l'interface Faraday
 */

class GraphicsManager {
    constructor() {
        this.charts = {};
        this.refreshInterval = null;
        this.initializeGraphics();
    }

    /**
     * Initialiser le module Graphics
     */
    initializeGraphics() {
        this.setupRefreshButton();
        this.setupAutoRefresh();
    }

    /**
     * Configurer le bouton de rafraîchissement
     */
    setupRefreshButton() {
        const refreshBtn = document.getElementById('refreshGraphics');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAllGraphics();
            });
        }
    }

    /**
     * Configurer le rafraîchissement automatique
     */
    setupAutoRefresh() {
        // Rafraîchir toutes les 10 minutes
        this.refreshInterval = setInterval(() => {
            if (faradayAPI.currentWorkspace) {
                this.loadAllGraphics();
            }
        }, 10 * 60 * 1000);
    }

    /**
     * Charger tous les graphiques
     */
    async loadAllGraphics() {
        if (!faradayAPI.currentWorkspace) {
            console.log('Aucun workspace sélectionné pour les graphiques');
            return;
        }

        try {
            if (window.authManager) {
                window.authManager.showLoading('Chargement des graphiques...');
            }

            // Charger tous les graphiques en parallèle
            await Promise.all([
                this.loadVulnDistributionChart(),
                this.loadTimelineChart(),
                this.loadServicesChart(),
                this.loadHostsStatusChart()
            ]);

        } catch (error) {
            console.error('Erreur lors du chargement des graphiques:', error);
            if (window.authManager) {
                window.authManager.showNotification('Erreur lors du chargement des graphiques', 'error');
            }
        } finally {
            if (window.authManager) {
                window.authManager.hideLoading();
            }
        }
    }

    /**
     * Charger le graphique de distribution des vulnérabilités
     */
    async loadVulnDistributionChart() {
        try {
            const vulns = await faradayAPI.getVulnerabilities();
            
            // Grouper par sévérité et statut
            const distribution = {
                confirmed: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
                open: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
                closed: { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
            };

            vulns.forEach(vuln => {
                const severity = vuln.severity?.toLowerCase() || 'info';
                const status = vuln.status?.toLowerCase() || 'open';
                
                let statusGroup = 'open';
                if (status === 'confirmed') statusGroup = 'confirmed';
                else if (['closed', 'risk-accepted', 'false-positive'].includes(status)) statusGroup = 'closed';

                if (distribution[statusGroup] && distribution[statusGroup].hasOwnProperty(severity)) {
                    distribution[statusGroup][severity]++;
                } else if (distribution[statusGroup]) {
                    distribution[statusGroup].info++;
                }
            });

            this.createVulnDistributionChart(distribution);

        } catch (error) {
            console.error('Erreur lors du chargement du graphique de distribution:', error);
        }
    }

    /**
     * Créer le graphique de distribution des vulnérabilités
     */
    createVulnDistributionChart(data) {
        const ctx = document.getElementById('vulnDistributionChart');
        if (!ctx) return;

        if (this.charts.vulnDistribution) {
            this.charts.vulnDistribution.destroy();
        }

        const datasets = [
            {
                label: 'Confirmées',
                data: [data.confirmed.critical, data.confirmed.high, data.confirmed.medium, data.confirmed.low, data.confirmed.info],
                backgroundColor: 'rgba(231, 76, 60, 0.8)',
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 1
            },
            {
                label: 'Ouvertes',
                data: [data.open.critical, data.open.high, data.open.medium, data.open.low, data.open.info],
                backgroundColor: 'rgba(243, 156, 18, 0.8)',
                borderColor: 'rgba(243, 156, 18, 1)',
                borderWidth: 1
            },
            {
                label: 'Fermées',
                data: [data.closed.critical, data.closed.high, data.closed.medium, data.closed.low, data.closed.info],
                backgroundColor: 'rgba(39, 174, 96, 0.8)',
                borderColor: 'rgba(39, 174, 96, 1)',
                borderWidth: 1
            }
        ];

        this.charts.vulnDistribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Critique', 'Élevée', 'Moyenne', 'Faible', 'Info'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribution des Vulnérabilités par Sévérité et Statut'
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        stacked: false
                    },
                    y: {
                        stacked: false,
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Charger le graphique temporel
     */
    async loadTimelineChart() {
        try {
            const vulns = await faradayAPI.getVulnerabilities();
            
            // Grouper par mois
            const timelineData = {};
            const now = new Date();
            
            // Initialiser les 12 derniers mois
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                timelineData[key] = 0;
            }

            // Compter les vulnérabilités par mois
            vulns.forEach(vuln => {
                if (vuln.create_date) {
                    const date = new Date(vuln.create_date);
                    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    if (timelineData.hasOwnProperty(key)) {
                        timelineData[key]++;
                    }
                }
            });

            this.createTimelineChart(timelineData);

        } catch (error) {
            console.error('Erreur lors du chargement du graphique temporel:', error);
        }
    }

    /**
     * Créer le graphique temporel
     */
    createTimelineChart(data) {
        const ctx = document.getElementById('timelineChart');
        if (!ctx) return;

        if (this.charts.timeline) {
            this.charts.timeline.destroy();
        }

        const labels = Object.keys(data).map(key => {
            const [year, month] = key.split('-');
            const date = new Date(year, month - 1, 1);
            return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        });

        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Vulnérabilités découvertes',
                    data: Object.values(data),
                    borderColor: 'rgba(52, 152, 219, 1)',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Évolution du nombre de vulnérabilités (12 derniers mois)'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Charger le graphique des services
     */
    async loadServicesChart() {
        try {
            const services = await faradayAPI.getServices();
            
            // Compter les services par nom
            const serviceCounts = {};
            services.forEach(service => {
                const name = service.name || 'Inconnu';
                serviceCounts[name] = (serviceCounts[name] || 0) + 1;
            });

            // Obtenir le top 10
            const sortedServices = Object.entries(serviceCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10);

            this.createServicesChart(sortedServices);

        } catch (error) {
            console.error('Erreur lors du chargement du graphique des services:', error);
        }
    }

    /**
     * Créer le graphique des services
     */
    createServicesChart(data) {
        const ctx = document.getElementById('servicesChart');
        if (!ctx) return;

        if (this.charts.services) {
            this.charts.services.destroy();
        }

        const labels = data.map(([name]) => name);
        const values = data.map(([, count]) => count);

        // Générer des couleurs dynamiques
        const colors = this.generateColors(data.length);

        this.charts.services = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Nombre d\'instances',
                    data: values,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Top 10 des Services les plus fréquents'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            maxRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Charger le graphique du statut des hosts
     */
    async loadHostsStatusChart() {
        try {
            const hosts = await faradayAPI.getHosts();
            
            // Compter par statut (simulé car l'API n'a pas forcément de statut explicite)
            const statusCounts = {
                alive: 0,
                down: 0,
                unknown: 0
            };

            hosts.forEach(host => {
                // Logique simplifiée basée sur les services
                if (host.services && host.services.length > 0) {
                    statusCounts.alive++;
                } else if (host.services && host.services.length === 0) {
                    statusCounts.down++;
                } else {
                    statusCounts.unknown++;
                }
            });

            this.createHostsStatusChart(statusCounts);

        } catch (error) {
            console.error('Erreur lors du chargement du graphique des hosts:', error);
        }
    }

    /**
     * Créer le graphique du statut des hosts
     */
    createHostsStatusChart(data) {
        const ctx = document.getElementById('hostsStatusChart');
        if (!ctx) return;

        if (this.charts.hostsStatus) {
            this.charts.hostsStatus.destroy();
        }

        this.charts.hostsStatus = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Actifs', 'Inactifs', 'Inconnus'],
                datasets: [{
                    data: [data.alive, data.down, data.unknown],
                    backgroundColor: [
                        'rgba(39, 174, 96, 0.8)',   // Vert pour actifs
                        'rgba(231, 76, 60, 0.8)',   // Rouge pour inactifs
                        'rgba(149, 165, 166, 0.8)'  // Gris pour inconnus
                    ],
                    borderColor: [
                        'rgba(39, 174, 96, 1)',
                        'rgba(231, 76, 60, 1)',
                        'rgba(149, 165, 166, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Statut des Hosts'
                    },
                    legend: {
                        position: 'bottom'
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
     * Générer des couleurs pour les graphiques
     */
    generateColors(count) {
        const baseColors = [
            'rgba(52, 152, 219, 0.8)',   // Bleu
            'rgba(231, 76, 60, 0.8)',    // Rouge
            'rgba(39, 174, 96, 0.8)',    // Vert
            'rgba(243, 156, 18, 0.8)',   // Orange
            'rgba(155, 89, 182, 0.8)',   // Violet
            'rgba(26, 188, 156, 0.8)',   // Turquoise
            'rgba(241, 196, 15, 0.8)',   // Jaune
            'rgba(230, 126, 34, 0.8)',   // Orange foncé
            'rgba(46, 204, 113, 0.8)',   // Vert clair
            'rgba(52, 73, 94, 0.8)'      // Gris bleu
        ];

        const background = [];
        const border = [];

        for (let i = 0; i < count; i++) {
            const color = baseColors[i % baseColors.length];
            background.push(color);
            border.push(color.replace('0.8', '1'));
        }

        return { background, border };
    }

    /**
     * Redimensionner tous les graphiques
     */
    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    /**
     * Nettoyer les ressources
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });

        this.charts = {};
    }

    /**
     * Exporter un graphique en image
     */
    exportChart(chartId, filename = 'chart.png') {
        const chart = this.charts[chartId];
        if (chart) {
            const url = chart.toBase64Image();
            const link = document.createElement('a');
            link.download = filename;
            link.href = url;
            link.click();
        }
    }

    /**
     * Basculer le type d'un graphique
     */
    toggleChartType(chartId, newType) {
        const chart = this.charts[chartId];
        if (chart) {
            chart.config.type = newType;
            chart.update();
        }
    }
}

// Initialiser le gestionnaire de graphiques
document.addEventListener('DOMContentLoaded', () => {
    window.graphicsManager = new GraphicsManager();
});

// Redimensionner lors du changement de taille de fenêtre
window.addEventListener('resize', () => {
    if (window.graphicsManager) {
        window.graphicsManager.resizeCharts();
    }
});

// Nettoyer lors de la fermeture
window.addEventListener('beforeunload', () => {
    if (window.graphicsManager) {
        window.graphicsManager.destroy();
    }
});
