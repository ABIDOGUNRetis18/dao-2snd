import { Router } from 'express';
import { getTaskModels, createTaskModel, deleteTaskModel } from '../controllers/taskModelController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Route publique pour obtenir les modèles de tâches (selon documentation)
router.get('/', getTaskModels);

// Routes protégées par authentification pour création/suppression
router.use(authenticateToken);

// Créer un nouveau modèle de tâche
router.post('/', createTaskModel);

// Supprimer un modèle de tâche
router.delete('/:id', deleteTaskModel);

export default router;
