"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const daoController_1 = require("../controllers/daoController");
const daoNumberController_1 = require("../controllers/daoNumberController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_1.authenticateToken);
// Obtenir tous les DAO
router.get('/', daoController_1.getAllDaos);
// Obtenir les DAO de l'utilisateur connecté
router.get('/mes-daos', daoController_1.getMyDaos);
// Obtenir les DAO où l'admin est aussi chef de projet (double casquette)
router.get('/my-daos-as-chef', daoController_1.getMyDaos); // Réutilise getMyDaos mais accessible aux admins
// Obtenir les types de DAO (doit être avant /:id)
router.get('/types', daoNumberController_1.getDaoTypes);
// Ajouter un type de DAO
router.post('/types', daoNumberController_1.addDaoType);
// Obtenir le prochain numéro de DAO (doit être avant /:id)
router.get('/next-number', daoNumberController_1.getNextDaoNumber);
// Obtenir les DAO terminés (doit être avant /:id)
router.get('/finished', daoController_1.getFinishedDaos);
// Obtenir un DAO spécifique
router.get('/:id', daoController_1.getDao);
// Obtenir les tâches d'un DAO
router.get('/:id/tasks', daoController_1.getDaoTasks);
// Obtenir les membres assignables à un DAO
router.get('/:id/members', daoController_1.getDaoAssignableMembers);
// Créer un nouveau DAO - Admin seulement
router.post('/', auth_1.requireAdmin, daoController_1.createDao);
// Mettre à jour un DAO - Admin ou Directeur
router.put('/:id', auth_1.requireAdminOrDirector, daoController_1.updateDao);
// Supprimer un DAO - Admin seulement
router.delete('/:id', auth_1.requireAdmin, daoController_1.deleteDao);
// Archiver un DAO - Admin ou Directeur
router.put('/:id/archive', auth_1.requireAdminOrDirector, daoController_1.archiveDao);
// Marquer un DAO comme terminé - Admin ou Directeur
router.put('/:id/finish', auth_1.requireAdminOrDirector, daoController_1.markDaoAsFinished);
// Diagnostiquer les statuts de DAO - Admin seulement
router.get('/admin/diagnose-dao-status', auth_1.requireAdmin, daoController_1.diagnoseDaoStatus);
// Mettre à jour tous les statuts de DAO - Admin seulement
router.post('/admin/update-dao-status', auth_1.requireAdmin, daoController_1.updateAllDaoStatus);
exports.default = router;
//# sourceMappingURL=dao.js.map