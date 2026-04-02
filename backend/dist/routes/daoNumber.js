"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const daoNumberController_1 = require("../controllers/daoNumberController");
const router = (0, express_1.Router)();
// Route pour générer le prochain numéro DAO
router.get('/next-number', daoNumberController_1.getNextDaoNumber);
// Routes pour la gestion des types de DAO
router.get('/types', daoNumberController_1.getDaoTypes);
router.post('/types', daoNumberController_1.addDaoType);
exports.default = router;
//# sourceMappingURL=daoNumber.js.map