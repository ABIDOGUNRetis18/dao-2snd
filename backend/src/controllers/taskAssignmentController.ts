import { Request, Response } from 'express';
import { query } from '../utils/database';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getTaskAssignments(req: Request, res: Response) {
  try {
    const { daoId } = req.query;

    // Si pas de daoId, retourner un tableau vide
    if (!daoId) {
      return res.status(200).json({
        success: true,
        data: {
          assignments: [],
        },
      });
    }

    // Vérifier que le DAO existe
    const daoExists = await query(
      "SELECT id FROM daos WHERE id = $1",
      [daoId]
    );

    if (daoExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "DAO non trouvé",
      });
    }

    // Récupérer les assignations existantes pour ce DAO
    // Si aucune assignation n'existe, retourner un tableau vide
    const assignmentsQuery = `
      SELECT 
        ts.id_task as id_task,
        ts.titre as task_name,
        ts.dao_id,
        ts.assigned_to,
        u.username as assigned_username,
        u.email as assigned_email,
        u.role_id as assigned_role_id,
        ts.statut,
        ts.progress,
        ts.created_at
      FROM tasks ts
      LEFT JOIN users u ON ts.assigned_to = u.id
      WHERE ts.dao_id = $1
      ORDER BY ts.id_task ASC
    `;

    const result = await query(assignmentsQuery, [daoId]);

    res.status(200).json({
      success: true,
      data: {
        assignments: result.rows || [],
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des assignations:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des assignations",
    });
  }
}

export async function createTaskAssignment(req: AuthenticatedRequest, res: Response) {
  try {
    const { dao_id, id_task, assigned_to } = req.body;

    if (!dao_id || !id_task) {
      return res.status(400).json({
        success: false,
        message: "ID du DAO et ID du modèle de tâche sont requis",
      });
    }

    // Vérifier que l'id_task est entre 1 et 15 (les 15 tâches spécifiques)
    if (Number(id_task) < 1 || Number(id_task) > 15) {
      return res.status(400).json({
        success: false,
        message: "L'ID du modèle de tâche doit être compris entre 1 et 15",
      });
    }

    // Vérifier si cette tâche existe déjà pour ce DAO
    const existingTask = await query(
      "SELECT id, assigned_to FROM tasks WHERE dao_id = $1 AND id_task = $2",
      [Number(dao_id), Number(id_task)]
    );

    // Si la tâche existe déjà, juste mettre à jour l'assignation
    if (existingTask.rows.length > 0) {
      const result = await query(
        "UPDATE tasks SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP WHERE dao_id = $2 AND id_task = $3 RETURNING *",
        [Number(assigned_to) || null, Number(dao_id), Number(id_task)]
      );

      return res.status(200).json({
        success: true,
        message: "Assignation de tâche mise à jour avec succès",
        data: result.rows[0]
      });
    }

    // Récupérer le nom du modèle de tâche
    const taskModelResult = await query(
      "SELECT nom FROM task WHERE id = $1",
      [Number(id_task)]
    );

    if (taskModelResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Modèle de tâche non trouvé",
      });
    }

    const taskName = taskModelResult.rows[0].nom;

    // Créer une nouvelle tâche concrète
    const result = await query(
      `INSERT INTO tasks (dao_id, id_task, titre, assigned_to, progress, created_at)
       VALUES ($1, $2, $3, $4, 0, NOW()) RETURNING *`,
      [Number(dao_id), Number(id_task), taskName, Number(assigned_to) || null]
    );

    // 3. Si assigné, vérifier que l'utilisateur existe
    if (assigned_to) {
      const userResult = await query(
        'SELECT id, username, role_id FROM users WHERE id = $1',
        [Number(assigned_to)]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Assignation de tâche créée avec succès",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'assignation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création de l'assignation",
    });
  }
}

export async function updateTaskAssignment(req: AuthenticatedRequest, res: Response) {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;

    // Si userId est null, désassigner la tâche
    if (userId === null || userId === '') {
      const result = await query(
        'UPDATE task SET assigned_to = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [taskId]
      );

      return res.status(200).json({
        success: true,
        message: "Tâche désassignée avec succès",
        data: {
          task: result.rows[0],
        },
      });
    }

    // Sinon, réassigner à un nouvel utilisateur
    return createTaskAssignment(req, res);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'assignation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour de l'assignation",
    });
  }
}

export async function deleteTaskAssignment(req: Request, res: Response) {
  try {
    const { taskId } = req.params;

    // Désassigner la tâche
    const result = await query(
      'UPDATE task SET assigned_to = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tâche non trouvée",
      });
    }

    res.status(200).json({
      success: true,
      message: "Assignation supprimée avec succès",
      data: {
        task: result.rows[0],
      },
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'assignation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression de l'assignation",
    });
  }
}

export async function getTaskAssignmentsByDao(req: Request, res: Response) {
  try {
    const { daoId } = req.params;

    const assignmentsQuery = `
      SELECT 
        ts.id_task as task_id,
        ts.titre as task_name,
        ts.statut,
        ts.progress,
        ts.assigned_to,
        u.username as assigned_username,
        u.email as assigned_email,
        u.role_id as assigned_role_id,
        CASE 
          WHEN u.role_id = 3 THEN 'Chef de projet'
          WHEN u.role_id = 4 THEN 'Membre équipe'
          ELSE 'Autre'
        END as assigned_role_name,
        ts.created_at,
        ts.updated_at
      FROM tasks ts
      LEFT JOIN users u ON ts.assigned_to = u.id
      WHERE ts.dao_id = $1
      ORDER BY ts.id_task ASC
    `;

    const result = await query(assignmentsQuery, [daoId]);

    res.status(200).json({
      success: true,
      data: {
        assignments: result.rows,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des assignations du DAO:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des assignations du DAO",
    });
  }
}
