"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const myTasksController_1 = require("../controllers/myTasksController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Routes protégées par authentification
router.use(auth_1.authenticateToken);
// Obtenir les tâches de l'utilisateur connecté
router.get('/', myTasksController_1.getMyTasks);
exports.default = router;
//# sourceMappingURL=myTasks.js.map