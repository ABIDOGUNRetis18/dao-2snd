"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTaskProgress = updateTaskProgress;
const database_1 = require("../utils/database");
async function updateTaskProgress(req, res) {
    try {
        const { id } = req.params;
        const { progress, statut } = req.body;
        // Validation des entrées
        if (progress !== undefined && (progress < 0 || progress > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Le progress doit être entre 0 et 100'
            });
        }
        if (statut && !['a_faire', 'en_cours', 'termine'].includes(statut)) {
            return res.status(400).json({
                success: false,
                message: 'Le statut doit être a_faire, en_cours ou termine'
            });
        }
        // Construire la requête de mise à jour dynamique
        let updateQuery = 'UPDATE task SET';
        const queryParams = [];
        let paramIndex = 1;
        if (progress !== undefined) {
            updateQuery += ` progress = $${paramIndex}`;
            queryParams.push(progress);
            paramIndex++;
        }
        if (statut) {
            if (paramIndex > 1)
                updateQuery += ',';
            updateQuery += ` statut = $${paramIndex}`;
            queryParams.push(statut);
            paramIndex++;
        }
        updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
        queryParams.push(id);
        const result = await (0, database_1.query)(updateQuery, queryParams);
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tâche non trouvée'
            });
        }
        console.log('✅ Progression mise à jour avec succès:', result.rows[0]);
        res.status(200).json({
            success: true,
            message: 'Progression de la tâche mise à jour avec succès',
            data: {
                task: result.rows[0]
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la mise à jour de la progression:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la mise à jour de la progression',
            error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
    }
}
//# sourceMappingURL=taskProgressController.js.map