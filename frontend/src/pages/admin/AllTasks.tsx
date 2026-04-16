import { useEffect, useState } from 'react'
import { Search, ArrowLeft, Calendar, User, FileText, Filter, Clock, AlertTriangle, CheckCircle, TrendingUp, BarChart3, Eye, Edit } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

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

export default function AllTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('tous')
  const [assignedFilter, setAssignedFilter] = useState('tous')
  const [priorityFilter, setPriorityFilter] = useState('tous')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskDetails, setShowTaskDetails] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadAllTasks()
    loadCurrentUser()
    loadAvailableUsers()
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

  const loadAvailableUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3001/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const usersData = await res.json()
        setAvailableUsers(usersData.users || [])
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
    }
  }

  const loadAllTasks = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` }

      // Charger toutes les tâches de tous les DAOs (admin seulement)
      const res = await fetch('http://localhost:3001/api/tasks', { headers })
      
      if (res.ok) {
        const d = await res.json()
        if (d.success) {
          const tasksData = d.data.tasks || []
          setTasks(tasksData)
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
      default: return 'Non définie'
    }
  }

  const isOverdue = (dueDate: string | null, status: string | null) => {
    if (!dueDate || status === 'termine') return false
    return new Date(dueDate) < new Date()
  }

  // Filtrage des tâches
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = search === '' || 
      task.nom.toLowerCase().includes(search.toLowerCase()) ||
      task.dao_numero.toLowerCase().includes(search.toLowerCase()) ||
      task.dao_objet.toLowerCase().includes(search.toLowerCase()) ||
      (task.assigned_username && task.assigned_username.toLowerCase().includes(search.toLowerCase()))
    
    const matchesStatus = statusFilter === 'tous' || task.statut === statusFilter
    const matchesAssigned = assignedFilter === 'tous' || 
      (assignedFilter === 'assigned' && task.assigned_to !== null) ||
      (assignedFilter === 'unassigned' && task.assigned_to === null)
    const matchesPriority = priorityFilter === 'tous' || task.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesAssigned && matchesPriority
  })

  // Statistiques
  const getStats = () => {
    const total = tasks.length
    const assigned = tasks.filter(t => t.assigned_to !== null).length
    const unassigned = tasks.filter(t => t.assigned_to === null).length
    const completed = tasks.filter(t => t.statut === 'termine').length
    const inProgress = tasks.filter(t => t.statut === 'en_cours').length
    const overdue = tasks.filter(t => isOverdue(t.due_date, t.statut)).length
    
    return { total, assigned, unassigned, completed, inProgress, overdue }
  }

  // Gérer la sélection d'une tâche
  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task)
    setShowTaskDetails(true)
  }

  // Naviguer vers les détails du DAO
  const navigateToDaoTasks = (task: Task) => {
    navigate(`/admin/dao/${task.dao_id}/tasks`)
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="p-3 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 mb-1">Toutes les Tâches</h1>
              <p className="text-slate-500 text-sm">
                {filteredTasks.length} tâche{filteredTasks.length > 1 ? 's' : ''} trouvée{filteredTasks.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <div className="text-sm text-slate-600">
                  Vue admin: <span className="font-semibold">{user.username}</span>
                </div>
                <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Admin
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-xl font-bold text-slate-800">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-xs text-slate-500">Assignées</p>
                <p className="text-xl font-bold text-blue-600">{stats.assigned}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-xs text-slate-500">Non assignées</p>
                <p className="text-xl font-bold text-orange-600">{stats.unassigned}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-xs text-slate-500">Terminées</p>
                <p className="text-xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-xs text-slate-500">En cours</p>
                <p className="text-xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-xs text-slate-500">En retard</p>
                <p className="text-xl font-bold text-red-600">{stats.overdue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg p-4 border border-slate-200 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Rechercher une tâche, DAO, ou assigné..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              >
                <option value="tous">Tous les statuts</option>
                <option value="a_faire">À faire</option>
                <option value="en_attente">En attente</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
              </select>
              
              <select
                value={assignedFilter}
                onChange={(e) => setAssignedFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              >
                <option value="tous">Toutes</option>
                <option value="assigned">Assignées</option>
                <option value="unassigned">Non assignées</option>
              </select>
              
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              >
                <option value="tous">Toutes les priorités</option>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
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

        {/* Liste des tâches */}
        {!loading && (
          <div className="space-y-4">
            {filteredTasks.map((task: Task) => (
              <div
                key={task.id}
                className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleTaskSelect(task)}
              >
                {/* En-tête */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-800 mb-2">
                      {task.nom}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      {isOverdue(task.due_date, task.statut) && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          En retard
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(task.statut)}`}>
                      {task.statut === 'a_faire' ? 'À faire' : 
                       task.statut === 'en_attente' ? 'En attente' :
                       task.statut === 'en_cours' ? 'En cours' : 
                       task.statut === 'termine' ? 'Terminé' : 'Non défini'}
                    </span>
                    <span className="text-xs font-medium text-slate-600">
                      {(task.progress || 0)}% complété
                    </span>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="mb-4">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="h-full rounded-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${task.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Informations DAO et assignation */}
                <div className="bg-slate-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{task.dao_numero}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      task.dao_statut === 'TERMINEE' 
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : task.dao_statut === 'A_RISQUE'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {task.dao_statut === 'TERMINEE' ? 'Terminée' : 
                       task.dao_statut === 'A_RISQUE' ? 'À risque' : 
                       'En cours'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{task.dao_objet}</p>
                </div>

                {/* Informations détaillées */}
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Créée le {new Date(task.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {task.due_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className={`font-medium ${isOverdue(task.due_date, task.statut) ? 'text-red-600' : 'text-slate-700'}`}>
                          Échéance {new Date(task.due_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                    {task.assigned_username && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span className="font-medium text-slate-700">
                          Assigné à {task.assigned_username}
                        </span>
                      </div>
                    )}
                    {task.chef_projet_nom && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span className="font-medium text-slate-600">
                          Chef: {task.chef_projet_nom}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigateToDaoTasks(task)
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      Voir DAO
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Aucune tâche trouvée */}
        {!loading && filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Aucune tâche trouvée.
            </h3>
            <p className="text-slate-500">
              {search || statusFilter !== 'tous' || assignedFilter !== 'tous' || priorityFilter !== 'tous' 
                ? 'Aucune tâche ne correspond à vos filtres.' 
                : 'Aucune tâche dans le système.'}
            </p>
          </div>
        )}

        {/* Modal détails tâche */}
        {showTaskDetails && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-800">Détails de la tâche</h2>
                  <button
                    onClick={() => setShowTaskDetails(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-700 mb-2">{selectedTask.nom}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">ID:</span>
                        <span className="ml-2 font-medium">{selectedTask.id}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Statut:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTask.statut)}`}>
                          {selectedTask.statut || 'Non défini'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Progression:</span>
                        <span className="ml-2 font-medium">{selectedTask.progress || 0}%</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Priorité:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTask.priority)}`}>
                          {getPriorityLabel(selectedTask.priority)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Informations DAO</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-600">DAO:</span>
                        <span className="font-medium">{selectedTask.dao_numero}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Objet:</span>
                        <span className="font-medium">{selectedTask.dao_objet}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Chef de projet:</span>
                        <span className="font-medium">{selectedTask.chef_projet_nom || 'Non assigné'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      onClick={() => navigateToDaoTasks(selectedTask)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Voir les tâches du DAO
                    </button>
                    <button
                      onClick={() => setShowTaskDetails(false)}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
