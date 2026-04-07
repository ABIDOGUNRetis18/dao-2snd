"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("../controllers/taskController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Routes protégées par authentification
router.use(auth_1.authenticateToken);
// Obtenir les tâches depuis la table task
router.get('/dao/:id', taskController_1.getTasksByDao);
// Obtenir les tâches de l'utilisateur connecté
router.get('/my-tasks', taskController_1.getMyTasks);
// Créer une nouvelle tâche dans la table task
router.post('/dao/:id', taskController_1.createTask);
// Assigner une tâche (route spécifique en premier)
router.put('/:taskId/assign', taskController_1.assignTask);
// Mettre à jour le statut d'une tâche
router.put('/:taskId/status', taskController_1.updateTaskStatus);
// Mettre à jour la progression d'une tâche
router.put('/:taskId/progress', taskController_1.updateTaskProgress);
// Mettre à jour une tâche (route générique après)
router.put('/:id', taskController_1.updateTask);
// Supprimer une tâche
router.delete('/:id', taskController_1.deleteTask);
exports.default = router;
//# sourceMappingURL=tasks.js.map