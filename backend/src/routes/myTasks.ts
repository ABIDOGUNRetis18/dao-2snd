import { Router } from 'express';
import { getMyTasks } from '../controllers/myTasksController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Routes protégées par authentification
router.use(authenticateToken);

// Obtenir les tâches de l'utilisateur connecté
router.get('/', getMyTasks);

export default router;
