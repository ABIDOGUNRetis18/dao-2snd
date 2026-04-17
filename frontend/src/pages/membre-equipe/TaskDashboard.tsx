import { useState, useEffect } from 'react'
import { Search, Filter, MessageSquare, Clock, AlertCircle, User, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { computeStatusFromProgress } from '../../utils/daoStatusUtils'
import '../admin/MyTasks.css'

interface Task {
  id: number
  id_task: number
  dao_id: number
  titre: string
  description?: string
  statut: 'a_faire' | 'en_cours' | 'termine'
  progress: number
  date_creation?: string
  date_echeance?: string
  priorite: 'basse' | 'moyenne' | 'haute'
  assigned_to: number
  dao_reference?: string
  dao_objet?: string
  dao_numero?: string
  dao_chef_nom?: string
  assigned_username?: string
  assigned_email?: string
  created_at?: string
  updated_at?: string
}

interface Comment {
  id: number
  task_id: number
  user_id: number
  content: string
  mentioned_user_id?: number
  is_public: boolean
  created_at: string
  username?: string
}

interface DAOGroup {
  dao_id: number
  dao_reference?: string
  dao_objet?: string
  dao_numero?: string
  dao_chef_nom?: string
  tasks: Task[]
  totalTasks: number
  completedTasks: number
  averageProgress: number
}

export default function TaskDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [daoFilter, setDaoFilter] = useState('')
  const [taskProgress, setTaskProgress] = useState<{[key: number]: number}>({})
  const [setComments] = useState<{[key: number]: Comment[]}>({})
  const [commentingTask, setCommentingTask] = useState<number | null>(null)
  const [commentText, setCommentText] = useState('')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [expandedDAOs, setExpandedDAOs] = useState<number[]>([])
  const [openDiscussionDAO, setOpenDiscussionDAO] = useState<number | null>(null)

  useEffect(() => {
    loadUser()
    loadTasks()
  }, [])

  const loadUser = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser))
    }
  }

  const loadTasks = async () => {
    try {
      const storedUser = localStorage.getItem('user')
      if (!storedUser) {
        console.error('Aucun utilisateur trouvé dans localStorage')
        return
      }
      const parsedUser = JSON.parse(storedUser)
      const userId = parsedUser.id

      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/member-tasks?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const taskList = result.data.tasks || []
          setTasks(taskList)
          
          // Initialiser la progression
          const initialProgress: {[key: number]: number} = {}
          taskList.forEach((task: Task) => {
            initialProgress[task.id] = task.progress || 0
          })
          setTaskProgress(initialProgress)

          // Charger les commentaires pour chaque tâche
          taskList.forEach((task: Task) => {
            loadComments(task.id)
          })
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async (taskId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/messages?task_id=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setComments(prev => ({
            ...prev,
            [taskId]: result.data || []
          }))
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commentaires:', error)
    }
  }

  const updateProgress = async (taskId: number, value: number) => {
    const newValue = Math.min(100, Math.max(0, value))
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/task-progress/${taskId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ progress: newValue }),
      })
      
      if (response.ok) {
        setTaskProgress(prev => ({
          ...prev,
          [taskId]: newValue
        }))
        
        // Mettre à jour la tâche dans la liste
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, progress: newValue } : task
        ))
      } else {
        const errorData = await response.json()
        console.error('Erreur mise à jour progression:', errorData.message)
      }
    } catch (error) {
      console.error('Erreur mise à jour progression:', error)
    }
  }

  const addComment = async () => {
    if (!commentingTask || !commentText.trim()) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          task_id: commentingTask,
          user_id: currentUser.id,
          content: commentText.trim(),
          is_public: true
        }),
      })
      
      if (response.ok) {
        await loadComments(commentingTask)
        setCommentText('')
        setCommentingTask(null)
      }
    } catch (error) {
      console.error('Erreur ajout commentaire:', error)
    }
  }

  // Grouper les tâches par DAO
  const groupTasksByDAO = (tasks: Task[]): DAOGroup[] => {
    const daoMap = new Map<number, DAOGroup>()
    
    tasks.forEach(task => {
      if (!daoMap.has(task.dao_id)) {
        daoMap.set(task.dao_id, {
          dao_id: task.dao_id,
          dao_reference: task.dao_reference,
          dao_objet: task.dao_objet,
          dao_numero: task.dao_numero,
          dao_chef_nom: task.dao_chef_nom,
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
    })
    
    return Array.from(daoMap.values()).sort((a, b) => a.dao_id - b.dao_id)
  }

  // Extraire la liste des DAO uniques
  const getUniqueDAOs = () => {
    const daoMap = new Map<number, { id: number; reference: string; objet: string }>()
    tasks.forEach(task => {
      if (!daoMap.has(task.dao_id)) {
        daoMap.set(task.dao_id, {
          id: task.dao_id,
          reference: task.dao_reference || `DAO-${task.dao_id}`,
          objet: task.dao_objet || ''
        })
      }
    })
    return Array.from(daoMap.values()).sort((a, b) => a.id - b.id)
  }

  const filteredTasks = tasks.filter(
    (task: Task) =>
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.dao_reference && task.dao_reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.dao_objet && task.dao_objet.toLowerCase().includes(searchTerm.toLowerCase())) ||
      task.id.toString().includes(searchTerm.toLowerCase())
  ).filter(
    (task: Task) =>
      (statusFilter === '' || task.statut === statusFilter) &&
      (priorityFilter === '' || task.priorite === priorityFilter) &&
      (daoFilter === '' || task.dao_id.toString() === daoFilter)
  )

  const filteredDAOGroups = groupTasksByDAO(filteredTasks)

  const toggleDAOExpansion = (daoId: number) => {
    setExpandedDAOs(prev => 
      prev.includes(daoId) 
        ? prev.filter(id => id !== daoId)
        : [...prev, daoId]
    )
  }

  const toggleDiscussion = (daoId: number) => {
    setOpenDiscussionDAO(prev => 
      prev === daoId ? null : daoId
    )
  }

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'a_faire': return { label: 'À faire', cls: 'bg-gray-100 text-gray-700' }
      case 'en_cours': return { label: 'En cours', cls: 'bg-blue-100 text-blue-700' }
      case 'termine': return { label: 'Terminé', cls: 'bg-green-100 text-green-700' }
      default: return { label: statut, cls: 'bg-gray-100 text-gray-700' }
    }
  }

  const getPriorityBadge = (priorite: string) => {
    switch (priorite) {
      case 'basse': return { label: 'Basse', cls: 'bg-gray-50 text-gray-600 border border-gray-200' }
      case 'moyenne': return { label: 'Moyenne', cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' }
      case 'haute': return { label: 'Haute', cls: 'bg-red-50 text-red-700 border border-red-200' }
      default: return { label: priorite, cls: 'bg-gray-50 text-gray-600 border border-gray-200' }
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'basse': return 'bg-green-100 text-green-800 border-green-200'
      case 'moyenne': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'haute': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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

  const isOverdue = (dueDate: string | null, status: string | null) => {
    if (!dueDate || status === 'termine') return false
    return new Date(dueDate) < new Date()
  }

  const getProgressColor = (progress: number) => {
    if (progress < 33) return 'bg-red-500'
    if (progress < 66) return 'bg-amber-500'
    return 'bg-green-500'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement de vos tâches...</p>
        </div>
      </div>
    )
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
                {filteredDAOGroups.length} DAO{filteredDAOGroups.length > 1 ? 's' : ''} trouvé{filteredDAOGroups.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {currentUser && (
              <div className="flex items-center gap-2">
                <div className="text-sm text-slate-600">
                  Bienvenue, <span className="font-semibold">{currentUser.username}</span>
                </div>
                <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Membre Équipe
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher (description, DAO, n° tâche...)"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(v => !v)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filtrer
              </button>
              {showFilterMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20 transform transition-all duration-200 ease-in-out origin-top-right">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtres</span>
                      <button
                        onClick={() => setShowFilterMenu(false)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Statut
                    </div>
                    {['', 'a_faire', 'en_cours', 'termine'].map(s => (
                      <button
                        key={s}
                        onClick={() => { setStatusFilter(s); setShowFilterMenu(false) }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 ${
                          statusFilter === s ? 'text-blue-600 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        {s === '' ? 'Tous les statuts' : getStatutBadge(s).label}
                      </button>
                    ))}
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
                      Priorité
                    </div>
                    {['', 'basse', 'moyenne', 'haute'].map(p => (
                      <button
                        key={p}
                        onClick={() => { setPriorityFilter(p); setShowFilterMenu(false) }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 ${
                          priorityFilter === p ? 'text-blue-600 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        {p === '' ? 'Toutes les priorités' : getPriorityBadge(p).label}
                      </button>
                    ))}
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
                      DAO
                    </div>
                    {['', ...getUniqueDAOs().map(dao => dao.id.toString())].map(daoId => (
                      <button
                        key={daoId}
                        onClick={() => { setDaoFilter(daoId); setShowFilterMenu(false) }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 ${
                          daoFilter === daoId ? 'text-blue-600 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        {daoId === '' ? 'Toutes les DAOs' : (() => {
                          const dao = getUniqueDAOs().find(d => d.id.toString() === daoId)
                          return dao ? `${dao.reference} ${dao.objet ? `- ${dao.objet}` : ''}` : `DAO-${daoId}`
                        })()}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
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
        {!loading && filteredDAOGroups.length > 0 && (
          <div className="space-y-3">
            {filteredDAOGroups.map((dao: DAOGroup) => (
              <div
                key={dao.dao_id}
                className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 task-card"
                onClick={() => toggleDAOExpansion(dao.dao_id)}
              >
                {/* En-tête DAO */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-800 mb-1 task-title">
                      {dao.dao_numero || `DAO-${dao.dao_id}`} - {dao.dao_objet || 'Sans objet'}
                    </h3>
                    <div className="flex items-center gap-2 mb-1">
                      {
                        (() => {
                          const statusInfo = computeStatusFromProgress(dao.averageProgress, null);
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
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleDiscussion(dao.dao_id); }}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Commentaires</span>
                      </button>
                    </div>
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
                      {dao.tasks.map((task: Task) => {
                        const statutBadge = getStatutBadge(task.statut)
                        const priorityBadge = getPriorityBadge(task.priorite)
                        const progress = taskProgress[task.id] || 0

                        return (
                          <div key={task.id} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm text-slate-800 mb-1">
                                  {task.titre}
                                </h4>
                                <div className="flex items-center gap-1 mb-1">
                                  <span className={`px-1 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priorite)}`}>
                                    {priorityBadge.label}
                                  </span>
                                  <span className={`px-1 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.statut)}`}>
                                    {statutBadge.label}
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs font-medium text-slate-600">
                                {progress}%
                              </span>
                            </div>
                            
                            {/* Barre de progression de la tâche */}
                            <div className="mb-2 no-navigate">
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={progress}
                                  onChange={(e) => updateProgress(task.id, parseInt(e.target.value))}
                                  className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer slider align-middle"
                                  style={{
                                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #e2e8f0 ${progress}%, #e2e8f0 100%)`
                                  }}
                                />
                                <span className="text-xs font-medium text-slate-700 w-8 text-right">
                                  {progress}%
                                </span>
                              </div>
                            </div>

                            {/* Informations supplémentaires */}
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <div className="flex items-center gap-2">
                                {task.date_echeance && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{new Date(task.date_echeance).toLocaleDateString('fr-FR')}</span>
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
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bulle de discussion */}
        {openDiscussionDAO && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setOpenDiscussionDAO(null)}>
            <div 
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Discussion - DAO {filteredDAOGroups.find(d => d.dao_id === openDiscussionDAO)?.dao_numero || `DAO-${openDiscussionDAO}`}
                </h3>
                <button 
                  onClick={() => setOpenDiscussionDAO(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Écrivez votre commentaire ici..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setOpenDiscussionDAO(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => {
                    // Logique d'envoi du commentaire ici
                    console.log('Commentaire envoyé:', commentText)
                    setCommentText('')
                    setOpenDiscussionDAO(null)
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message si aucune tâche */}
        {filteredDAOGroups.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-12 text-center">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {searchTerm || statusFilter || priorityFilter || daoFilter ? 'Aucune tâche ne correspond à votre recherche' : 'Aucune tâche assignée'}
            </h3>
            <p className="text-sm text-slate-600">
              {searchTerm || statusFilter || priorityFilter || daoFilter ? 'Essayez de modifier vos filtres' : 'Les tâches vous seront assignées par votre chef de projet'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
