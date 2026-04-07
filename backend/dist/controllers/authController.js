"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.getProfile = getProfile;
exports.logout = logout;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const jwt_1 = require("../utils/jwt");
async function login(req, res) {
    try {
        const { username, password } = req.body;
        // Validation des entrées
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Le nom d\'utilisateur/email et le mot de passe sont requis'
            });
        }
        // Vérifier si c'est un email ou un username
        let user = null;
        if (username.includes('@')) {
            // C'est un email - d'abord récupérer l'utilisateur sans mot de passe
            const userWithoutPassword = await (0, User_1.getUserByEmail)(username);
            if (userWithoutPassword) {
                // Puis récupérer l'utilisateur complet avec mot de passe
                user = await (0, User_1.getUserWithPassword)(userWithoutPassword.username);
            }
        }
        else {
            // C'est un username
            user = await (0, User_1.getUserWithPassword)(username);
        }
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Nom d\'utilisateur/email ou mot de passe incorrect'
            });
        }
        // Vérifier le mot de passe
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Nom d\'utilisateur/email ou mot de passe incorrect'
            });
        }
        // Mettre à jour la dernière connexion
        await (0, User_1.updateUserLastLogin)(user.id);
        // Générer le token JWT
        const token = (0, jwt_1.generateToken)(user);
        // Renvoyer les informations de l'utilisateur sans le mot de passe
        const userWithoutPassword = {
            id: user.id,
            username: user.username,
            email: user.email,
            url_photo: user.url_photo,
            role_id: user.role_id,
            created_at: user.created_at,
            updated_at: user.updated_at
        };
        res.status(200).json({
            success: true,
            message: 'Connexion réussie',
            data: {
                user: userWithoutPassword,
                token
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la connexion'
        });
    }
}
async function getProfile(req, res) {
    try {
        // L'utilisateur est déjà authentifié grâce au middleware
        const userId = req.user.userId;
        const user = await (0, User_1.getUserWithPassword)(req.user.username);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }
        // Renvoyer les informations de l'utilisateur sans le mot de passe
        const userWithoutPassword = {
            id: user.id,
            username: user.username,
            email: user.email,
            url_photo: user.url_photo,
            role_id: user.role_id,
            created_at: user.created_at,
            updated_at: user.updated_at
        };
        res.status(200).json({
            success: true,
            data: {
                user: userWithoutPassword
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération du profil'
        });
    }
}
async function logout(req, res) {
    try {
        // Pour le JWT, le logout se fait côté client en supprimant le token
        // Mais on peut quand même renvoyer une réponse de succès
        res.status(200).json({
            success: true,
            message: 'Déconnexion réussie'
        });
    }
    catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la déconnexion'
        });
    }
}
//# sourceMappingURL=authController.js.map