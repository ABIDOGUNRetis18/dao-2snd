import { useEffect, useState } from 'react'
import { Search, ArrowLeft, Calendar, User, FileText, Clock, AlertTriangle, CheckCircle, TrendingUp, BarChart3 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

interface Task {
  id: number
  id_task: number
  nom: string
  dao_id: number
  dao_numero: string
  dao_objet: string
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

export default function MembreEquipeMyTasks() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  useEffect(() => {
    loadMyTasks()
  }, [])

  const loadMyTasks = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      // Récupérer les informations de l'utilisateur connecté
      const userResponse = await fetch('http://localhost:3001/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData.data.user)
      }

      // Récupérer toutes les tâches assignées à cet utilisateur
      const tasksResponse = await fetch('http://localhost:3001/api/tasks/my-tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        if (tasksData.success) {
          setTasks(tasksData.data.tasks || [])
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ statut: newStatus })
      })

      if (response.ok) {
        // Mettre à jour la tâche localement
        setTasks(tasks.map(task => 
          task.id === taskId 
            ? { ...task, statut: newStatus, progress: newStatus === 'termine' ? 100 : newStatus === 'en_cours' ? 50 : 0 }
            : task
        ))
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
    }
  }

  const updateTaskProgress = async (taskId: number, progress: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/tasks/${taskId}/progress`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ progress })
      })

      if (response.ok) {
        // Mettre à jour la tâche localement
        setTasks(tasks.map(task => 
          task.id === taskId 
            ? { ...task, progress, statut: progress === 100 ? 'termine' : progress > 0 ? 'en_cours' : 'a_faire' }
            : task
        ))
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la progression:', error)
    }
  }

  // Filtrer les tâches
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.dao_objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.dao_numero.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || task.statut === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  // Statistiques
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.statut === 'termine').length,
    inProgress: tasks.filter(t => t.statut === 'en_cours').length,
    todo: tasks.filter(t => t.statut === 'a_faire').length,
    overdue: tasks.filter(t => {
      if (!t.due_date || t.statut === 'termine') return false
      return new Date(t.due_date) < new Date()
    }).length
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'termine': return 'text-green-600 bg-green-100'
      case 'en_cours': return 'text-blue-600 bg-blue-100'
      case 'a_faire': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Chargement de vos tâches...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/membre/dashboard"
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Mes Tâches</h1>
              <p className="text-slate-500 text-sm">
                {user ? `Bienvenue ${user.username}` : 'Chargement...'}
              </p>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-slate-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">À faire</p>
                <p className="text-2xl font-bold text-gray-600">{stats.todo}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">En cours</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Terminées</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">En retard</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher une tâche..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <select
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="a_faire">À faire</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
            </select>

            <select
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">Toutes les priorités</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>
          </div>
        </div>

        {/* Liste des tâches */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
              <div className="text-slate-500">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                  ? 'Aucune tâche ne correspond à vos filtres.' 
                  : 'Aucune tâche assignée pour le moment.'}
              </div>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div key={task.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{task.nom}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        DAO {task.dao_numero}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {task.chef_projet_nom}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-3">{task.dao_objet}</p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.statut)}`}>
                        {task.statut === 'termine' ? 'Terminé' : 
                         task.statut === 'en_cours' ? 'En cours' : 
                         task.statut === 'a_faire' ? 'À faire' : 'Non défini'}
                      </span>
                      {task.priority && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority === 'high' ? 'Haute' : 
                           task.priority === 'medium' ? 'Moyenne' : 
                           task.priority === 'low' ? 'Basse' : task.priority}
                        </span>
                      )}
                      {task.due_date && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          new Date(task.due_date) < new Date() && task.statut !== 'termine'
                            ? 'text-red-600 bg-red-100'
                            : 'text-slate-600 bg-slate-100'
                        }`}>
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(task.due_date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">Progression</span>
                    <span className="text-slate-800 font-medium">{task.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        (task.progress || 0) === 100 ? 'bg-green-500' :
                        (task.progress || 0) > 0 ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${task.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <select
                    className="px-3 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={task.statut || 'a_faire'}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  >
                    <option value="a_faire">À faire</option>
                    <option value="en_cours">En cours</option>
                    <option value="termine">Terminé</option>
                  </select>
                  
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={task.progress || 0}
                    onChange={(e) => updateTaskProgress(task.id, parseInt(e.target.value))}
                    className="flex-1"
                  />
                  
                  <span className="text-sm text-slate-600 w-12 text-right">{task.progress || 0}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
