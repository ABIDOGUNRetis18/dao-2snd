import { Router } from 'express';
import { updateTaskProgress } from '../controllers/taskProgressController';
// import { authenticateToken } from '../middleware/auth';

const router = Router();

// Temporairement désactivé pour tester - à réactiver après correction du token
// router.use(authenticateToken);

// Mettre à jour la progression d'une tâche
router.put('/:id/progress', updateTaskProgress);

export default router;
