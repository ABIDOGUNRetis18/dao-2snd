"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextDaoNumber = getNextDaoNumber;
exports.getDaoTypes = getDaoTypes;
exports.createDao = createDao;
const database_1 = require("../utils/database");
async function getNextDaoNumber(req, res) {
    try {
        // Récupérer le dernier numéro de DAO
        const result = await (0, database_1.query)('SELECT reference FROM daos ORDER BY id DESC LIMIT 1');
        let nextNumber = 'DAO-2026-001'; // Valeur par défaut
        if (result.rows.length > 0) {
            const lastRef = result.rows[0].reference;
            // Extraire le numéro de la référence (ex: "DAO-2026-001" -> "001")
            const match = lastRef.match(/DAO-2026-(\d+)/);
            if (match) {
                const lastNum = parseInt(match[1]);
                const nextNum = (lastNum + 1).toString().padStart(3, '0');
                nextNumber = `DAO-2026-${nextNum}`;
            }
        }
        res.status(200).json({
            success: true,
            data: {
                nextNumber
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération du numéro DAO:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération du numéro DAO'
        });
    }
}
async function getDaoTypes(req, res) {
    try {
        const result = await (0, database_1.query)('SELECT * FROM dao_types ORDER BY name');
        res.status(200).json({
            success: true,
            data: {
                types: result.rows
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération des types de DAO:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des types de DAO'
        });
    }
}
async function createDao(req, res) {
    try {
        const { reference, title, description, type_id, authority, project_manager_id, groupment, status, publication_date, submission_deadline, budget } = req.body;
        // Validation des champs requis
        if (!reference || !title || !type_id || !authority || !project_manager_id) {
            return res.status(400).json({
                success: false,
                message: 'Les champs reference, title, type_id, authority et project_manager_id sont requis'
            });
        }
        // Insérer le DAO
        const result = await (0, database_1.query)(`INSERT INTO daos (
        reference, title, description, type_id, authority, 
        project_manager_id, groupment, status, publication_date, 
        submission_deadline, budget, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`, [
            reference, title, description, type_id, authority,
            project_manager_id, groupment, status || 'En préparation',
            publication_date, submission_deadline, budget
        ]);
        res.status(201).json({
            success: true,
            message: 'DAO créé avec succès',
            data: {
                dao: result.rows[0]
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la création du DAO:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création du DAO'
        });
    }
}
//# sourceMappingURL=daoController.js.map