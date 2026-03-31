"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const daoController_1 = require("../controllers/daoController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Toutes les routes nécessitent une authentification
router.use(auth_1.authenticateToken);
// Obtenir le prochain numéro de DAO
router.get('/next-number', daoController_1.getNextDaoNumber);
// Obtenir les types de DAO
router.get('/types', daoController_1.getDaoTypes);
// Créer un nouveau DAO
router.post('/', daoController_1.createDao);
exports.default = router;
//# sourceMappingURL=dao.js.map