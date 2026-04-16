import { query } from './database';

// Vérifie si l'utilisateur est le chef de projet du DAO
export async function isDaoChef(daoId: number, userId: number): Promise<boolean> {
  try {
    const result = await query(
      'SELECT chef_id FROM daos WHERE id = $1',
      [daoId]
    );
    
    if (result.rows.length === 0) {
      return false;
    }
    
    return result.rows[0].chef_id === userId;
  } catch (error) {
    console.error('Erreur lors de la vérification du chef de projet:', error);
    return false;
  }
}

// Vérifie si l'utilisateur est assigné à la tâche
export async function isTaskAssigned(taskId: number, userId: number): Promise<boolean> {
  try {
    const result = await query(
      'SELECT assigned_to FROM task WHERE id = $1',
      [taskId]
    );
    
    if (result.rows.length === 0) {
      return false;
    }
    
    return result.rows[0].assigned_to === userId;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'assignation de tâche:', error);
    return false;
  }
}

// Vérifie si l'utilisateur peut assigner des membres aux tâches d'un DAO
export async function canAssignTasks(daoId: number, userId: number): Promise<boolean> {
  // Admin peut assigner des tâches sur tous les DAOs
  const isAdmin = await isUserAdmin(userId);
  if (isAdmin) return true;
  
  // Chef de projet peut assigner seulement sur ses DAOs
  return await isDaoChef(daoId, userId);
}

// Vérifie si l'utilisateur est un administrateur
export async function isUserAdmin(userId: number): Promise<boolean> {
  try {
    const result = await query(
      'SELECT role_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return false;
    }
    
    return result.rows[0].role_id === 2; // role_id = 2 pour admin
  } catch (error) {
    console.error('Erreur lors de la vérification du rôle admin:', error);
    return false;
  }
}

// Vérifie si l'utilisateur peut modifier une tâche
export async function canUpdateTask(taskId: number, userId: number): Promise<boolean> {
  return await isTaskAssigned(taskId, userId);
}

// Récupère l'ID du DAO à partir de l'ID de la tâche
export async function getDaoIdFromTask(taskId: number): Promise<number | null> {
  try {
    const result = await query(
      'SELECT dao_id FROM task WHERE id = $1',
      [taskId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0].dao_id;
  } catch (error) {
    console.error('Erreur lors de la récupération du DAO ID:', error);
    return null;
  }
}
