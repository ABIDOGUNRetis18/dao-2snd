import { useState, useEffect } from 'react'
import { Search, Plus, MessageSquare, ChevronRight, User, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Task {
  id: number
  id_task: number
  nom: string
  dao_id: number
  dao_numero: string
  statut: string
  progress: number
  assigned_to: number | null
  assigned_username?: string
}

export default function MembreEquipe() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

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
              setTasks(result.data.tasks || [])
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

  // Calcul des statistiques
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(task => task.progress === 100).length
  const inProgressTasks = tasks.filter(task => task.progress > 0 && task.progress < 100).length
  const pendingTasks = tasks.filter(task => task.progress === 0).length

  const filteredTasks = tasks.filter(task => {
    const q = searchTerm.toLowerCase()
    return (
      task.nom.toLowerCase().includes(q) ||
      task.dao_numero.toLowerCase().includes(q)
    )
  })

  const getProgressColor = (progress: number) => {
    if (progress < 33) return 'bg-red-500'
    if (progress < 66) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusText = (progress: number) => {
    if (progress === 0) return 'À faire'
    if (progress === 100) return 'Terminé'
    return 'En cours'
  }

  const getStatusColor = (progress: number) => {
    if (progress === 0) return 'bg-gray-100 text-gray-800'
    if (progress === 100) return 'bg-green-100 text-green-800'
    return 'bg-blue-100 text-blue-800'
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
              placeholder="Rechercher une tâche..."
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

        {/* Liste des tâches compacte */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                {/* Header de la tâche */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">
                        Tâche n°{task.id_task}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.progress)}`}>
                        {getStatusText(task.progress)}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-800 text-sm mb-2">
                      {task.nom}
                    </h3>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(task.progress)}`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-600">Progression</span>
                    <span className="text-xs font-medium text-gray-900">{task.progress}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                    <Plus className="w-4 h-4" />
                    <span>Progression</span>
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                    <MessageSquare className="w-4 h-4" />
                    <span>Commenter</span>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* État vide */}
        {!loading && filteredTasks.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <MessageSquare className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Aucune tâche trouvée' : 'Aucune tâche assignée'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `Aucune tâche ne correspond à "${searchTerm}"`
                : "Vous n'avez aucune tâche assignée pour le moment."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
