import { Router } from 'express';
import { getChefTeams } from '../controllers/chefTeamsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protéger toutes les routes
router.use(authenticateToken);

// Route principale pour récupérer les équipes du chef
router.get('/', getChefTeams);

export default router;
