import { Request, Response } from "express";
import { query } from "../utils/database";
import { checkAndUpdateDaoStatus } from "./daoController";

// Contrôleur de test pour valider le flux complet de synchronisation du statut
export async function testStatusSync(req: Request, res: Response) {
  try {
    const { daoId } = req.params;
    
    console.log(`\n=== TEST DE SYNCHRONISATION DU STATUT DAO ${daoId} ===\n`);
    
    // 1. État initial du DAO
    const daoBefore = await query("SELECT statut FROM daos WHERE id = $1", [daoId]);
    console.log(`1. Statut initial du DAO: ${daoBefore.rows[0]?.statut || 'Non trouvé'}`);
    
    // 2. État des tâches
    const tasksBefore = await query(`
      SELECT id, titre, progress, statut 
      FROM tasks 
      WHERE dao_id = $1 
      ORDER BY id
    `, [daoId]);
    
    console.log(`2. Tâches du DAO (${tasksBefore.rows.length} total):`);
    tasksBefore.rows.forEach((task: any, index: number) => {
      console.log(`   ${index + 1}. ${task.titre}: ${task.progress}% - ${task.statut}`);
    });
    
    // 3. Calcul de la progression
    const totalProgress = tasksBefore.rows.reduce((sum: number, task: any) => 
      sum + (task.progress || 0), 0);
    const avgProgress = tasksBefore.rows.length > 0 ? 
      Math.round(totalProgress / tasksBefore.rows.length) : 0;
    
    const completedTasks = tasksBefore.rows.filter((task: any) => 
      (task.progress || 0) === 100);
    
    console.log(`3. Progression calculée:`);
    console.log(`   - Progression moyenne: ${avgProgress}%`);
    console.log(`   - Tâches terminées: ${completedTasks.length}/${tasksBefore.rows.length}`);
    
    // 4. Détermination du statut attendu
    let expectedStatus: string;
    if (completedTasks.length === tasksBefore.rows.length && avgProgress === 100) {
      expectedStatus = 'TERMINEE';
    } else if (avgProgress > 0) {
      expectedStatus = 'EN_COURS';
    } else {
      expectedStatus = 'A_RISQUE';
    }
    
    console.log(`4. Statut attendu selon la logique: ${expectedStatus}`);
    
    // 5. Exécution de la fonction de mise à jour
    console.log(`5. Exécution de checkAndUpdateDaoStatus()...`);
    await checkAndUpdateDaoStatus(Number(daoId));
    
    // 6. État final du DAO
    const daoAfter = await query("SELECT statut FROM daos WHERE id = $1", [daoId]);
    console.log(`6. Statut final du DAO: ${daoAfter.rows[0]?.statut || 'Non trouvé'}`);
    
    // 7. Validation
    const isCorrect = daoAfter.rows[0]?.statut === expectedStatus;
    console.log(`\n=== RÉSULTAT DU TEST ===`);
    console.log(`Statut attendu: ${expectedStatus}`);
    console.log(`Statut obtenu: ${daoAfter.rows[0]?.statut}`);
    console.log(`Test ${isCorrect ? 'RÉUSSI' : 'ÉCHOUÉ'} ${isCorrect ? '????' : '????'}`);
    
    if (isCorrect) {
      console.log(`\n??? Le statut du DAO ${daoId} est correctement synchronisé !`);
    } else {
      console.log(`\n???? Le statut du DAO ${daoId} n'est pas correctement synchronisé !`);
    }
    
    console.log(`========================\n`);
    
    res.status(200).json({
      success: true,
      message: `Test de synchronisation terminé`,
      data: {
        daoId,
        before: daoBefore.rows[0]?.statut,
        after: daoAfter.rows[0]?.statut,
        expected: expectedStatus,
        isCorrect,
        tasksCount: tasksBefore.rows.length,
        avgProgress,
        completedTasks: completedTasks.length
      }
    });
    
  } catch (error) {
    console.error("Erreur lors du test de synchronisation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du test de synchronisation"
    });
  }
}

// Test de simulation de mise à jour de progression
export async function simulateProgressUpdate(req: Request, res: Response) {
  try {
    const { daoId, taskId, newProgress } = req.body;
    
    console.log(`\n=== SIMULATION DE MISE À JOUR DE PROGRESSION ===`);
    console.log(`DAO: ${daoId}, Tâche: ${taskId}, Nouvelle progression: ${newProgress}%`);
    
    // 1. État avant
    const before = await query(`
      SELECT d.statut as dao_statut, t.progress as old_progress 
      FROM daos d, tasks t 
      WHERE d.id = $1 AND t.id = $2
    `, [daoId, taskId]);
    
    console.log(`1. État avant:`);
    console.log(`   - Statut DAO: ${before.rows[0]?.dao_statut}`);
    console.log(`   - Progression tâche: ${before.rows[0]?.old_progress}%`);
    
    // 2. Simulation de la mise à jour
    const taskResult = await query(`
      UPDATE tasks 
      SET progress = $1, statut = CASE WHEN $1 = 100 THEN 'termine' WHEN $1 > 0 THEN 'en_cours' ELSE 'a_faire' END, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND dao_id = $3
      RETURNING *
    `, [newProgress, taskId, daoId]);
    
    if (taskResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Tâche non trouvée ou n'appartient pas au DAO"
      });
    }
    
    console.log(`2. Tâche mise à jour: ${newProgress}%`);
    
    // 3. Déclenchement automatique du statut DAO
    await checkAndUpdateDaoStatus(Number(daoId));
    
    // 4. État après
    const after = await query(`
      SELECT d.statut as dao_statut, t.progress as new_progress 
      FROM daos d, tasks t 
      WHERE d.id = $1 AND t.id = $2
    `, [daoId, taskId]);
    
    console.log(`3. État après:`);
    console.log(`   - Statut DAO: ${after.rows[0]?.dao_statut}`);
    console.log(`   - Progression tâche: ${after.rows[0]?.new_progress}%`);
    
    console.log(`=== FIN DE SIMULATION ===\n`);
    
    res.status(200).json({
      success: true,
      message: "Simulation terminée",
      data: {
        before: before.rows[0],
        after: after.rows[0],
        task: taskResult.rows[0]
      }
    });
    
  } catch (error) {
    console.error("Erreur lors de la simulation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la simulation"
    });
  }
}
