import { Request, Response } from 'express';
import { query } from '../utils/database';

export async function updateTaskProgress(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { progress, statut, forceOverride } = req.body;

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

    // Récupérer la tâche actuelle pour vérifier le DAO
    const taskResult = await query(
      'SELECT id, dao_id, progress FROM tasks WHERE id = $1',
      [id]
    );

    if (taskResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    const currentTask = taskResult.rows[0];
    const daoId = currentTask.dao_id;

    // RÈGLE DE BLOCAGE SÉQUENTIELLE
    // Vérifier si c'est la première tâche du DAO
    const firstTaskResult = await query(
      'SELECT id, progress FROM tasks WHERE dao_id = $1 ORDER BY id ASC LIMIT 1',
      [daoId]
    );

    const firstTask = firstTaskResult.rows[0];

    // BLOCAGE si ce n'est PAS la première tâche ET première tâche < 100%
    if (firstTask && firstTask.id !== parseInt(id as string) && firstTask.progress < 100 && !forceOverride) {
      return res.status(403).json({
        success: false,
        message: "La première tâche du DAO doit être terminée (100%) avant de pouvoir modifier les autres tâches.",
        firstTaskId: firstTask.id,
        firstTaskProgress: firstTask.progress
      });
    }

    // Construire la requête de mise à jour dynamique
    let updateQuery = 'UPDATE tasks SET';
    const queryParams = [];
    let paramIndex = 1;

    if (progress !== undefined) {
      updateQuery += ` progress = $${paramIndex}`;
      queryParams.push(progress);
      paramIndex++;
    }

    if (statut) {
      if (paramIndex > 1) updateQuery += ',';
      updateQuery += ` statut = $${paramIndex}`;
      queryParams.push(statut);
      paramIndex++;
    }

    updateQuery += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;
    queryParams.push(id);

    const result = await query(updateQuery, queryParams);

    console.log('Progression mise à jour avec succès:', result.rows[0]);

    // 2. Calculer automatiquement le statut du DAO
    await updateDaoStatus(daoId);

    res.status(200).json({
      success: true,
      message: 'Progression de la tâche mise à jour avec succès',
      data: {
        task: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour de la progression',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}

// Fonction pour calculer et mettre à jour le statut du DAO
async function updateDaoStatus(daoId: number) {
  try {
    // 1. Récupérer toutes les tâches du DAO
    const allTasksResult = await query(
      'SELECT id, progress FROM tasks WHERE dao_id = $1',
      [daoId]
    );

    const allTasks = allTasksResult.rows;

    if (allTasks.length === 0) {
      console.log('Aucune tâche trouvée pour le DAO', daoId);
      return;
    }

    // 2. Calculer progression moyenne
    const totalProgress = allTasks.reduce((sum: number, task: any) => sum + (task.progress || 0), 0);
    const averageProgress = Math.round(totalProgress / allTasks.length);

    // 3. Compter tâches complétées
    const completedTasks = allTasks.filter((task: any) => (task.progress || 0) === 100);

    // 4. Déterminer nouveau statut
    let newStatut;
    if (completedTasks.length === allTasks.length && averageProgress === 100) {
      newStatut = 'TERMINE';
    } else if (averageProgress > 0) {
      newStatut = 'EN_COURS';
    } else {
      newStatut = 'A_RISQUE';
    }

    // 5. Mettre à jour si changement
    const currentDaoResult = await query(
      'SELECT statut FROM daos WHERE id = $1',
      [daoId]
    );

    const currentStatut = currentDaoResult.rows[0]?.statut;

    if (currentStatut !== newStatut) {
      await query(
        'UPDATE daos SET statut = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newStatut, daoId]
      );
      console.log(`Statut du DAO ${daoId} mis à jour: ${currentStatut} -> ${newStatut} (progression: ${averageProgress}%)`);
    }

    console.log(`DAO ${daoId}: progression=${averageProgress}%, statut=${newStatut}, tâches complétées=${completedTasks.length}/${allTasks.length}`);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut du DAO:', error);
  }
}
