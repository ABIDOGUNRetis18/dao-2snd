import { Router } from 'express';
import { 
  getDaoTeamMembers, 
  addTeamMember, 
  removeTeamMember 
} from '../controllers/teamController';
import { authenticateToken, requireAdmin, requireAdminOrChef } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Obtenir les membres de l'équipe d'un DAO
router.get('/dao/:daoId/team-members', getDaoTeamMembers);

// Ajouter un membre à l'équipe d'un DAO (admin ou chef du DAO)
router.post('/dao/:daoId/team-members', requireAdminOrChef, addTeamMember);

// Retirer un membre de l'équipe d'un DAO (admin ou chef du DAO)
router.delete('/dao/:daoId/team-members/:userId', requireAdminOrChef, removeTeamMember);

export default router;
