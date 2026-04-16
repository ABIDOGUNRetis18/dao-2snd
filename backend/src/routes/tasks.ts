import { Router } from 'express';
import { getTasksByDao, createTask, updateTask, deleteTask, assignTask, getMyTasks, updateTaskStatus, updateTaskProgress } from '../controllers/taskController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Routes protégées par authentification
router.use(authenticateToken);

// Obtenir les tâches depuis la table task (selon documentation)
router.get('/dao/:id', getTasksByDao);

// Obtenir les tâches par DAO avec query parameter (format documentation)
router.get('/', getTasksByDao);

// Obtenir les tâches de l'utilisateur connecté
router.get('/my-tasks', getMyTasks);

// Créer une nouvelle tâche dans la table task
router.post('/dao/:id', createTask);

// Assigner une tâche (route spécifique en premier)
router.put('/:taskId/assign', assignTask);

// Mettre à jour le statut d'une tâche
router.put('/:taskId/status', updateTaskStatus);

// Mettre à jour la progression d'une tâche
router.put('/:taskId/progress', updateTaskProgress);

// Mettre à jour une tâche (route générique après)
router.put('/:id', updateTask);

// Supprimer une tâche
router.delete('/:id', deleteTask);

export default router;
