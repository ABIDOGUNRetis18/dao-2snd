import { Router } from 'express';
import { query } from '../utils/database';
import { 
  getTasksByDao, 
  createTask, 
  updateTaskProgress, 
  deleteTask,
  assignTask 
} from '../controllers/taskController_v2';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Routes protégées par authentification
router.use(authenticateToken);

// 🎯 ROUTES PRINCIPALES - LOGIQUE DES 15 TÂCHES

// Obtenir les tâches d'un DAO avec statut de blocage séquentiel
router.get('/dao/:id', getTasksByDao);

// Créer une nouvelle tâche (avec contrôle de limite de 15 et logique séquentielle)
router.post('/dao/:id', createTask);

// Assigner une tâche (admin ou chef de projet)
router.put('/:id/assign', assignTask);

// Mettre à jour la progression d'une tâche (avec contrôle séquentiel)
router.put('/:id/progress', updateTaskProgress);

// Supprimer une tâche
router.delete('/:id', deleteTask);

// Routes legacy maintenues pour compatibilité
router.get('/my-tasks', async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const result = await query(`
      SELECT 
        t.id,
        t.nom,
        t.progress,
        t.statut,
        t.assigned_to,
        d.numero as dao_numero,
        d.objet as dao_objet,
        u.username as assigned_username,
        t.created_at,
        t.updated_at,
        CASE 
          WHEN t.id = (SELECT MIN(id) FROM task WHERE dao_id = d.id) THEN true
          WHEN EXISTS (
            SELECT 1 FROM task t2 
            WHERE t2.dao_id = d.id 
            AND t2.id < t.id 
            AND t2.progress >= 100
          ) THEN true
          ELSE false
        END as is_unlocked
      FROM task t
      JOIN daos d ON t.dao_id = d.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to = $1
      ORDER BY t.created_at DESC
    `, [userId]);

    const tasks = result.rows.map((task: any) => ({
      id: task.id,
      id_task: task.id,
      nom: task.nom,
      progress: task.progress || 0,
      statut: task.statut,
      assigned_to: task.assigned_to,
      assigned_username: task.assigned_username,
      dao_numero: task.dao_numero,
      dao_objet: task.dao_objet,
      created_at: task.created_at,
      updated_at: task.updated_at,
      is_unlocked: task.is_unlocked,
      is_blocked: !task.is_unlocked
    }));

    res.status(200).json({
      success: true,
      data: {
        tasks
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des tâches'
    });
  }
});

export default router;
