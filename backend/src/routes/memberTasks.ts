import { Router } from 'express';
import { getMemberTasks } from '../controllers/memberTasksController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Routes protégées par authentification
router.use(authenticateToken);

// Obtenir les tâches d'un membre spécifique
router.get('/', getMemberTasks);

export default router;
