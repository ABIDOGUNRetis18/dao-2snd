import { Request, Response } from 'express';
import { query } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { checkAndUpdateDaoStatus } from './daoController';

export async function getTasksByDao(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Récupérer les tâches pour un DAO spécifique depuis la table task avec le nom des utilisateurs assignés
    const result = await query(`
      SELECT 
        t.id,
        t.nom,
        t.progress,
        t.statut,
        t.assigned_to,
        u.username as assigned_username,
        u.email as assigned_email,
        CURRENT_TIMESTAMP as created_at,
        CURRENT_TIMESTAMP as updated_at
      FROM task t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.dao_id = $1
      ORDER BY t.id ASC
    `, [id]);

    // Formatter les données pour correspondre à l'interface attendue
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
      updated_at: task.updated_at
    }));

    res.status(200).json({
      success: true,
      data: {
        tasks
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

export async function createTask(req: Request, res: Response) {
  try {
    const { nom, titre } = req.body;
    const { id: daoId } = req.params;
    
    // Accepter nom ou titre
    const taskTitle = titre || nom;
    
    // Validation des entrées
    if (!taskTitle || !daoId) {
      return res.status(400).json({
        success: false,
        message: 'Le titre de la tâche et l\'ID du DAO sont requis'
      });
    }

    const result = await query(`
      INSERT INTO task (nom, dao_id)
      VALUES ($1, $2)
      RETURNING id, nom, dao_id
    `, [taskTitle, daoId]);

    res.status(201).json({
      success: true,
      message: 'Tâche créée avec succès',
      data: {
        task: result.rows[0]
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

export async function assignTask(req: Request, res: Response) {
  try {
    const { taskId } = req.params;
    const { assigned_to } = req.body;

    // Mettre à jour l'assignation dans la table task
    const result = await query(`
      UPDATE task 
      SET assigned_to = $1
      WHERE id = $2
      RETURNING *
    `, [assigned_to, taskId]);

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

export async function updateTask(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { titre, description, statut, priorite, date_echeance, assigned_to, progress } = req.body;

    const result = await query(`
      UPDATE tasks 
      SET titre = $1,
          description = $2,
          statut = $3,
          priorite = $4,
          date_echeance = $5,
          assigned_to = $6,
          progress = $7,
          updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [titre, description, statut, priorite, date_echeance, assigned_to, progress, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    const updatedTask = result.rows[0];

    // Vérifier automatiquement si le DAO doit être marqué comme terminé
    if (updatedTask.dao_id) {
      await checkAndUpdateDaoStatus(updatedTask.dao_id);
    }

    res.status(200).json({
      success: true,
      message: 'Tâche mise à jour avec succès',
      data: {
        task: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour de la tâche'
    });
  }
}

export async function deleteTask(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM task WHERE id = $1 RETURNING id, nom, dao_id', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    const deletedTask = result.rows[0];

    // Vérifier automatiquement si le DAO doit être marqué comme terminé
    if (deletedTask.dao_id) {
      await checkAndUpdateDaoStatus(deletedTask.dao_id);
    }

    res.status(200).json({
      success: true,
      message: 'Tâche supprimée avec succès',
      data: {
        deletedTask: result.rows[0]
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

export async function getMyTasks(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    const result = await query(`
      SELECT 
        t.id,
        t.id_task,
        t.nom,
        t.dao_id,
        d.numero as dao_numero,
        d.objet as dao_objet,
        t.statut,
        t.progress,
        t.assigned_to,
        u.username as assigned_username,
        u.email as assigned_email,
        d.chef_projet_nom,
        t.created_at,
        t.updated_at,
        NULL as priority, // La table task n'a pas de colonne priority
        NULL as due_date   // La table task n'a pas de colonne due_date
      FROM task t
      JOIN daos d ON t.dao_id = d.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to = $1
      ORDER BY t.created_at DESC
    `, [userId]);

    res.status(200).json({
      success: true,
      data: {
        tasks: result.rows
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des tâches de l\'utilisateur'
    });
  }
}

export async function updateTaskStatus(req: Request, res: Response) {
  try {
    const { taskId } = req.params;
    const { statut } = req.body;

    // Récupérer la tâche cible
    const currentTaskResult = await query(
      'SELECT id, dao_id, assigned_to FROM task WHERE id = $1',
      [taskId]
    );

    if (currentTaskResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    const currentTask = currentTaskResult.rows[0];

    // Récupérer la première tâche du DAO (ordre de création)
    const firstTaskResult = await query(
      'SELECT id, progress FROM task WHERE dao_id = $1 ORDER BY id ASC LIMIT 1',
      [currentTask.dao_id]
    );

    const firstTask = firstTaskResult.rows[0];
    const isStartingTask = statut === 'en_cours' || statut === 'termine';
    const isNotFirstTask = firstTask && Number(currentTask.id) !== Number(firstTask.id);

    // Règle métier: tant que la tâche 1 n'est pas à 100, les autres tâches assignées ne démarrent pas
    if (
      isStartingTask &&
      isNotFirstTask &&
      currentTask.assigned_to !== null &&
      Number(firstTask.progress || 0) < 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'La tâche 1 doit être à 100% avant de démarrer les autres tâches assignées.'
      });
    }

    // Calculer le progress en fonction du statut
    let progress = 0;
    if (statut === 'termine') progress = 100;
    else if (statut === 'en_cours') progress = 50;
    else if (statut === 'a_faire') progress = 0;

    const result = await query(
      'UPDATE task SET statut = $1, progress = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [statut, progress, taskId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Statut de la tâche mis à jour avec succès',
      data: {
        task: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de la tâche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du statut de la tâche'
    });
  }
}

export async function updateTaskProgress(req: Request, res: Response) {
  try {
    const { taskId } = req.params;
    const { progress } = req.body;

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: 'Le progress doit être entre 0 et 100'
      });
    }

    // Récupérer la tâche cible
    const currentTaskResult = await query(
      'SELECT id, dao_id, assigned_to FROM task WHERE id = $1',
      [taskId]
    );

    if (currentTaskResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    const currentTask = currentTaskResult.rows[0];

    // Récupérer la première tâche du DAO (ordre de création)
    const firstTaskResult = await query(
      'SELECT id, progress FROM task WHERE dao_id = $1 ORDER BY id ASC LIMIT 1',
      [currentTask.dao_id]
    );

    const firstTask = firstTaskResult.rows[0];
    const isNotFirstTask = firstTask && Number(currentTask.id) !== Number(firstTask.id);

    // Règle métier: tant que la tâche 1 n'est pas à 100, les autres tâches assignées ne démarrent pas
    if (
      progress > 0 &&
      isNotFirstTask &&
      currentTask.assigned_to !== null &&
      Number(firstTask.progress || 0) < 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'La tâche 1 doit être à 100% avant de démarrer les autres tâches assignées.'
      });
    }

    // Calculer le statut en fonction du progress
    let statut = 'a_faire';
    if (progress === 100) statut = 'termine';
    else if (progress > 0) statut = 'en_cours';

    const result = await query(
      'UPDATE task SET progress = $1, statut = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [progress, statut, taskId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Progression de la tâche mise à jour avec succès',
      data: {
        task: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression de la tâche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour de la progression de la tâche'
    });
  }
}
