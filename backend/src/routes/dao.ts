import { Router } from 'express';
import { 
  getNextDaoNumber, 
  getDaoTypes, 
  createDao 
} from '../controllers/daoController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Obtenir le prochain numéro de DAO
router.get('/next-number', getNextDaoNumber);

// Obtenir les types de DAO
router.get('/types', getDaoTypes);

// Créer un nouveau DAO
router.post('/', createDao);

export default router;
