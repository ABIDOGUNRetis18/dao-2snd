import { useState, useEffect } from 'react'
import { Search, MessageSquare, User, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { computeStatusFromProgress } from '../../utils/daoStatusUtils'

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

export default function MembreEquipe() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [daoGroups, setDaoGroups] = useState<DAOGroup[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [expandedDAOs, setExpandedDAOs] = useState<number[]>([])

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setCurrentUser(parsedUser)
      
      const fetchTasks = async () => {
        try {
          const token = localStorage.getItem('token')
          const response = await fetch('http://localhost:3001/api/my-tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              const tasksData = result.data.tasks || []
              setTasks(tasksData)
              const groupedDAOs = groupTasksByDAO(tasksData)
              setDaoGroups(groupedDAOs)
            }
          }
        } catch (error) {
          console.error('Erreur chargement tâches:', error)
        } finally {
          setLoading(false)
        }
      }
      
      fetchTasks()
    }
  }, [])

  
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

  // Calcul des statistiques globales
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => task.progress !== null && task.progress === 100).length
  const inProgressTasks = tasks.filter(task => task.progress !== null && task.progress > 0 && task.progress < 100).length
  const pendingTasks = tasks.filter(task => task.progress !== null && task.progress === 0).length

  const filteredDAOs = daoGroups.filter(dao => {
    const q = searchTerm.toLowerCase()
    return (
      dao.dao_objet.toLowerCase().includes(q) ||
      dao.dao_numero.toLowerCase().includes(q)
    )
  })

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

  const toggleDAOExpansion = (daoId: number) => {
    setExpandedDAOs(prev => 
      prev.includes(daoId) 
        ? prev.filter(id => id !== daoId)
        : [...prev, daoId]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Membre d'Équipe</h1>
            <p className="text-gray-600">Bienvenue sur votre espace de travail</p>
          </div>
          {currentUser && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser.username}</p>
                <p className="text-xs text-gray-500">Membre d'équipe</p>
              </div>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Tâches totales</p>
                <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Terminées</p>
                <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">En cours</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressTasks}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">En attente</p>
                <p className="text-2xl font-bold text-orange-600">{pendingTasks}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recherche */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un DAO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Chargement de vos tâches...</p>
          </div>
        )}

        {/* Liste des DAOs - Style Mes Tâches */}
        {!loading && filteredDAOs.length > 0 && (
          <div className="space-y-3">
            {filteredDAOs.map((dao: DAOGroup) => (
              <div
                key={dao.dao_id}
                className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 task-card cursor-pointer hover:bg-slate-50 transition-colors"
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
                          <div className="mb-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-1 rounded-full transition-all duration-300 ${(task.progress || 0) === 0 ? 'bg-gray-400' : (task.progress || 0) === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                  style={{ width: `${task.progress || 0}%` }}
                                />
                              </div>
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

        {/* État vide */}
        {!loading && filteredDAOs.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <MessageSquare className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Aucun DAO trouvé' : 'Aucune tâche assignée'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `Aucun DAO ne correspond à "${searchTerm}"`
                : "Vous n'avez aucune tâche assignée pour le moment."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
