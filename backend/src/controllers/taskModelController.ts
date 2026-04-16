import { Request, Response } from 'express';
import { query } from '../utils/database';

// Obtenir tous les modèles de tâches
export async function getTaskModels(req: Request, res: Response) {
  try {
    console.log('[PostgreSQL] Récupération des modèles de tâches');
    
    const result = await query(`
      SELECT id, nom
      FROM task
      WHERE dao_id IS NULL
      ORDER BY id ASC
    `);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des modèles de tâches:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des modèles de tâches'
    });
  }
}

// Créer un nouveau modèle de tâche
export async function createTaskModel(req: Request, res: Response) {
  try {
    const { nom } = req.body;
    
    if (!nom) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du modèle de tâche est requis'
      });
    }

    const result = await query(`
      INSERT INTO task (nom)
      VALUES ($1)
      RETURNING id, nom, created_at
    `, [nom]);

    res.status(201).json({
      success: true,
      message: 'Modèle de tâche créé avec succès',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création du modèle de tâche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du modèle de tâche'
    });
  }
}

// Supprimer un modèle de tâche
export async function deleteTaskModel(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Vérifier si des instances existent pour ce modèle
    const existingInstances = await query(`
      SELECT COUNT(*) as count FROM tasks WHERE id_task = $1
    `, [id]);

    if (parseInt(existingInstances.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer ce modèle : des tâches existent déjà'
      });
    }

    const result = await query('DELETE FROM task WHERE id = $1 RETURNING id, nom', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Modèle de tâche non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Modèle de tâche supprimé avec succès',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du modèle de tâche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du modèle de tâche'
    });
  }
}
