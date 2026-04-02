import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, AlertTriangle, Calendar, User, Filter } from 'lucide-react'

interface Task {
  id: number
  titre: string
  statut: 'a_faire' | 'en_cours' | 'termine'
  priorite: 'basse' | 'moyenne' | 'haute'
  date_echeance?: string
  progress?: number
  dao_numero: string
  dao_objet: string
  chef_projet_nom: string
  assigned_username?: string
  assigned_email?: string
}

interface Stats {
  total: number
  completed: number
  in_progress: number
  not_started: number
  overdue: number
}

export default function MembreEquipe() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    in_progress: 0,
    not_started: 0,
    overdue: 0
  })
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'overdue'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('http://localhost:3001/api/my-tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTasks(data.data.tasks || [])
          calculateStats(data.data.tasks || [])
        }
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (tasks: Task[]) => {
    const today = new Date()
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const summary = {
      total: tasks.length,
      completed: tasks.filter(t => t.statut === 'termine').length,
      in_progress: tasks.filter(t => t.statut === 'en_cours').length,
      not_started: tasks.filter(t => t.statut === 'a_faire').length,
      overdue: tasks.filter(t => {
        if (!t.date_echeance || t.statut === 'termine') return false
        return new Date(t.date_echeance) < today
      }).length
    }
    
    setStats(summary)
  }

  const getFilteredTasks = () => {
    const today = new Date()
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    switch (filter) {
      case 'today':
        return tasks.filter(t => {
          const taskDate = new Date(t.date_echeance || today)
          return taskDate.toDateString() === today.toDateString()
        })
      case 'week':
        return tasks.filter(t => {
          const taskDate = new Date(t.date_echeance || today)
          return taskDate <= weekFromNow
        })
      case 'overdue':
        return tasks.filter(t => {
          if (!t.date_echeance || t.statut === 'termine') return false
          return new Date(t.date_echeance) < today
        })
      default:
        return tasks
    }
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'termine': return 'bg-green-100 text-green-700'
      case 'en_cours': return 'bg-blue-100 text-blue-700'
      case 'a_faire': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'termine': return 'Terminé'
      case 'en_cours': return 'En cours'
      case 'a_faire': return 'À faire'
      default: return statut
    }
  }

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case 'haute': return 'bg-red-100 text-red-600'
      case 'moyenne': return 'bg-orange-100 text-orange-600'
      case 'basse': return 'bg-green-100 text-green-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getPrioriteLabel = (priorite: string) => {
    switch (priorite) {
      case 'haute': return 'Haute'
      case 'moyenne': return 'Moyenne'
      case 'basse': return 'Basse'
      default: return priorite
    }
  }

  const isOverdue = (task: Task) => {
    if (!task.date_echeance || task.statut === 'termine') return false
    return new Date(task.date_echeance) < new Date()
  }

  const filteredTasks = getFilteredTasks()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                ME
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Mes Tâches</h1>
                <p className="text-sm text-slate-500">Vue d'ensemble de mes responsabilités</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/login')}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-800">Total</h3>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-800">À faire</h3>
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-gray-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-600">{stats.not_started}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-800">En cours</h3>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.in_progress}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-800">Terminées</h3>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-800">En retard</h3>
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Filtres</h2>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-500" />
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Toutes
                </button>
                <button
                  onClick={() => setFilter('today')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'today' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Aujourd'hui
                </button>
                <button
                  onClick={() => setFilter('week')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'week' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Cette semaine
                </button>
                <button
                  onClick={() => setFilter('overdue')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'overdue' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  En retard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              {filter === 'all' && 'Toutes les tâches'}
              {filter === 'today' && 'Tâches du jour'}
              {filter === 'week' && 'Tâches de la semaine'}
              {filter === 'overdue' && 'Tâches en retard'}
            </h2>
            <p className="text-sm text-slate-500">
              {filteredTasks.length} tâche{filteredTasks.length > 1 ? 's' : ''}
            </p>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="h-5 w-5 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 font-medium">Aucune tâche trouvée</p>
              <p className="text-xs text-slate-400 mt-1">
                {filter === 'all' 
                  ? 'Vous n\'avez aucune tâche assignée pour le moment.' 
                  : `Aucune tâche ${filter === 'today' ? 'pour aujourd\'hui' : filter === 'week' ? 'pour cette semaine' : 'en retard'}.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`border rounded-xl p-4 transition-all hover:shadow-md ${
                    isOverdue(task) ? 'border-red-200 bg-red-50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(task.statut)}`}>
                          {getStatutLabel(task.statut)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPrioriteColor(task.priorite || 'moyenne')}`}>
                          {getPrioriteLabel(task.priorite || 'moyenne')}
                        </span>
                        {isOverdue(task) && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                            En retard
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">{task.titre}</h3>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">DAO:</span>
                          <span className="text-blue-600">{task.dao_numero}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Chef:</span>
                          <span>{task.chef_projet_nom}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-slate-600 mb-1">
                          <span>Progression</span>
                          <span>{task.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              task.statut === 'termine' ? 'bg-green-500' :
                              task.statut === 'en_cours' ? 'bg-blue-500' : 'bg-slate-300'
                            }`}
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Due Date */}
                      {task.date_echeance && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className={`font-medium ${
                            isOverdue(task) ? 'text-red-600' : 'text-slate-600'
                          }`}>
                            Échéance: {new Date(task.date_echeance).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
