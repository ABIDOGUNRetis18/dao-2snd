import { Router } from 'express';
import { login, getProfile, logout } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Route de connexion
router.post('/login', login);

// Route pour obtenir le profil de l'utilisateur connecté
router.get('/profile', authenticateToken, getProfile);

// Route de déconnexion
router.post('/logout', authenticateToken, logout);

export default router;
