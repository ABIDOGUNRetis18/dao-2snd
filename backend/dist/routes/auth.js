"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Route de connexion avec rate limiting
router.post('/login', rateLimiter_1.authLimiter, authController_1.login);
// Route pour obtenir le profil de l'utilisateur connecté
router.get('/profile', auth_1.authenticateToken, authController_1.getProfile);
// Route pour obtenir l'utilisateur connecté (alias de /profile)
router.get('/me', auth_1.authenticateToken, authController_1.getProfile);
// Route de déconnexion
router.post('/logout', auth_1.authenticateToken, authController_1.logout);
exports.default = router;
//# sourceMappingURL=auth.js.map