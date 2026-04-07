import { Request, Response } from 'express';
import { query } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';

// 🎯 LOGIQUE DES 15 TÂCHES - SYSTÈME UNIVERSEL

export async function getTasksByDao(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Récupérer les tâches pour un DAO spécifique avec progression séquentielle
    const result = await query(`
      SELECT 
        t.id,
        t.nom,
        t.progress,
        t.statut,
        t.assigned_to,
        u.username as assigned_username,
        u.email as assigned_email,
        t.created_at,
        t.updated_at,
        -- Calculer si la tâche est débloquée
        CASE 
          WHEN t.id = (SELECT MIN(id) FROM task WHERE dao_id = $1) THEN true
          WHEN EXISTS (
            SELECT 1 FROM task t2 
            WHERE t2.dao_id = $1 
            AND t2.id < t.id 
            AND t2.progress >= 100
          ) THEN true
          ELSE false
        END as is_unlocked
      FROM task t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.dao_id = $1
      ORDER BY t.id ASC
    `, [id]);

    // Formatter les données avec statut de blocage
    const tasks = result.rows.map((task: any, index: number) => ({
      id: task.id,
      id_task: task.id,
      nom: task.nom,
      progress: task.progress || 0,
      statut: task.statut,
      assigned_to: task.assigned_to,
      assigned_username: task.assigned_username,
      assigned_email: task.assigned_email,
      created_at: task.created_at,
      updated_at: task.updated_at,
      is_unlocked: task.is_unlocked,
      task_number: index + 1,
      is_blocked: !task.is_unlocked
    }));

    res.status(200).json({
      success: true,
      data: {
        tasks,
        total_tasks: tasks.length,
        max_tasks: 15,
        can_create_more: tasks.length < 15
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des tâches'
    });
  }
}

export async function createTask(req: AuthenticatedRequest, res: Response) {
  try {
    const { nom } = req.body;
    const { id: daoId } = req.params;
    
    // Validation des entrées
    if (!nom || !daoId) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la tâche et l\'ID du DAO sont requis'
      });
    }

    // 🎯 CONTRÔLE 1: Vérifier le nombre de tâches existantes
    const taskCountResult = await query(`
      SELECT COUNT(*) as count FROM task WHERE dao_id = $1
    `, [daoId]);
    
    const taskCount = parseInt(taskCountResult.rows[0].count);
    
    if (taskCount >= 15) {
      return res.status(400).json({
        success: false,
        message: "Le nombre maximum de 15 tâches par DAO a été atteint."
      });
    }

    // 🎯 CONTRÔLE 2: Vérifier la logique séquentielle
    if (taskCount > 0) {
      const firstTaskResult = await query(`
        SELECT id, nom, progress FROM task 
        WHERE dao_id = $1 
        ORDER BY id ASC 
        LIMIT 1
      `, [daoId]);

      if (firstTaskResult.rows.length > 0) {
        const firstTask = firstTaskResult.rows[0];
        if (firstTask.progress < 100) {
          return res.status(400).json({
            success: false,
            message: `Impossible de créer cette tâche. La première tâche "${firstTask.nom}" doit être terminée en premier (100%).`,
            details: {
              blocked_by_task: firstTask.id,
              blocked_by_name: firstTask.nom,
              current_progress: firstTask.progress,
              required_progress: 100
            }
          });
        }
      }
    }

    // 🎯 CRÉATION: Insérer la nouvelle tâche
    const result = await query(`
      INSERT INTO task (nom, dao_id, statut, progress)
      VALUES ($1, $2, 'a_faire', 0)
      RETURNING id, nom, dao_id, statut, progress, created_at
    `, [nom, daoId]);

    // 🎯 MISE À JOUR: Mettre à jour le statut du DAO si nécessaire
    await updateDaoStatus(daoId);

    res.status(201).json({
      success: true,
      message: 'Tâche créée avec succès',
      data: {
        task: result.rows[0],
        task_number: taskCount + 1,
        remaining_tasks: 15 - (taskCount + 1)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de la tâche'
    });
  }
}

export async function updateTaskProgress(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { progress, override = false } = req.body;
    
    const taskId = parseInt(id as string);
    
    // Validation de la progression
    if (progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: 'La progression doit être entre 0 et 100'
      });
    }

    // 🎯 CONTRÔLE: Récupérer les informations de la tâche et du DAO
    const taskInfoResult = await query(`
      SELECT t.id, t.dao_id, t.progress as current_progress, t.nom,
             (SELECT MIN(id) FROM task WHERE dao_id = t.dao_id) as first_task_id
      FROM task t
      WHERE t.id = $1
    `, [taskId]);

    if (taskInfoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    const taskInfo = taskInfoResult.rows[0];
    
    // 🎯 CONTRÔLE SÉQUENTIEL: Bloquer si ce n'est pas la première tâche
    if (taskInfo.id !== taskInfo.first_task_id && !override) {
      const firstTaskResult = await query(`
        SELECT progress FROM task 
        WHERE id = $1 AND dao_id = $2
      `, [taskInfo.first_task_id, taskInfo.dao_id]);

      if (firstTaskResult.rows.length > 0) {
        const firstTaskProgress = firstTaskResult.rows[0].progress;
        if (firstTaskProgress < 100) {
          return res.status(403).json({
            success: false,
            message: "Impossible de modifier la progression de cette tâche.",
            details: "La première tâche du DAO doit être terminée (100%) avant de pouvoir modifier les autres tâches.",
            firstTaskId: taskInfo.first_task_id,
            firstTaskProgress: firstTaskProgress,
            currentTaskId: parseInt(id),
            can_override: true
          });
        }
      }
    }

    // 🎯 MISE À JOUR: Mettre à jour la progression et le statut
    const newStatut = progress === 100 ? 'termine' : 
                     progress > 0 ? 'en_cours' : 'a_faire';

    const result = await query(`
      UPDATE task 
      SET progress = $1, statut = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [progress, newStatut, id]);

    // 🎯 MISE À JOUR: Mettre à jour le statut du DAO
    await updateDaoStatus(taskInfo.dao_id);

    res.status(200).json({
      success: true,
      message: 'Progression mise à jour avec succès',
      data: {
        task: result.rows[0],
        progress: progress,
        statut: newStatut,
        dao_status_updated: true
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour de la progression'
    });
  }
}

export async function assignTask(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;

    // 🎯 CONTRÔLE: Vérifier si la tâche peut être assignée (débloquée)
    const taskUnlockResult = await query(`
      SELECT t.id, t.nom, t.dao_id,
             CASE 
               WHEN t.id = (SELECT MIN(id) FROM task WHERE dao_id = t.dao_id) THEN true
               WHEN EXISTS (
                 SELECT 1 FROM task t2 
                 WHERE t2.dao_id = t.dao_id 
                 AND t2.id < t.id 
                 AND t2.progress >= 100
               ) THEN true
               ELSE false
             END as is_unlocked
      FROM task t
      WHERE t.id = $1
    `, [id]);

    if (taskUnlockResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    const taskInfo = taskUnlockResult.rows[0];
    
    if (!taskInfo.is_unlocked) {
      return res.status(403).json({
        success: false,
        message: 'Cette tâche est bloquée et ne peut pas être assignée',
        details: 'La tâche précédente doit être terminée (100%) avant de pouvoir assigner celle-ci'
      });
    }

    // 🎯 ASSIGNATION: Mettre à jour l'assignation
    const result = await query(`
      UPDATE task 
      SET assigned_to = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [assigned_to, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tâche assignée avec succès',
      data: {
        task: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'assignation de la tâche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'assignation de la tâche'
    });
  }
}

export async function deleteTask(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    // 🎯 CONTRÔLE: Vérifier si la tâche peut être supprimée
    const taskInfoResult = await query(`
      SELECT t.id, t.dao_id, t.nom,
             (SELECT COUNT(*) FROM task WHERE dao_id = t.dao_id) as total_tasks
      FROM task t
      WHERE t.id = $1
    `, [id]);

    if (taskInfoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    const taskInfo = taskInfoResult.rows[0];

    // 🎯 SUPPRESSION: Supprimer la tâche
    await query(`DELETE FROM task WHERE id = $1`, [id]);

    // 🎯 MISE À JOUR: Mettre à jour le statut du DAO
    await updateDaoStatus(taskInfo.dao_id);

    res.status(200).json({
      success: true,
      message: 'Tâche supprimée avec succès',
      data: {
        deleted_task_id: parseInt(id),
        remaining_tasks: taskInfo.total_tasks - 1,
        can_create_more: taskInfo.total_tasks - 1 < 15
      }
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression de la tâche'
    });
  }
}

// 🎯 FONCTION UTILITAIRE: Mettre à jour le statut du DAO selon la progression des tâches
async function updateDaoStatus(daoId: number) {
  try {
    // Calculer la progression moyenne du DAO
    const allTasksResult = await query(`
      SELECT id, progress FROM task WHERE dao_id = $1
    `, [daoId]);

    const allTasks = allTasksResult.rows;
    
    if (allTasks.length === 0) {
      // Si aucune tâche, mettre le statut par défaut
      await query(`
        UPDATE daos SET statut = 'EN_ATTENTE' WHERE id = $1
      `, [daoId]);
      return;
    }

    // Calculer les statistiques
    const totalProgress = allTasks.reduce((sum, task) => sum + (task.progress || 0), 0);
    const averageProgress = Math.round(totalProgress / allTasks.length);
    const completedTasks = allTasks.filter(task => (task.progress || 0) === 100);

    // Déterminer le nouveau statut
    let newStatut;
    if (completedTasks.length === allTasks.length && averageProgress === 100) {
      newStatut = 'TERMINEE';
    } else if (averageProgress > 0) {
      newStatut = 'EN_COURS';
    } else {
      newStatut = 'A_RISQUE';
    }

    // Mettre à jour le statut du DAO
    await query(`
      UPDATE daos SET statut = $1 WHERE id = $2
    `, [newStatut, daoId]);

    console.log(`📊 DAO ${daoId} statut mis à jour: ${newStatut} (progression moyenne: ${averageProgress}%)`);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut du DAO:', error);
  }
}

// 🎯 FONCTION UTILITAIRE: Obtenir les statistiques des tâches pour un DAO
export async function getDaoTasksStats(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN progress >= 100 THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN progress > 0 AND progress < 100 THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN progress = 0 THEN 1 END) as not_started_tasks,
        ROUND(AVG(progress)) as average_progress,
        MAX(progress) as max_progress,
        MIN(progress) as min_progress
      FROM task 
      WHERE dao_id = $1
    `, [id]);

    const stats = statsResult.rows[0];
    const completionRate = stats.total_tasks > 0 ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        total_tasks: parseInt(stats.total_tasks),
        completed_tasks: parseInt(stats.completed_tasks),
        in_progress_tasks: parseInt(stats.in_progress_tasks),
        not_started_tasks: parseInt(stats.not_started_tasks),
        average_progress: parseInt(stats.average_progress) || 0,
        max_progress: parseInt(stats.max_progress) || 0,
        min_progress: parseInt(stats.min_progress) || 0,
        completion_rate: completionRate,
        remaining_task_slots: 15 - parseInt(stats.total_tasks),
        can_create_more: parseInt(stats.total_tasks) < 15
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
}
