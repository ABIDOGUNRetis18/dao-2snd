import { Router } from 'express';
import { testStatusSync, simulateProgressUpdate } from '../controllers/statusTestController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Routes de test pour la synchronisation du statut
router.get('/test/:daoId', authenticateToken, testStatusSync);
router.post('/simulate', authenticateToken, simulateProgressUpdate);

export default router;
