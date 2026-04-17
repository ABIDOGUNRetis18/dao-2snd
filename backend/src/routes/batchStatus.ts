import { Router } from 'express';
import { updateAllCompletedDaos, getAllDaosStatus } from '../controllers/batchStatusController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Routes de mise à jour massive des statuts
router.post('/update-completed', authenticateToken, updateAllCompletedDaos);
router.get('/check-all', authenticateToken, getAllDaosStatus);

export default router;
