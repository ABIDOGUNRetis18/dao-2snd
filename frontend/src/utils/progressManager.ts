// Système Unifié de Gestion de Progression Globale
// Connecte toutes les actions utilisateur aux mises à jour de progression

interface TaskProgress {
  taskId: number;
  daoId: number;
  progress: number;
  statut: string;
  timestamp: number;
}

interface DAOProgress {
  daoId: number;
  totalProgress: number;
  completedTasks: number;
  totalTasks: number;
  percentage: number;
  status: string;
}

class ProgressManager {
  private static instance: ProgressManager;
  private listeners: Map<string, (data: any) => void> = new Map();
  private cache: Map<number, DAOProgress> = new Map();
  private lastUpdate: number = 0;

  private constructor() {
    // Écoute les changements de progression via événements personnalisés
    this.setupEventListeners();
  }

  public static getInstance(): ProgressManager {
    if (!ProgressManager.instance) {
      ProgressManager.instance = new ProgressManager();
    }
    return ProgressManager.instance;
  }

  // Enregistrer un écouteur pour les mises à jour de progression
  public subscribe(key: string, callback: (data: any) => void): void {
    this.listeners.set(key, callback);
  }

  // Se désabonner
  public unsubscribe(key: string): void {
    this.listeners.delete(key);
  }

  // Notifier tous les écouteurs d'un changement
  private notify(key: string, data: any): void {
    this.listeners.forEach((callback, listenerKey) => {
      if (listenerKey === key) {
        callback(data);
      }
    });
  }

  // Mettre à jour la progression d'une tâche
  public updateTaskProgress(taskId: number, daoId: number, progress: number, statut: string): void {
    const taskProgress: TaskProgress = {
      taskId,
      daoId,
      progress,
      statut,
      timestamp: Date.now()
    };

    // Mettre à jour le cache
    this.updateDAOProgress(daoId);

    // Notifier tous les écouteurs
    this.notify('task-progress', taskProgress);
    this.notify('dao-progress', { daoId, progress: this.getDAOProgress(daoId) });
  }

  // Récupérer la progression d'un DAO
  public getDAOProgress(daoId: number): DAOProgress | null {
    return this.cache.get(daoId) || null;
  }

  // Mettre à jour le cache d'un DAO
  private updateDAOProgress(daoId: number): void {
    // Cette fonction sera appelée par les pages pour synchroniser
    // La logique de calcul sera implémentée dans chaque page
    const currentProgress = this.cache.get(daoId);
    if (currentProgress) {
      // Recalculer basé sur les nouvelles données
      this.cache.set(daoId, {
        ...currentProgress,
        percentage: Math.round(currentProgress.totalProgress / currentProgress.totalTasks),
        status: this.calculateStatus(currentProgress)
      });
    }
  }

  // Calculer le statut basé sur la progression
  private calculateStatus(progress: DAOProgress): string {
    if (progress.percentage === 100) {
      return 'TERMINEE';
    } else if (progress.percentage > 0) {
      return 'EN_COURS';
    } else {
      return 'A_RISQUE';
    }
  }

  // Configuration des écouteurs d'événements
  private setupEventListeners(): void {
    // Écouter les changements de localStorage
    window.addEventListener('storage', (e) => {
      const event = e as StorageEvent;
      if (event.key === 'task-progress-update') {
        const data = JSON.parse(event.newValue || '{}');
        this.updateTaskProgress(data.taskId, data.daoId, data.progress, data.statut);
      }
    });

    // Écouter les changements de focus pour synchroniser
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.notify('page-focus', { timestamp: Date.now() });
      }
    });
  }

  // Nettoyer les ressources
  public destroy(): void {
    this.listeners.clear();
    this.cache.clear();
  }
}

export default ProgressManager;
export type { TaskProgress, DAOProgress };
