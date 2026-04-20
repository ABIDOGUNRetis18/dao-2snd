"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireManagementRole = exports.requireAdminOrChef = exports.requireAdminOrDirector = exports.requireAdmin = void 0;
exports.authenticateToken = authenticateToken;
exports.requireRole = requireRole;
const jwt_1 = require("../utils/jwt");
function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token d\'authentification manquant'
            });
        }
        const decoded = (0, jwt_1.verifyToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token invalide ou expiré'
        });
    }
}
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non authentifié'
            });
        }
        if (!allowedRoles.includes(req.user.roleId)) {
            return res.status(403).json({
                success: false,
                message: 'Permissions insuffisantes pour accéder à cette ressource'
            });
        }
        next();
    };
}
// Middleware pour vérifier si l'utilisateur est admin (role_id = 2)
exports.requireAdmin = requireRole([2]);
// Middleware pour vérifier si l'utilisateur est admin (2) ou directeur (1)
exports.requireAdminOrDirector = requireRole([1, 2]);
// Middleware pour vérifier si l'utilisateur est admin (2) ou chef de projet (3)
exports.requireAdminOrChef = requireRole([2, 3]);
// Middleware pour vérifier si l'utilisateur a un rôle de gestion (1, 2, 3)
exports.requireManagementRole = requireRole([1, 2, 3]);
//# sourceMappingURL=auth.js.map