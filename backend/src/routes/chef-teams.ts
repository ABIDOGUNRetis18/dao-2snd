import { Router } from 'express';
import { getChefTeams } from '../controllers/chefTeamsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Obtenir les équipes d'un chef de projet
router.get('/', getChefTeams);

export default router;
