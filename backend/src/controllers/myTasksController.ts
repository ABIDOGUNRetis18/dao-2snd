import { Request, Response } from 'express';
import { query } from '../utils/database';

export async function getMyTasks(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId; // ID de l'utilisateur connecté
    
    // Récupérer les tâches assignées à l'utilisateur connecté
    // La table task contient les modèles, la table tasks contient les instances assignées
    // On utilise uniquement tasks car c'est là que sont stockées les assignations réelles
    const tasksResult = await query(`
      SELECT 
        ts.id as id,
        ts.id_task,
        COALESCE(tm.nom, ts.titre) as titre,
        ts.dao_id,
        ts.progress,
        ts.statut,
        ts.assigned_to,
        u.username as assigned_username,
        u.email as assigned_email,
        d.numero as dao_numero,
        d.objet as dao_objet,
        d.chef_projet_nom as chef_projet_nom,
        ts.created_at,
        ts.updated_at
      FROM tasks ts
      LEFT JOIN task tm ON ts.id_task = tm.id
      JOIN daos d ON ts.dao_id = d.id
      LEFT JOIN users u ON ts.assigned_to = u.id
      WHERE ts.assigned_to = $1
      ORDER BY ts.created_at DESC
    `, [userId]);

    // Formatter les données
    const tasks = tasksResult.rows.map((task: any) => ({
      id: task.id,
      id_task: task.id_task,
      nom: task.titre,
      dao_id: task.dao_id,
      dao_numero: task.dao_numero,
      dao_objet: task.dao_objet,
      progress: task.progress || 0,
      statut: task.statut,
      priority: 'moyenne', // Valeur par défaut car la table task n'a pas de priorité
      due_date: null, // Valeur par défaut car la table task n'a pas de date d'échéance
      assigned_to: task.assigned_to,
      assigned_username: task.assigned_username,
      assigned_email: task.assigned_email,
      chef_projet_nom: task.chef_projet_nom,
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
    console.error('Erreur lors de la récupération des tâches de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des tâches'
    });
  }
}
