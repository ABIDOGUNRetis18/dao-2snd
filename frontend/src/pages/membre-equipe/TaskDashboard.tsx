import { useState, useEffect } from 'react'
import { Search, Filter, MessageSquare, Calendar, Clock, AlertCircle } from 'lucide-react'

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

export default function TaskDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [taskProgress, setTaskProgress] = useState<{[key: number]: number}>({})
  const [comments, setComments] = useState<{[key: number]: Comment[]}>({})
  const [commentingTask, setCommentingTask] = useState<number | null>(null)
  const [commentText, setCommentText] = useState('')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

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

  const filteredTasks = tasks.filter(
    (task: Task) =>
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.dao_reference && task.dao_reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.dao_objet && task.dao_objet.toLowerCase().includes(searchTerm.toLowerCase())) ||
      task.id.toString().includes(searchTerm.toLowerCase())
  ).filter(
    (task: Task) =>
      (statusFilter === '' || task.statut === statusFilter) &&
      (priorityFilter === '' || task.priorite === priorityFilter)
  )

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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800">Mes Tâches</h1>
            <div className="text-sm text-slate-600">
              {tasks.length} tâche{tasks.length > 1 ? 's' : ''} assignée{tasks.length > 1 ? 's' : ''}
            </div>
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
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20">
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
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Liste des tâches */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task: Task) => {
            const statutBadge = getStatutBadge(task.statut)
            const priorityBadge = getPriorityBadge(task.priorite)
            const progress = taskProgress[task.id] || 0
            const taskComments = comments[task.id] || []

            return (
              <div key={task.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* En-tête tâche */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-1">
                        Tâche n°{task.id_task}
                      </h3>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div>DAO-{task.dao_id} {task.dao_reference && `(${task.dao_reference})`}</div>
                        {task.dao_objet && (
                          <div className="truncate max-w-[200px]" title={task.dao_objet}>
                            {task.dao_objet}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityBadge.cls}`}>
                        {priorityBadge.label}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statutBadge.cls}`}>
                        {statutBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Progression */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-700">Progression</span>
                      <span className="font-medium text-slate-700">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions progression */}
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => updateProgress(task.id, Math.max(0, progress - 10))}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                    >
                      -10%
                    </button>
                    <button
                      onClick={() => updateProgress(task.id, Math.min(100, progress + 10))}
                      className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors"
                    >
                      +10%
                    </button>
                    <button
                      onClick={() => updateProgress(task.id, 100)}
                      className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors"
                    >
                      100%
                    </button>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    {task.date_creation && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Création: {new Date(task.date_creation).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                    {task.date_echeance && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Échéance: {new Date(task.date_echeance).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                  </div>

                  {/* Commentaires */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MessageSquare className="h-4 w-4" />
                        <span>{taskComments.length} commentaire{taskComments.length > 1 ? 's' : ''}</span>
                      </div>
                      <button
                        onClick={() => setCommentingTask(task.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                      >
                        <MessageSquare className="h-4 w-4 inline mr-1" />
                        Commenter
                      </button>
                    </div>

                    {/* Liste des commentaires */}
                    {taskComments.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {taskComments.slice(0, 2).map((comment: Comment) => (
                          <div key={comment.id} className="bg-slate-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-slate-700">
                                {comment.username || 'Utilisateur'}
                              </span>
                              <span className="text-xs text-slate-500">
                                {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">{comment.content}</p>
                          </div>
                        ))}
                        {taskComments.length > 2 && (
                          <div className="text-xs text-slate-500 text-center">
                            +{taskComments.length - 2} autre{taskComments.length - 2 > 1 ? 's' : ''} commentaire{taskComments.length - 2 > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Formulaire de commentaire */}
                    {commentingTask === task.id && (
                      <div className="space-y-2">
                        <textarea
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          placeholder="Ajouter un commentaire..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 resize-none"
                          rows={3}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={addComment}
                            disabled={!commentText.trim()}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                          >
                            Envoyer
                          </button>
                          <button
                            onClick={() => {
                              setCommentingTask(null)
                              setCommentText('')
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Message si aucune tâche */}
        {filteredTasks.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-12 text-center">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {searchTerm || statusFilter || priorityFilter ? 'Aucune tâche ne correspond à votre recherche' : 'Aucune tâche assignée'}
            </h3>
            <p className="text-sm text-slate-600">
              {searchTerm || statusFilter || priorityFilter ? 'Essayez de modifier vos filtres' : 'Les tâches vous seront assignées par votre chef de projet'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
