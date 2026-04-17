// Utilitaires pour la gestion centralisée du statut des DAOs

interface DAO {
  id: number;
  statut: string | null;
  date_depot?: string | null;
  progression?: number;
}

interface Task {
  id: number;
  progress: number;
  statut?: string;
}

/**
 * Logique centralisée de calcul du statut pour les pages admin
 */
export const computeStatus = (dao: DAO) => {
  const rawStatut = String(dao.statut || "").toUpperCase();

  // Statut terminé -> vert
  if (rawStatut === "TERMINEE" || rawStatut === "TERMINE") {
    return { label: "Terminée", className: "bg-green-100 text-green-800 border-green-200" };
  }

  // Logique basée sur date de dépôt
  if (!dao.date_depot) {
    return { label: "En cours", className: "bg-yellow-100 text-yellow-800 border-yellow-200" };
  }

  const dateDepot = new Date(dao.date_depot);
  const today = new Date();
  const diffTime = dateDepot.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 5) {
    return { label: "EN COURS", className: "bg-blue-100 text-blue-800 border-blue-200" };
  }
  
  if (diffDays <= 3) {
    return { label: "À risque", className: "bg-red-100 text-red-800 border-red-200" };
  }

  return { label: "En cours", className: "bg-yellow-100 text-yellow-800 border-yellow-200" };
};

/**
 * Logique de statut basée sur la progression (alternative)
 */
export const computeStatusFromProgress = (progression: number, statut?: string | null) => {
  const rawStatut = String(statut || "").toUpperCase();

  // Priorité au statut explicite du DAO
  if (rawStatut === "TERMINEE" || rawStatut === "TERMINE") {
    return { label: "Terminée", className: "bg-green-100 text-green-800 border-green-200" };
  }

  if (rawStatut === "A_RISQUE") {
    return { label: "À risque", className: "bg-red-100 text-red-800 border-red-200" };
  }

  if (rawStatut === "EN_COURS") {
    return { label: "En cours", className: "bg-blue-100 text-blue-800 border-blue-200" };
  }

  // Sinon, basé sur la progression
  if (progression === 0) {
    return { label: "À risque", className: "bg-red-100 text-red-800 border-red-200" };
  } else if (progression === 100) {
    return { label: "Terminée", className: "bg-green-100 text-green-800 border-green-200" };
  } else {
    return { label: "En cours", className: "bg-blue-100 text-blue-800 border-blue-200" };
  }
};

/**
 * Calcule la progression moyenne des tâches d'un DAO
 */
export const calculateAverageProgress = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
  return Math.round(totalProgress / tasks.length);
};

/**
 * Charge les DAOs avec leur progression calculée
 */
export const loadDaosWithProgress = async (daoEndpoint: string, taskEndpoint: string): Promise<DAO[]> => {
  try {
    // 1. Récupérer tous les DAOs
    const daoRes = await fetch(daoEndpoint);
    const daoData = await daoRes.json();
    
    if (!daoData.success) {
      throw new Error('Erreur lors du chargement des DAOs');
    }

    const daos = daoData.data || [];

    // 2. Pour chaque DAO, calculer la progression
    const daosWithProgress = await Promise.all(
      daos.map(async (dao: DAO) => {
        try {
          // Récupérer les tâches du DAO
          const tasksRes = await fetch(`${taskEndpoint}?daoId=${dao.id}`);
          const tasksData = await tasksRes.json();
          
          if (tasksData.success && tasksData.data && tasksData.data.length > 0) {
            const avgProgress = calculateAverageProgress(tasksData.data);
            return { ...dao, progression: avgProgress };
          }
          return { ...dao, progression: 0 };
        } catch (error) {
          console.error(`Erreur DAO ${dao.id}:`, error);
          return { ...dao, progression: 0 };
        }
      })
    );
    
    return daosWithProgress;
  } catch (error) {
    console.error('Erreur lors du chargement des DAOs avec progression:', error);
    return [];
  }
};

/**
 * Met à jour la progression d'une tâche avec API call
 */
export const updateTaskProgress = async (taskId: number, progress: number) => {
  try {
    const response = await fetch(`http://localhost:3001/api/task-progress/${taskId}/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress }),
    });
    
    if (!response.ok) {
      throw new Error('Échec de la mise à jour');
    }
    
    const result = await response.json();
    console.log('Progression mise à jour, statut DAO recalculé:', result);
    return result;
  } catch (error) {
    console.error('Erreur mise à jour progression:', error);
    throw error;
  }
};
