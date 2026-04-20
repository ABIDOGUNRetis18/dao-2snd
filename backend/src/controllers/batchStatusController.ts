import { Request, Response } from "express";
import { query } from "../utils/database";
import { checkAndUpdateDaoStatus } from "./daoController";

// Contrôleur pour mettre à jour en masse tous les DAO avec 100% de progression
export async function updateAllCompletedDaos(req: Request, res: Response) {
  try {
    console.log(`\n=== MISE À JOUR MASSIVE DES DAO TERMINÉS ===\n`);
    
    // 1. Récupérer tous les DAOs qui ne sont pas encore "TERMINEE"
    const allDaosResult = await query(`
      SELECT id, numero, objet, statut
      FROM daos 
      WHERE statut != 'TERMINEE'
      ORDER BY id ASC
    `);
    
    console.log(`1. ${allDaosResult.rows.length} DAOs à vérifier`);
    
    const updatedDaos = [];
    const skippedDaos = [];
    
    // 2. Pour chaque DAO, vérifier s'il doit être "TERMINEE"
    for (const dao of allDaosResult.rows) {
      console.log(`\n--- Vérification DAO ${dao.id}: ${dao.numero} ---`);
      
      // Récupérer les tâches du DAO
      const tasksResult = await query(`
        SELECT id, progress, statut
        FROM tasks 
        WHERE dao_id = $1
      `, [dao.id]);
      
      if (tasksResult.rows.length === 0) {
        console.log(`   -> Aucune tâche, statut inchangé`);
        skippedDaos.push({
          id: dao.id,
          numero: dao.numero,
          reason: "Aucune tâche"
        });
        continue;
      }
      
      // Calculer la progression
      const totalProgress = tasksResult.rows.reduce((sum: number, task: any) => 
        sum + (task.progress || 0), 0);
      const avgProgress = Math.round(totalProgress / tasksResult.rows.length);
      
      const completedTasks = tasksResult.rows.filter((task: any) => 
        (task.progress || 0) === 100);
      
      console.log(`   -> Tâches: ${tasksResult.rows.length}, Terminées: ${completedTasks.length}, Progression: ${avgProgress}%`);
      
      // Vérifier si le DAO doit être "TERMINEE"
      if (completedTasks.length === tasksResult.rows.length && avgProgress === 100) {
        // Mettre à jour le statut
        await query(
          "UPDATE daos SET statut = 'TERMINEE' WHERE id = $1",
          [dao.id]
        );
        
        console.log(`   -> ???? Statut mis à jour: "${dao.statut}" -> "TERMINEE"`);
        
        updatedDaos.push({
          id: dao.id,
          numero: dao.numero,
          objet: dao.objet,
          oldStatus: dao.statut,
          newStatus: "TERMINEE",
          tasksCount: tasksResult.rows.length,
          completedTasks: completedTasks.length,
          avgProgress: avgProgress
        });
      } else {
        console.log(`   -> Statut inchangé: "${dao.statut}"`);
        skippedDaos.push({
          id: dao.id,
          numero: dao.numero,
          reason: `Progression ${avgProgress}% (${completedTasks.length}/${tasksResult.rows.length} tâches terminées)`
        });
      }
    }
    
    console.log(`\n=== RÉSULTAT ===`);
    console.log(`DAOs mis à jour: ${updatedDaos.length}`);
    console.log(`DAOs ignorés: ${skippedDaos.length}`);
    
    console.log(`\n??? DAOs mis à jour vers "TERMINEE":`);
    updatedDaos.forEach(dao => {
      console.log(`   - ${dao.numero}: ${dao.objet} (${dao.completedTasks}/${dao.tasksCount} tâches à 100%)`);
    });
    
    console.log(`\n--- DAOs ignorés ---`);
    skippedDaos.forEach(dao => {
      console.log(`   - ${dao.numero}: ${dao.reason}`);
    });
    
    console.log(`========================\n`);
    
    res.status(200).json({
      success: true,
      message: "Mise à jour massive terminée",
      data: {
        updated: updatedDaos,
        skipped: skippedDaos,
        summary: {
          totalChecked: allDaosResult.rows.length,
          updatedCount: updatedDaos.length,
          skippedCount: skippedDaos.length
        }
      }
    });
    
  } catch (error) {
    console.error("Erreur lors de la mise à jour massive:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour massive"
    });
  }
}

// Fonction pour vérifier l'état de tous les DAOs
export async function getAllDaosStatus(req: Request, res: Response) {
  try {
    const result = await query(`
      SELECT 
        d.id,
        d.numero,
        d.objet,
        d.statut,
        COUNT(t.id) as tasks_count,
        COUNT(CASE WHEN t.progress = 100 THEN 1 END) as completed_tasks,
        COALESCE(SUM(t.progress), 0) as total_progress,
        CASE 
          WHEN COUNT(t.id) = 0 THEN 'Aucune tâche'
          WHEN COUNT(CASE WHEN t.progress = 100 THEN 1 END) = COUNT(t.id) 
               AND ROUND(COALESCE(SUM(t.progress), 0) / NULLIF(COUNT(t.id), 0)) = 100
          THEN 'DEVRAIT ÊTRE TERMINEE'
          ELSE 'OK'
        END as should_be_terminated
      FROM daos d
      LEFT JOIN tasks t ON d.id = t.dao_id
      GROUP BY d.id, d.numero, d.objet, d.statut
      ORDER BY d.id ASC
    `);
    
    res.status(200).json({
      success: true,
      data: {
        daos: result.rows
      }
    });
    
  } catch (error) {
    console.error("Erreur lors de la vérification des statuts:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification des statuts"
    });
  }
}
