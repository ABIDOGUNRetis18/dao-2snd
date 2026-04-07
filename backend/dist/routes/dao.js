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
// Obtenir les types de DAO (doit être avant /:id)
router.get('/types', daoNumberController_1.getDaoTypes);
// Ajouter un type de DAO
router.post('/types', daoNumberController_1.addDaoType);
// Obtenir le prochain numéro de DAO (doit être avant /:id)
router.get('/next-number', daoNumberController_1.getNextDaoNumber);
// Obtenir un DAO spécifique
router.get('/:id', daoController_1.getDao);
// Obtenir les tâches d'un DAO
router.get('/:id/tasks', daoController_1.getDaoTasks);
// Obtenir les membres assignables à un DAO
router.get('/:id/members', daoController_1.getDaoAssignableMembers);
// Créer un nouveau DAO
router.post('/', daoController_1.createDao);
// Mettre à jour un DAO
router.put('/:id', daoController_1.updateDao);
// Supprimer un DAO
router.delete('/:id', daoController_1.deleteDao);
// Archiver un DAO
router.put('/:id/archive', daoController_1.archiveDao);
exports.default = router;
//# sourceMappingURL=dao.js.map