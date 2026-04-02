import { Router } from 'express';
import { 
  getAllDaos,
  getDao,
  createDao,
  updateDao,
  deleteDao,
  archiveDao,
  getMyDaos,
  getDaoTasks,
  getDaoAssignableMembers
} from '../controllers/daoController';
import { getNextDaoNumber, getDaoTypes, addDaoType } from '../controllers/daoNumberController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Obtenir tous les DAO
router.get('/', getAllDaos);

// Obtenir les DAO de l'utilisateur connecté
router.get('/mes-daos', getMyDaos);

// Obtenir les types de DAO (doit être avant /:id)
router.get('/types', getDaoTypes);

// Ajouter un type de DAO
router.post('/types', addDaoType);

// Obtenir le prochain numéro de DAO (doit être avant /:id)
router.get('/next-number', getNextDaoNumber);

// Obtenir un DAO spécifique
router.get('/:id', getDao);

// Obtenir les tâches d'un DAO
router.get('/:id/tasks', getDaoTasks);

// Obtenir les membres assignables à un DAO
router.get('/:id/members', getDaoAssignableMembers);

// Créer un nouveau DAO
router.post('/', createDao);

// Mettre à jour un DAO
router.put('/:id', updateDao);

// Supprimer un DAO
router.delete('/:id', deleteDao);

// Archiver un DAO
router.put('/:id/archive', archiveDao);

export default router;
