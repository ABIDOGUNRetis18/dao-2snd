"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyTasks = getMyTasks;
const database_1 = require("../utils/database");
async function getMyTasks(req, res) {
    try {
        const userId = req.user.userId; // ID de l'utilisateur connecté
        // Récupérer les tâches assignées à l'utilisateur connecté depuis les deux sources
        // 1. Depuis la table task (modèles de tâches)
        const taskResult = await (0, database_1.query)(`
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
        t.created_at,
        t.updated_at
      FROM task t
      JOIN daos d ON t.dao_id = d.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to = $1
    `, [userId]);
        // 2. Depuis la table tasks (assignations via task-assignment)
        let tasksResult = { rows: [] };
        try {
            tasksResult = await (0, database_1.query)(`
        SELECT 
          ts.id_task as id,
          COALESCE(tm.nom, ts.titre) as titre,
          ts.dao_id,
          ts.progress,
          ts.statut,
          ts.assigned_to,
          u.username as assigned_username,
          u.email as assigned_email,
          d.numero as dao_numero,
          d.objet as dao_objet,
          d.chef_projet_nom as chef_projet_nom,
          ts.created_at,
          ts.updated_at
        FROM tasks ts
        LEFT JOIN task tm ON ts.id_task = tm.id
        JOIN daos d ON ts.dao_id = d.id
        LEFT JOIN users u ON ts.assigned_to = u.id
        WHERE ts.assigned_to = $1
      `, [userId]);
        }
        catch (error) {
            console.log('Table tasks non trouvée ou erreur, utilisation uniquement de task:', error);
            // Si la table tasks n'existe pas, continuer avec seulement la table task
        }
        // Combiner les résultats et dédupliquer
        const allTasks = [...taskResult.rows, ...tasksResult.rows];
        // Supprimer les doublons (basé sur l'ID de la tâche)
        const uniqueTasks = allTasks.filter((task, index, self) => index === self.findIndex((t) => t.id === task.id));
        // Trier par date de création décroissante
        uniqueTasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        // Formatter les données
        const tasks = uniqueTasks.map((task) => ({
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