"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyTasks = getMyTasks;
const database_1 = require("../utils/database");
async function getMyTasks(req, res) {
    try {
        const userId = req.user.userId; // ID de l'utilisateur connecté
        // Récupérer les tâches assignées à l'utilisateur connecté depuis la table task
        const result = await (0, database_1.query)(`
      SELECT 
        t.id,
        t.nom as titre,
        t.dao_id,
        t.progress,
        t.statut,
        t.assigned_to,
        u.username as assigned_username,
        u.email as assigned_email,
        d.numero as dao_numero,
        d.objet as dao_objet,
        d.chef_projet_nom as chef_projet_nom,
        CURRENT_TIMESTAMP as created_at,
        CURRENT_TIMESTAMP as updated_at
      FROM task t
      JOIN daos d ON t.dao_id = d.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to = $1
      ORDER BY t.id DESC
    `, [userId]);
        // Formatter les données
        const tasks = result.rows.map((task) => ({
            id: task.id,
            id_task: task.id,
            nom: task.titre,
            dao_id: task.dao_id,
            dao_numero: task.dao_numero,
            dao_objet: task.dao_objet,
            progress: task.progress || 0,
            statut: task.statut,
            priority: 'moyenne', // Valeur par défaut car la table task n'a pas de priorité
            due_date: null, // Valeur par défaut car la table task n'a pas de date d'échéance
            assigned_to: task.assigned_to,
            assigned_username: task.assigned_username,
            assigned_email: task.assigned_email,
            chef_projet_nom: task.chef_projet_nom,
            created_at: task.created_at,
            updated_at: task.updated_at
        }));
        res.status(200).json({
            success: true,
            data: {
                tasks
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la récupération des tâches de l\'utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des tâches'
        });
    }
}
//# sourceMappingURL=myTasksController.js.map