import { Router } from 'express';
import { login, getProfile, logout } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Route de connexion avec rate limiting
router.post('/login', authLimiter, login);

// Route pour obtenir le profil de l'utilisateur connecté
router.get('/profile', authenticateToken, getProfile);

// Route pour obtenir l'utilisateur connecté (alias de /profile)
router.get('/me', authenticateToken, getProfile);

// Route de déconnexion
router.post('/logout', authenticateToken, logout);

export default router;
