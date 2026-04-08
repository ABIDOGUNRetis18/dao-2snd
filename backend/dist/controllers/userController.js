"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsersController = getAllUsersController;
exports.createUserController = createUserController;
exports.updateUserController = updateUserController;
exports.deleteUserController = deleteUserController;
exports.getUserProfileController = getUserProfileController;
exports.changePasswordController = changePasswordController;
const User_1 = require("../models/User");
const mailer_1 = require("../utils/mailer");
function generateTemporaryPassword(length = 10) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}
async function getAllUsersController(req, res) {
    try {
        const users = await (0, User_1.getAllUsers)();
        res.status(200).json({
            success: true,
            message: 'Utilisateurs récupérés avec succès',
            data: {
                users
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des utilisateurs'
        });
    }
}
async function createUserController(req, res) {
    try {
        const { username, email, role_id, url_photo } = req.body;
        const temporaryPassword = generateTemporaryPassword();
        // Validation des entrées
        if (!username || !email || !role_id) {
            return res.status(400).json({
                success: false,
                message: 'Le username, email et role_id sont requis'
            });
        }
        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'L\'email n\'est pas valide'
            });
        }
        // Validation du role_id
        const validRoles = [1, 2, 3, 4, 5]; // Directeur, Admin, ChefProjet, MembreEquipe, Lecteur
        if (!validRoles.includes(role_id)) {
            return res.status(400).json({
                success: false,
                message: 'Le rôle spécifié n\'est pas valide'
            });
        }
        // Vérifier si l'utilisateur existe déjà
        const existingUserByUsername = await (0, User_1.getUserByUsername)(username);
        if (existingUserByUsername) {
            return res.status(409).json({
                success: false,
                message: 'Ce nom d\'utilisateur est déjà utilisé'
            });
        }
        const existingUserByEmail = await (0, User_1.getUserByEmail)(email);
        if (existingUserByEmail) {
            return res.status(409).json({
                success: false,
                message: 'Cet email est déjà utilisé'
            });
        }
        // Créer l'utilisateur
        const newUser = await (0, User_1.createUser)({
            username,
            email,
            password: temporaryPassword,
            role_id,
            url_photo: url_photo || null
        });
        let emailSent = false;
        try {
            emailSent = await (0, mailer_1.sendWelcomePasswordEmail)({
                to: email,
                username,
                password: temporaryPassword
            });
        }
        catch (mailError) {
            console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', mailError);
        }
        res.status(201).json({
            success: true,
            message: emailSent
                ? 'Utilisateur créé avec succès et email envoyé'
                : 'Utilisateur créé avec succès (email non envoyé)',
            data: {
                user: newUser,
                emailSent
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création de l\'utilisateur'
        });
    }
}
async function updateUserController(req, res) {
    try {
        const { id } = req.params;
        const { username, email, password, role_id } = req.body;
        const authenticatedUserId = parseInt(req.user?.userId?.toString() || '0'); // ID de l'utilisateur authentifié
        if (typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'ID utilisateur invalide'
            });
        }
        const userId = parseInt(id);
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'ID utilisateur invalide'
            });
        }
        // Validation des entrées
        if (!username || !email || !role_id) {
            return res.status(400).json({
                success: false,
                message: 'Le username, email et role_id sont requis'
            });
        }
        // Validation du role_id
        const validRoles = [1, 2, 3, 4, 5];
        if (!validRoles.includes(role_id)) {
            return res.status(400).json({
                success: false,
                message: 'Le rôle spécifié n\'est pas valide'
            });
        }
        // Règle : Un utilisateur peut se modifier lui-même, mais seul l'admin principal (id: 1) 
        // peut être modifié par lui-même. Les autres ne peuvent pas modifier l'admin principal.
        if (userId === 1 && authenticatedUserId !== 1) {
            return res.status(403).json({
                success: false,
                message: 'Seul l\'administrateur principal peut modifier son propre compte'
            });
        }
        const { query } = require('../utils/database');
        // Construire la requête de mise à jour
        let updateQuery = 'UPDATE users SET username = $1, email = $2, role_id = $3';
        const queryParams = [username, email, role_id];
        // Ajouter le mot de passe seulement s'il est fourni
        if (password && password.length >= 6) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += ', password = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, username, email, role_id, updated_at';
            queryParams.push(hashedPassword, userId);
        }
        else {
            updateQuery += ', updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, username, email, role_id, updated_at';
            queryParams.push(userId);
        }
        const result = await query(updateQuery, queryParams);
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Utilisateur modifié avec succès',
            data: {
                user: result.rows[0]
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la modification de l\'utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la modification de l\'utilisateur'
        });
    }
}
async function deleteUserController(req, res) {
    try {
        const { id } = req.params;
        if (typeof id !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'ID utilisateur invalide'
            });
        }
        const userId = parseInt(id);
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'ID utilisateur invalide'
            });
        }
        // Empêcher la suppression de l'utilisateur admin principal (id: 1)
        if (userId === 1) {
            return res.status(403).json({
                success: false,
                message: 'Impossible de supprimer l\'administrateur principal'
            });
        }
        // Empêcher un utilisateur de supprimer son propre compte
        if (req.user && userId === req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Impossible de supprimer votre propre compte'
            });
        }
        // Supprimer l'utilisateur via une requête SQL directe
        const { query } = require('../utils/database');
        const result = await query('DELETE FROM users WHERE id = $1 RETURNING id, username', [userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Utilisateur supprimé avec succès',
            data: {
                deletedUser: result.rows[0]
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la suppression de l\'utilisateur'
        });
    }
}
async function getUserProfileController(req, res) {
    try {
        // L'utilisateur est déjà authentifié grâce au middleware
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non authentifié'
            });
        }
        // Récupérer l'utilisateur depuis la base de données
        const users = await (0, User_1.getAllUsers)();
        const user = users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }
        res.status(200).json({
            success: true,
            data: {
                user
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération du profil utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération du profil'
        });
    }
}
async function changePasswordController(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non authentifié'
            });
        }
        // Validation des entrées
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Le mot de passe actuel et le nouveau mot de passe sont requis'
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
            });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Le nouveau mot de passe doit être différent de l\'ancien'
            });
        }
        // Récupérer l'utilisateur avec son mot de passe
        const { query } = require('../utils/database');
        const result = await query('SELECT id, username, email, password, role_id FROM users WHERE id = $1', [userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }
        const user = result.rows[0];
        const bcrypt = require('bcryptjs');
        // Vérifier le mot de passe actuel
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Le mot de passe actuel est incorrect'
            });
        }
        // Hasher le nouveau mot de passe
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        // Mettre à jour le mot de passe
        const updateResult = await query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, email, updated_at', [hashedNewPassword, userId]);
        if (updateResult.rowCount === 0) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du mot de passe'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Mot de passe changé avec succès',
            data: {
                user: updateResult.rows[0]
            }
        });
    }
    catch (error) {
        console.error('Erreur lors du changement de mot de passe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors du changement de mot de passe'
        });
    }
}
//# sourceMappingURL=userController.js.map