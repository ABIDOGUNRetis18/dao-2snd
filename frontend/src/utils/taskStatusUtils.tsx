// Utilitaires pour la gestion automatique du statut des tâches et DAOs

interface Task {
  id: number
  progress?: number
  statut?: string
  dao_id?: number
  nom?: string
  id_task?: number
}

interface DAOGroup {
  dao_id: number
  dao_statut: string | null
  tasks: Task[]
  totalTasks: number
  completedTasks: number
  averageProgress: number
}

/**
 * Détermine le statut automatique d'une tâche selon sa progression
 */
export const getTaskStatusFromProgress = (progress: number): string => {
  if (progress === 0) return 'a_faire'
  if (progress === 100) return 'termine'
  return 'en_cours'
}

/**
 * Met à jour le statut d'une tâche et force la mise à jour des groupes DAO
 */
export const updateTaskProgressWithStatus = (
  tasks: any[],
  taskId: number,
  progress: number,
  setTasks: React.Dispatch<React.SetStateAction<any[]>>,
  setDaoGroups: React.Dispatch<React.SetStateAction<DAOGroup[]>>,
  groupTasksByDAO: (tasks: any[]) => DAOGroup[]
) => {
  // Déterminer le statut automatique
  const statut = getTaskStatusFromProgress(progress)
  
  console.log(`🔄 Mise à jour tâche ${taskId}: ${progress}% -> ${statut}`)
  
  // Mise à jour locale immédiate
  const updatedTasks = tasks.map(task => 
    task.id === taskId 
      ? { ...task, progress, statut }
      : task
  )
  
  console.log('📋 Tâches mises à jour:', updatedTasks.map(t => ({id: t.id, nom: (t as any).nom || '', progress: t.progress, statut: t.statut})))
  
  setTasks(updatedTasks)
  
  // Forcer la mise à jour des groupes DAO
  const groupedDAOs = groupTasksByDAO(updatedTasks)
  console.log('🗂️ Groupes DAO mis à jour:', groupedDAOs.map(d => ({id: d.dao_id, statut: d.dao_statut, completedTasks: d.completedTasks, totalTasks: d.totalTasks})))
  
  // Forcer la mise à jour du state avec un petit délai
  setTimeout(() => {
    setDaoGroups([...groupedDAOs])
    console.log('🔄 DAO groups state updated with force refresh')
  }, 10)
  
  return { updatedTasks, statut }
}

/**
 * Calcule les statistiques d'un groupe de tâches et détermine le statut du DAO
 */
export const calculateDAOStats = (daoGroup: DAOGroup) => {
  daoGroup.totalTasks = daoGroup.tasks.length
  daoGroup.completedTasks = daoGroup.tasks.filter(t => t.statut === 'termine').length
  const totalProgress = daoGroup.tasks.reduce((sum, task) => sum + (task.progress || 0), 0)
  daoGroup.averageProgress = Math.round(totalProgress / daoGroup.totalTasks)
  
  // Déterminer automatiquement le statut du DAO
  const allTasksCompleted = daoGroup.completedTasks === daoGroup.totalTasks && daoGroup.totalTasks > 0
  const hasTaskInProgress = daoGroup.tasks.some(t => t.statut === 'en_cours')
  const hasTaskNotStarted = daoGroup.tasks.some(t => t.statut === 'a_faire')
  
  if (allTasksCompleted) {
    daoGroup.dao_statut = 'TERMINEE'
  } else if (hasTaskInProgress || hasTaskNotStarted) {
    daoGroup.dao_statut = 'EN_COURS'
  }
  // Sinon, on garde le statut original (pas de changement par défaut)
  
  console.log(`🔍 DAO ${daoGroup.dao_id}: ${daoGroup.completedTasks}/${daoGroup.totalTasks} terminées -> statut: ${daoGroup.dao_statut}`)
  
  return daoGroup
}
