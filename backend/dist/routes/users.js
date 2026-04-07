"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Routes publiques (aucune pour le moment - toutes nécessitent une authentification)
// Routes protégées - nécessitent une authentification
router.use(auth_1.authenticateToken);
// Route pour obtenir le profil de l'utilisateur connecté
router.get('/profile', userController_1.getUserProfileController);
// Route pour changer le mot de passe (accessible par tous les utilisateurs authentifiés)
router.put('/change-password', userController_1.changePasswordController);
// Routes pour la gestion des utilisateurs - nécessitent des droits admin/directeur
router.use(auth_1.requireAdminOrDirector);
// Obtenir tous les utilisateurs
router.get('/', userController_1.getAllUsersController);
// Créer un nouvel utilisateur
router.post('/', userController_1.createUserController);
// Mettre à jour un utilisateur
router.put('/:id', userController_1.updateUserController);
// Supprimer un utilisateur
router.delete('/:id', userController_1.deleteUserController);
exports.default = router;
//# sourceMappingURL=users.js.map