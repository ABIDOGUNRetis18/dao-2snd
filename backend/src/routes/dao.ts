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
  getDaoAssignableMembers,
  getFinishedDaos,
  markDaoAsFinished,
  diagnoseDaoStatus,
  updateAllDaoStatus
} from '../controllers/daoController';
import { getNextDaoNumber, getDaoTypes, addDaoType } from '../controllers/daoNumberController';
import { authenticateToken, requireAdmin, requireAdminOrDirector, requireManagementRole } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Obtenir tous les DAO
router.get('/', getAllDaos);

// Obtenir les DAO de l'utilisateur connecté
router.get('/mes-daos', getMyDaos);

// Obtenir les DAO où l'admin est aussi chef de projet (double casquette)
router.get('/my-daos-as-chef', getMyDaos); // Réutilise getMyDaos mais accessible aux admins

// Obtenir les types de DAO (doit être avant /:id)
router.get('/types', getDaoTypes);

// Ajouter un type de DAO
router.post('/types', addDaoType);

// Obtenir le prochain numéro de DAO (doit être avant /:id)
router.get('/next-number', getNextDaoNumber);

// Obtenir les DAO terminés (doit être avant /:id)
router.get('/finished', getFinishedDaos);

// Obtenir un DAO spécifique
router.get('/:id', getDao);

// Obtenir les tâches d'un DAO
router.get('/:id/tasks', getDaoTasks);

// Obtenir les membres assignables à un DAO
router.get('/:id/members', getDaoAssignableMembers);

// Créer un nouveau DAO - Admin seulement
router.post('/', requireAdmin, createDao);

// Mettre à jour un DAO - Admin ou Directeur
router.put('/:id', requireAdminOrDirector, updateDao);

// Supprimer un DAO - Admin seulement
router.delete('/:id', requireAdmin, deleteDao);

// Archiver un DAO - Admin ou Directeur
router.put('/:id/archive', requireAdminOrDirector, archiveDao);

// Marquer un DAO comme terminé - Admin ou Directeur
router.put('/:id/finish', requireAdminOrDirector, markDaoAsFinished);

// Diagnostiquer les statuts de DAO - Admin seulement
router.get('/admin/diagnose-dao-status', requireAdmin, diagnoseDaoStatus);

// Mettre à jour tous les statuts de DAO - Admin seulement
router.post('/admin/update-dao-status', requireAdmin, updateAllDaoStatus);

export default router;
