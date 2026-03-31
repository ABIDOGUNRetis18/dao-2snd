"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Route de connexion
router.post('/login', authController_1.login);
// Route pour obtenir le profil de l'utilisateur connecté
router.get('/profile', auth_1.authenticateToken, authController_1.getProfile);
// Route de déconnexion
router.post('/logout', auth_1.authenticateToken, authController_1.logout);
exports.default = router;
//# sourceMappingURL=auth.js.map