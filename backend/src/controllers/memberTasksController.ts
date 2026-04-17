import { Request, Response } from 'express';
import { query } from '../utils/database';

export async function getMemberTasks(req: Request, res: Response) {
  try {
    const { userId } = req.query;
    const currentUserId = (req as any).user.userId; // ID de l'utilisateur connecté

    // Si userId n'est pas fourni, utiliser l'utilisateur connecté
    const targetUserId = userId ? Number(userId) : currentUserId;

    // Vérifier que l'utilisateur peut voir ces tâches (soit les siennes, soit admin/chef)
    if (targetUserId !== currentUserId) {
      // Vérifier si l'utilisateur est admin ou chef
      const userResult = await query(
        'SELECT role_id FROM users WHERE id = $1',
        [currentUserId]
      );

      const userRole = userResult.rows[0]?.role_id;
      if (userRole !== 1 && userRole !== 2 && userRole !== 3) { // Pas admin (1,2) ni chef
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas l'autorisation de voir ces tâches"
        });
      }
    }

    // Récupérer les tâches assignées à l'utilisateur
    const tasksResult = await query(`
      SELECT 
        t.id,
        t.id_task,
        t.dao_id,
        t.titre,
        t.description,
        t.statut,
        t.progress,
        t.date_echeance,
        t.priorite,
        t.assigned_to,
        t.updated_at,
        d.objet as dao_objet,
        d.numero as dao_numero,
        u.username as assigned_username,
        u.email as assigned_email
      FROM tasks t
      LEFT JOIN daos d ON t.dao_id = d.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to = $1
      ORDER BY t.created_at DESC
    `, [targetUserId]);

    res.status(200).json({
      success: true,
      data: {
        tasks: tasksResult.rows,
        userId: targetUserId
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches du membre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des tâches',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}
