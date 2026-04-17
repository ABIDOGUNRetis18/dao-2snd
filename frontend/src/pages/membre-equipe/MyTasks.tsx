import { useEffect, useState } from 'react'
import { ArrowLeft, User, Clock } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { computeStatusFromProgress } from '../../utils/daoStatusUtils'
import '../admin/MyTasks.css'

interface Task {
  id: number
  id_task: number
  nom: string
  dao_id: number
  dao_numero: string
  dao_objet: string
  dao_statut: string | null
  statut: string | null
  progress: number | null
  priority: 'low' | 'medium' | 'high' | null
  due_date: string | null
  assigned_to: number | null
  assigned_username: string | null
  assigned_email: string | null
  chef_projet_nom: string | null
  created_at: string
  updated_at: string
}

interface User {
  id: number
  username: string
  email: string
  role_id: number
}

interface DAOGroup {
  dao_id: number
  dao_numero: string
  dao_objet: string
  dao_statut: string | null
  tasks: Task[]
  totalTasks: number
  completedTasks: number
  averageProgress: number
}

export default function MembreEquipeMyTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [daoGroups, setDaoGroups] = useState<DAOGroup[]>([])
  const [expandedDAOs, setExpandedDAOs] = useState<number[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [progressTimeout, setProgressTimeout] = useState<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadMyTasks()
    loadCurrentUser()
    // loadNotifications() // Désactivé - non utile pour cette section
    
    // Nettoyage du timeout lors du démontage
    return () => {
      if (progressTimeout) {
        clearTimeout(progressTimeout)
      }
    }
  }, [])

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3001/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const userData = await res.json()
        setUser(userData.user)
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error)
    }
  }

  const groupTasksByDAO = (tasks: Task[]): DAOGroup[] => {
    const daoMap = new Map<number, DAOGroup>()
    
    tasks.forEach(task => {
      if (!daoMap.has(task.dao_id)) {
        daoMap.set(task.dao_id, {
          dao_id: task.dao_id,
          dao_numero: task.dao_numero,
          dao_objet: task.dao_objet,
          dao_statut: task.dao_statut,
          tasks: [],
          totalTasks: 0,
          completedTasks: 0,
          averageProgress: 0
        })
      }
      
      const daoGroup = daoMap.get(task.dao_id)!
      daoGroup.tasks.push(task)
    })
    
    // Calculer les statistiques pour chaque DAO
    daoMap.forEach(daoGroup => {
      daoGroup.totalTasks = daoGroup.tasks.length
      daoGroup.completedTasks = daoGroup.tasks.filter(t => t.statut === 'termine').length
      const totalProgress = daoGroup.tasks.reduce((sum, task) => sum + (task.progress || 0), 0)
      daoGroup.averageProgress = Math.round(totalProgress / daoGroup.totalTasks)
      
      // Déterminer automatiquement le statut du DAO en fonction des tâches
      const allTasksCompleted = daoGroup.completedTasks === daoGroup.totalTasks && daoGroup.totalTasks > 0
      const hasTaskInProgress = daoGroup.tasks.some(t => t.statut === 'en_cours')
      const hasTaskNotStarted = daoGroup.tasks.some(t => t.statut === 'a_faire')
      
      if (allTasksCompleted) {
        // Toutes les tâches sont terminées
        daoGroup.dao_statut = 'TERMINEE'
      } else if (hasTaskInProgress || hasTaskNotStarted) {
        // Au moins une tâche est en cours ou à faire
        daoGroup.dao_statut = 'EN_COURS'
      } else {
        // Sinon, on garde le statut original
        // Pas de changement par défaut pour éviter les conflits
      }
      
      console.log(`🔍 DAO ${daoGroup.dao_id}: ${daoGroup.completedTasks}/${daoGroup.totalTasks} terminées -> statut: ${daoGroup.dao_statut}`)
    })
    
    return Array.from(daoMap.values())
  }

  const loadMyTasks = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` }

      const res = await fetch('http://localhost:3001/api/my-tasks', { headers })
      
      if (res.ok) {
        const d = await res.json()
        if (d.success) {
          const tasksData = d.data.tasks || []
          setTasks(tasksData)
          const groupedDAOs = groupTasksByDAO(tasksData)
          setDaoGroups(groupedDAOs)
        }
      } else {
        console.error('Erreur lors du chargement des tâches')
      }
    } catch (error) {
      console.error('Erreur réseau:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    switch (status) {
      case 'a_faire': return 'bg-gray-100 text-gray-800'
      case 'en_attente': return 'bg-yellow-100 text-yellow-800'
      case 'en_cours': return 'bg-blue-100 text-blue-800'
      case 'termine': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityLabel = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'Haute'
      case 'medium': return 'Moyenne'
      case 'low': return 'Basse'
      default: return ''
    }
  }

  const isOverdue = (dueDate: string | null, status: string | null) => {
    if (!dueDate || status === 'termine') return false
    return new Date(dueDate) < new Date()
  }

  const updateTaskProgress = async (taskId: number, progress: number, statut: string) => {
    try {
      // S'assurer que le statut correspond bien à la progression
      const autoStatut = progress === 0 ? 'a_faire' : progress === 100 ? 'termine' : 'en_cours'
      const finalStatut = statut || autoStatut
      
      // Temporairement sans authentification pour contourner le problème de token
      const res = await fetch(`http://localhost:3001/api/task-progress/${taskId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress, statut: finalStatut }),
      })
      
      if (res.ok) {
        const responseData = await res.json()
        console.log('✅ Progression mise à jour:', responseData.data.task)
        
        // Mettre à jour la tâche dans le state local
        setTasks(prev => {
          const updatedTasks = prev.map(task => 
            task.id === taskId 
              ? { ...task, progress, statut: finalStatut }
              : task
          )
          
          // Mettre à jour les groupes DAO après modification
          const groupedDAOs = groupTasksByDAO(updatedTasks)
          setDaoGroups(groupedDAOs)
          
          return updatedTasks
        })
      } else {
        const errorData = await res.json()
        console.error('❌ Erreur lors de la mise à jour:', errorData)
        alert('Erreur lors de la mise à jour: ' + (errorData.message || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error)
      alert('Erreur réseau: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    }
  }

  const handleTaskClick = (task: Task) => {
    // Naviguer vers la page des tâches du DAO spécifique
    navigate(`/membre-equipe/dao/${task.dao_id}/tasks`)
  }

  const toggleDAOExpansion = (daoId: number) => {
    setExpandedDAOs(prev => 
      prev.includes(daoId) 
        ? prev.filter(id => id !== daoId)
        : [...prev, daoId]
    )
  }

  const updateProgressContinuous = async (taskId: number, progress: number) => {
    // Déterminer le statut automatiquement selon la progression
    let statut: string
    if (progress === 0) {
      statut = 'a_faire'
    } else if (progress === 100) {
      statut = 'termine'
    } else {
      statut = 'en_cours'
    }
    
    console.log(`🔄 Mise à jour tâche ${taskId}: ${progress}% -> ${statut}`)
    
    // Mise à jour locale immédiate pour une réponse instantanée
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { ...task, progress, statut }
        : task
    )
    
    console.log('📋 Tâches mises à jour:', updatedTasks.map(t => ({id: t.id, nom: t.nom, progress: t.progress, statut: t.statut})))
    
    setTasks(updatedTasks)
    
    // Forcer la mise à jour des groupes DAO après modification
    const groupedDAOs = groupTasksByDAO(updatedTasks)
    console.log('🗂️ Groupes DAO mis à jour:', groupedDAOs.map(d => ({id: d.dao_id, statut: d.dao_statut, completedTasks: d.completedTasks, totalTasks: d.totalTasks})))
    
    // Forcer la mise à jour du state avec un petit délai pour assurer la réactivité
    setTimeout(() => {
      setDaoGroups([...groupedDAOs])
      console.log('🔄 DAO groups state updated with force refresh')
    }, 10)
    
    // Mise à jour en arrière-plan avec debounce
    if (progressTimeout) {
      clearTimeout(progressTimeout)
    }
    
    const newTimeout = setTimeout(async () => {
      try {
        await updateTaskProgress(taskId, progress, statut)
        console.log(`✅ Tâche ${taskId} mise à jour: ${progress}% -> ${statut}`)
        
        // Forcer une deuxième mise à jour après la réponse API
        const currentTasks = tasks.map(t => 
          t.id === taskId ? { ...t, progress, statut } : t
        )
        const finalGroupedDAOs = groupTasksByDAO(currentTasks)
        setDaoGroups([...finalGroupedDAOs])
        console.log('🔄 Final DAO update after API response')
      } catch (error) {
        console.error('❌ Erreur lors de la mise à jour de la tâche:', error)
        // En cas d'erreur, on pourrait restaurer l'état précédent si nécessaire
      }
    }, 300) as unknown as number
    
    setProgressTimeout(newTimeout)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 animate-fadeInUp">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/membre-equipe"
              className="p-3 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 mb-1">Mes Tâches</h1>
              <p className="text-slate-500 text-sm">
                {daoGroups.length} DAO{daoGroups.length > 1 ? 's' : ''} trouvé{daoGroups.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <div className="text-sm text-slate-600">
                  Bienvenue, <span className="font-semibold">{user.username}</span>
                </div>
                <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Membre Équipe
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-300 border-t-transparent"></div>
            <p className="mt-4 text-slate-600 font-medium">Chargement des tâches...</p>
          </div>
        )}

        {/* Liste des DAOs */}
        {!loading && daoGroups.length > 0 && (
          <div className="space-y-3">
            {daoGroups.map((dao: DAOGroup) => (
              <div
                key={dao.dao_id}
                className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 task-card"
                onClick={() => toggleDAOExpansion(dao.dao_id)}
              >
                {/* En-tête DAO */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-800 mb-1 task-title">
                      {dao.dao_numero} - {dao.dao_objet}
                    </h3>
                    <div className="flex items-center gap-2 mb-1">
                      {
                        (() => {
                          const statusInfo = computeStatusFromProgress(dao.averageProgress, dao.dao_statut);
                          return (
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusInfo.className}`}>
                              {statusInfo.label}
                            </span>
                          );
                        })()
                      }
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        {dao.totalTasks} tâche{dao.totalTasks > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <span className="text-xs font-medium text-slate-600">
                      {dao.completedTasks}/{dao.totalTasks} terminée{dao.completedTasks > 1 ? 's' : ''}
                    </span>
                    <span className="text-xs font-medium text-slate-600">
                      {dao.averageProgress}% moyen
                    </span>
                  </div>
                </div>

                {/* Barre de progression globale du DAO */}
                <div className="mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-600 w-20">Progression:</span>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${dao.averageProgress}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-12 text-right">
                      {dao.averageProgress}%
                    </span>
                  </div>
                </div>

                {/* Icône d'expansion */}
                <div className="flex items-center justify-center">
                  <svg 
                    className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${expandedDAOs.includes(dao.dao_id) ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Section des tâches détaillées (expandable) */}
                {expandedDAOs.includes(dao.dao_id) && (
                  <div className="mt-4 pt-4 border-t border-slate-200" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-2">
                      {dao.tasks.map((task: Task) => (
                        <div key={task.id} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm text-slate-800 mb-1">
                                {task.nom}
                              </h4>
                              <div className="flex items-center gap-1 mb-1">
                                <span className={`px-1 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                                  {getPriorityLabel(task.priority)}
                                </span>
                                <span className={`px-1 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.statut)}`}>
                                  {task.statut === 'a_faire' ? 'À faire' : task.statut === 'en_cours' ? 'En cours' : task.statut === 'termine' ? 'Terminé' : 'En attente'}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-medium text-slate-600">
                              {(task.progress || 0)}%
                            </span>
                          </div>
                          
                          {/* Barre de progression de la tâche */}
                          <div className="mb-2 no-navigate">
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={task.progress || 0}
                                onChange={(e) => updateProgressContinuous(task.id, parseInt(e.target.value))}
                                className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer slider align-middle"
                                style={{
                                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(task.progress || 0)}%, #e2e8f0 ${(task.progress || 0)}%, #e2e8f0 100%)`
                                }}
                              />
                              <span className="text-xs font-medium text-slate-700 w-8 text-right">
                                {task.progress || 0}%
                              </span>
                            </div>
                          </div>

                          {/* Informations supplémentaires */}
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                              {task.due_date && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span className={isOverdue(task.due_date, task.statut) ? 'text-red-600' : 'text-slate-700'}>
                                    {new Date(task.due_date).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              )}
                              {task.assigned_username && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{task.assigned_username}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Aucune tâche trouvée */}
        {!loading && daoGroups.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Aucune tâche assignée.
            </h3>
            <p className="text-slate-500">
              Vous n'avez pas de tâches assignées pour le moment.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
