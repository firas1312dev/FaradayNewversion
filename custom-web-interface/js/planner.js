/**
 * Gestionnaire du module Planner pour l'interface Faraday
 */

class PlannerManager {
    constructor() {
        this.tasks = [];
        this.events = [];
        this.currentDate = new Date();
        this.selectedDate = null;
        this.initializePlanner();
    }

    /**
     * Initialiser le module Planner
     */
    initializePlanner() {
        this.setupButtons();
        this.loadPlanner();
        this.generateCalendar();
        this.loadTasks();
        this.loadTimeline();
    }

    /**
     * Configurer les boutons
     */
    setupButtons() {
        const addTaskBtn = document.getElementById('addTask');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                this.showAddTaskModal();
            });
        }
    }

    /**
     * Charger les données du planner
     */
    async loadPlanner() {
        try {
            // Charger les commandes comme base pour les tâches planifiées
            if (faradayAPI.currentWorkspace) {
                const commands = await faradayAPI.getCommands();
                this.processCommandsAsTasks(commands);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du planner:', error);
        }
    }

    /**
     * Traiter les commandes comme des tâches
     */
    processCommandsAsTasks(commands) {
        this.tasks = commands.map(command => ({
            id: command.id,
            title: command.command || 'Commande sans nom',
            description: `Outil: ${command.tool || 'N/A'}`,
            date: command.create_date || new Date().toISOString(),
            status: command.end_date ? 'completed' : 'pending',
            type: 'command',
            duration: command.duration || 0,
            user: command.user || 'Système'
        }));

        // Générer quelques tâches d'exemple pour le planning
        this.generateSampleTasks();
        
        this.displayTasks();
        this.updateCalendarEvents();
    }

    /**
     * Générer des tâches d'exemple pour démonstration
     */
    generateSampleTasks() {
        const now = new Date();
        const sampleTasks = [
            {
                id: 'task-1',
                title: 'Scan de vulnérabilités hebdomadaire',
                description: 'Scanner automatique des nouvelles vulnérabilités',
                date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Demain
                status: 'pending',
                type: 'scan',
                priority: 'high'
            },
            {
                id: 'task-2',
                title: 'Rapport de sécurité mensuel',
                description: 'Génération du rapport de sécurité pour la direction',
                date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Dans 7 jours
                status: 'pending',
                type: 'report',
                priority: 'medium'
            },
            {
                id: 'task-3',
                title: 'Mise à jour des signatures',
                description: 'Mise à jour des signatures de détection',
                date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Dans 3 jours
                status: 'pending',
                type: 'update',
                priority: 'high'
            },
            {
                id: 'task-4',
                title: 'Audit de sécurité réseau',
                description: 'Audit complet de la sécurité du réseau',
                date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Dans 14 jours
                status: 'pending',
                type: 'audit',
                priority: 'high'
            },
            {
                id: 'task-5',
                title: 'Formation équipe sécurité',
                description: 'Session de formation sur les nouvelles menaces',
                date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(), // Dans 21 jours
                status: 'pending',
                type: 'training',
                priority: 'low'
            }
        ];

        this.tasks = [...this.tasks, ...sampleTasks];
    }

    /**
     * Générer le calendrier
     */
    generateCalendar() {
        const calendarContainer = document.getElementById('calendar');
        if (!calendarContainer) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const calendarHTML = this.createCalendarHTML(year, month);
        calendarContainer.innerHTML = calendarHTML;

        this.setupCalendarEvents();
    }

    /**
     * Créer le HTML du calendrier
     */
    createCalendarHTML(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];

        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

        let html = `
            <div class="calendar-header">
                <button id="prevMonth" class="btn btn-secondary">‹</button>
                <h3>${monthNames[month]} ${year}</h3>
                <button id="nextMonth" class="btn btn-secondary">›</button>
            </div>
            <div class="calendar-grid">
        `;

        // En-têtes des jours
        dayNames.forEach(day => {
            html += `<div class="calendar-day-header">${day}</div>`;
        });

        // Cases du calendrier
        const currentDate = new Date(startDate);
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const isCurrentMonth = currentDate.getMonth() === month;
                const isToday = this.isSameDay(currentDate, new Date());
                const hasEvents = this.getEventsForDate(currentDate).length > 0;

                let cssClasses = 'calendar-day';
                if (!isCurrentMonth) cssClasses += ' other-month';
                if (isToday) cssClasses += ' today';
                if (hasEvents) cssClasses += ' has-events';

                html += `
                    <div class="${cssClasses}" data-date="${currentDate.toISOString().split('T')[0]}">
                        ${currentDate.getDate()}
                    </div>
                `;

                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        html += '</div>';
        return html;
    }

    /**
     * Configurer les événements du calendrier
     */
    setupCalendarEvents() {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.generateCalendar();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.generateCalendar();
            });
        }

        // Événements de clic sur les jours
        const dayElements = document.querySelectorAll('.calendar-day');
        dayElements.forEach(day => {
            day.addEventListener('click', (e) => {
                const dateStr = e.target.dataset.date;
                if (dateStr) {
                    this.selectedDate = new Date(dateStr);
                    this.highlightSelectedDate();
                    this.showDayTasks(this.selectedDate);
                }
            });
        });
    }

    /**
     * Mettre en surbrillance la date sélectionnée
     */
    highlightSelectedDate() {
        const dayElements = document.querySelectorAll('.calendar-day');
        dayElements.forEach(day => {
            day.classList.remove('selected');
        });

        if (this.selectedDate) {
            const dateStr = this.selectedDate.toISOString().split('T')[0];
            const selectedElement = document.querySelector(`[data-date="${dateStr}"]`);
            if (selectedElement) {
                selectedElement.classList.add('selected');
            }
        }
    }

    /**
     * Obtenir les événements pour une date donnée
     */
    getEventsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.tasks.filter(task => {
            const taskDate = new Date(task.date).toISOString().split('T')[0];
            return taskDate === dateStr;
        });
    }

    /**
     * Vérifier si deux dates sont le même jour
     */
    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    /**
     * Afficher les tâches
     */
    displayTasks() {
        const tasksContainer = document.getElementById('tasksList');
        if (!tasksContainer) return;

        if (this.tasks.length === 0) {
            tasksContainer.innerHTML = '<p class="loading">Aucune tâche planifiée</p>';
            return;
        }

        // Trier par date
        const sortedTasks = [...this.tasks].sort((a, b) => new Date(a.date) - new Date(b.date));

        const tasksHTML = sortedTasks.map(task => this.createTaskHTML(task)).join('');
        tasksContainer.innerHTML = tasksHTML;

        this.setupTaskEvents();
    }

    /**
     * Créer le HTML d'une tâche
     */
    createTaskHTML(task) {
        const isOverdue = new Date(task.date) < new Date() && task.status !== 'completed';
        const priorityClass = task.priority ? `priority-${task.priority}` : '';
        
        let statusClass = 'task-item';
        if (task.status === 'completed') statusClass += ' completed';
        if (isOverdue) statusClass += ' overdue';

        return `
            <div class="${statusClass} ${priorityClass}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-title">${task.title}</div>
                    <div class="task-actions">
                        ${task.status !== 'completed' ? `
                            <button class="btn-small btn-success complete-task" data-task-id="${task.id}">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn-small btn-secondary edit-task" data-task-id="${task.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-small btn-error delete-task" data-task-id="${task.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="task-meta">
                    <span><i class="fas fa-calendar"></i> ${faradayAPI.formatDate(task.date)}</span>
                    ${task.type ? `<span><i class="fas fa-tag"></i> ${task.type}</span>` : ''}
                    ${task.priority ? `<span class="priority-badge priority-${task.priority}"><i class="fas fa-exclamation"></i> ${task.priority}</span>` : ''}
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            </div>
        `;
    }

    /**
     * Configurer les événements des tâches
     */
    setupTaskEvents() {
        // Boutons de complétion
        document.querySelectorAll('.complete-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('button').dataset.taskId;
                this.completeTask(taskId);
            });
        });

        // Boutons d'édition
        document.querySelectorAll('.edit-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('button').dataset.taskId;
                this.editTask(taskId);
            });
        });

        // Boutons de suppression
        document.querySelectorAll('.delete-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('button').dataset.taskId;
                this.deleteTask(taskId);
            });
        });
    }

    /**
     * Marquer une tâche comme complétée
     */
    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = 'completed';
            task.completedDate = new Date().toISOString();
            this.displayTasks();
            this.updateCalendarEvents();
            
            if (window.authManager) {
                window.authManager.showNotification('Tâche marquée comme complétée', 'success');
            }
        }
    }

    /**
     * Éditer une tâche
     */
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.showEditTaskModal(task);
        }
    }

    /**
     * Supprimer une tâche
     */
    deleteTask(taskId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.displayTasks();
            this.updateCalendarEvents();
            
            if (window.authManager) {
                window.authManager.showNotification('Tâche supprimée', 'info');
            }
        }
    }

    /**
     * Afficher les tâches d'un jour spécifique
     */
    showDayTasks(date) {
        const dayTasks = this.getEventsForDate(date);
        
        if (dayTasks.length === 0) {
            if (window.authManager) {
                window.authManager.showNotification(`Aucune tâche prévue le ${date.toLocaleDateString('fr-FR')}`, 'info');
            }
            return;
        }

        const tasksText = dayTasks.map(task => task.title).join(', ');
        if (window.authManager) {
            window.authManager.showNotification(`Tâches du ${date.toLocaleDateString('fr-FR')}: ${tasksText}`, 'info');
        }
    }

    /**
     * Mettre à jour les événements du calendrier
     */
    updateCalendarEvents() {
        this.generateCalendar();
    }

    /**
     * Charger la timeline
     */
    loadTimeline() {
        const timelineContainer = document.getElementById('timeline');
        if (!timelineContainer) return;

        // Prendre les tâches récentes et futures
        const recentTasks = this.tasks
            .filter(task => {
                const taskDate = new Date(task.date);
                const now = new Date();
                const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
                const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                return taskDate >= threeDaysAgo && taskDate <= oneWeekFromNow;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const timelineHTML = recentTasks.map(task => this.createTimelineItemHTML(task)).join('');
        timelineContainer.innerHTML = timelineHTML || '<p class="loading">Aucun événement récent</p>';
    }

    /**
     * Créer un élément de timeline
     */
    createTimelineItemHTML(task) {
        const iconClass = this.getTaskIcon(task.type);
        const isCompleted = task.status === 'completed';
        const isPast = new Date(task.date) < new Date();

        return `
            <div class="timeline-item ${isCompleted ? 'completed' : ''} ${isPast ? 'past' : 'future'}">
                <div class="timeline-marker">
                    <i class="${iconClass}"></i>
                </div>
                <div class="timeline-content">
                    <div class="timeline-title">${task.title}</div>
                    <div class="timeline-description">${task.description || ''}</div>
                    <div class="timeline-time">
                        <i class="fas fa-clock"></i> ${faradayAPI.formatDate(task.date)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Obtenir l'icône pour un type de tâche
     */
    getTaskIcon(type) {
        const iconMap = {
            'command': 'fas fa-terminal',
            'scan': 'fas fa-search',
            'report': 'fas fa-file-alt',
            'update': 'fas fa-sync-alt',
            'audit': 'fas fa-shield-alt',
            'training': 'fas fa-graduation-cap',
            'default': 'fas fa-tasks'
        };

        return iconMap[type] || iconMap.default;
    }

    /**
     * Afficher le modal d'ajout de tâche
     */
    showAddTaskModal() {
        // Ici, vous pourriez implémenter un modal pour ajouter des tâches
        const title = prompt('Titre de la tâche:');
        if (title) {
            const description = prompt('Description (optionnelle):');
            const date = prompt('Date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
            
            if (date) {
                const newTask = {
                    id: 'task-' + Date.now(),
                    title: title,
                    description: description || '',
                    date: new Date(date).toISOString(),
                    status: 'pending',
                    type: 'manual',
                    priority: 'medium'
                };

                this.tasks.push(newTask);
                this.displayTasks();
                this.updateCalendarEvents();
                this.loadTimeline();

                if (window.authManager) {
                    window.authManager.showNotification('Tâche ajoutée avec succès', 'success');
                }
            }
        }
    }

    /**
     * Afficher le modal d'édition de tâche
     */
    showEditTaskModal(task) {
        const newTitle = prompt('Nouveau titre:', task.title);
        if (newTitle !== null) {
            task.title = newTitle;
            
            const newDescription = prompt('Nouvelle description:', task.description || '');
            if (newDescription !== null) {
                task.description = newDescription;
            }

            const currentDate = new Date(task.date).toISOString().split('T')[0];
            const newDate = prompt('Nouvelle date (YYYY-MM-DD):', currentDate);
            if (newDate && newDate !== currentDate) {
                task.date = new Date(newDate).toISOString();
            }

            this.displayTasks();
            this.updateCalendarEvents();
            this.loadTimeline();

            if (window.authManager) {
                window.authManager.showNotification('Tâche modifiée avec succès', 'success');
            }
        }
    }

    /**
     * Nettoyer les ressources
     */
    destroy() {
        // Nettoyer les événements si nécessaire
    }
}

// Initialiser le gestionnaire de planning
document.addEventListener('DOMContentLoaded', () => {
    window.plannerManager = new PlannerManager();
});

// Nettoyer lors de la fermeture
window.addEventListener('beforeunload', () => {
    if (window.plannerManager) {
        window.plannerManager.destroy();
    }
});
