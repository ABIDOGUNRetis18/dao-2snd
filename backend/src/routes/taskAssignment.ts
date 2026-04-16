import { Router } from 'express';
import { 
  getTaskAssignments,
  createTaskAssignment,
  updateTaskAssignment,
  deleteTaskAssignment,
  getTaskAssignmentsByDao
} from '../controllers/taskAssignmentController';
import { authenticateToken, requireAdminOrChef } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Obtenir toutes les assignations (avec filtre optionnel par DAO)
router.get('/', getTaskAssignments);

// Obtenir les assignations d'un DAO spécifique
router.get('/dao/:daoId', getTaskAssignmentsByDao);

// Créer une assignation de tâche
router.post('/', createTaskAssignment);

// Mettre à jour une assignation de tâche
router.put('/:taskId', updateTaskAssignment);

// Supprimer une assignation de tâche (désassigner)
router.delete('/:taskId', deleteTaskAssignment);

export default router;
