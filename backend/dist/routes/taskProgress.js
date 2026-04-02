"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskProgressController_1 = require("../controllers/taskProgressController");
// import { authenticateToken } from '../middleware/auth';
const router = (0, express_1.Router)();
// Temporairement désactivé pour tester - à réactiver après correction du token
// router.use(authenticateToken);
// Mettre à jour la progression d'une tâche
router.put('/:id/progress', taskProgressController_1.updateTaskProgress);
exports.default = router;
//# sourceMappingURL=taskProgress.js.map