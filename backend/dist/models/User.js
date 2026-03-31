"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByUsername = getUserByUsername;
exports.getUserByEmail = getUserByEmail;
exports.getUserWithPassword = getUserWithPassword;
exports.updateUserLastLogin = updateUserLastLogin;
exports.getAllUsers = getAllUsers;
exports.createUser = createUser;
const database_1 = require("../utils/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function getUserByUsername(username) {
    try {
        const result = await (0, database_1.query)('SELECT id, username, email, url_photo, role_id, created_at, updated_at FROM users WHERE username = $1', [username]);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur par username:', error);
        return null;
    }
}
async function getUserByEmail(email) {
    try {
        const result = await (0, database_1.query)('SELECT id, username, email, url_photo, role_id, created_at, updated_at FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur par email:', error);
        return null;
    }
}
async function getUserWithPassword(username) {
    try {
        const result = await (0, database_1.query)('SELECT * FROM users WHERE username = $1', [username]);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur avec mot de passe:', error);
        return null;
    }
}
async function updateUserLastLogin(userId) {
    try {
        await (0, database_1.query)('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [userId]);
    }
    catch (error) {
        console.error('Erreur lors de la mise à jour de la dernière connexion:', error);
        throw error;
    }
}
async function getAllUsers() {
    try {
        const result = await (0, database_1.query)('SELECT id, username, email, url_photo, role_id, created_at, updated_at FROM users ORDER BY created_at DESC');
        return result.rows;
    }
    catch (error) {
        console.error('Erreur lors de la récupération de tous les utilisateurs:', error);
        return [];
    }
}
async function createUser(userData) {
    try {
        const hashedPassword = await bcryptjs_1.default.hash(userData.password, 10);
        const result = await (0, database_1.query)(`
      INSERT INTO users (username, email, password, role_id, url_photo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, url_photo, role_id, created_at, updated_at
    `, [
            userData.username,
            userData.email,
            hashedPassword,
            userData.role_id,
            userData.url_photo || null
        ]);
        if (result.rows.length === 0) {
            throw new Error('Erreur lors de la création de l\'utilisateur');
        }
        return result.rows[0];
    }
    catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        throw error;
    }
}
//# sourceMappingURL=User.js.map