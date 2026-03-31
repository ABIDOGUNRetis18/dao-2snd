import { Router } from 'express';
import { 
  getAllUsersController, 
  createUserController, 
  updateUserController,
  deleteUserController,
  getUserProfileController 
} from '../controllers/userController';
import { authenticateToken, requireAdminOrDirector } from '../middleware/auth';

const router = Router();

// Routes publiques (aucune pour le moment - toutes nécessitent une authentification)

// Routes protégées - nécessitent une authentification
router.use(authenticateToken);

// Route pour obtenir le profil de l'utilisateur connecté
router.get('/profile', getUserProfileController);

// Routes pour la gestion des utilisateurs - nécessitent des droits admin/directeur
router.use(requireAdminOrDirector);

// Obtenir tous les utilisateurs
router.get('/', getAllUsersController);

// Créer un nouvel utilisateur
router.post('/', createUserController);

// Mettre à jour un utilisateur
router.put('/:id', updateUserController);

// Supprimer un utilisateur
router.delete('/:id', deleteUserController);

export default router;
