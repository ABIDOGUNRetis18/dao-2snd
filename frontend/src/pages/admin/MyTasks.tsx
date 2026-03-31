import { useEffect, useState } from 'react'
import { Search, ArrowLeft, Calendar, User, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Task {
  id: number
  titre: string
  description: string
  dao_numero: string
  dao_objet: string
  date_echeance: string
  statut: 'en_attente' | 'en_cours' | 'termine'
  priorite: 'basse' | 'moyenne' | 'haute'
  assigne_par: string
}

export default function MyTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  // Mock data pour le développement
  const mockTasks: Task[] = [
    {
      id: 1,
      titre: 'Réviser la proposition technique',
      description: 'Analyser et valider la proposition technique pour le client',
      dao_numero: 'DAO-2025-001',
      dao_objet: 'Système d\'information RH',
      date_echeance: '2025-04-15',
      statut: 'en_cours',
      priorite: 'haute',
      assigne_par: 'Jean Dupont'
    },
    {
      id: 2,
      titre: 'Préparer la réunion de suivi',
      description: 'Organiser la réunion hebdomadaire de suivi du projet',
      dao_numero: 'DAO-2025-002',
      dao_objet: 'Infrastructure cloud',
      date_echeance: '2025-04-10',
      statut: 'en_attente',
      priorite: 'moyenne',
      assigne_par: 'Marie Martin'
    },
    {
      id: 3,
      titre: 'Finaliser le rapport d\'avancement',
      description: 'Rédiger le rapport mensuel d\'avancement des projets',
      dao_numero: 'DAO-2025-001',
      dao_objet: 'Système d\'information RH',
      date_echeance: '2025-04-08',
      statut: 'termine',
      priorite: 'basse',
      assigne_par: 'Pierre Durand'
    }
  ]

  useEffect(() => {
    // Simulation de chargement des données
    setTimeout(() => {
      setTasks(mockTasks)
      setLoading(false)
    }, 500)
  }, [])

  // Filtrage des tâches
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchTerm === '' || 
      task.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.dao_numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.dao_objet.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente': return 'bg-yellow-100 text-yellow-800'
      case 'en_cours': return 'bg-blue-100 text-blue-800'
      case 'termine': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_attente': return 'En attente'
      case 'en_cours': return 'En cours'
      case 'termine': return 'Terminé'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'haute': return 'bg-red-100 text-red-800'
      case 'moyenne': return 'bg-orange-100 text-orange-800'
      case 'basse': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'haute': return 'Haute'
      case 'moyenne': return 'Moyenne'
      case 'basse': return 'Basse'
      default: return priority
    }
  }

  const isOverdue = (dateEcheance: string) => {
    return new Date(dateEcheance) < new Date()
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin"
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Mes Tâches</h1>
            <p className="text-slate-500 text-sm">
              {filteredTasks.length} tâche{filteredTasks.length > 1 ? 's' : ''} trouvée{filteredTasks.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une tâche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-slate-500">Chargement des tâches...</p>
          </div>
        )}

        {/* Liste des tâches */}
        {!loading && filteredTasks.length > 0 && (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
                onClick={() => {
                  // TODO: Naviguer vers le détail de la tâche
                  console.log('Ouvrir le détail de la tâche:', task.id)
                }}
              >
                {/* En-tête avec titre, statut et priorité */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">{task.titre}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{task.description}</p>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.statut)}`}>
                      {getStatusLabel(task.statut)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priorite)}`}>
                      {getPriorityLabel(task.priorite)}
                    </span>
                  </div>
                </div>

                {/* Informations DAO */}
                <div className="bg-slate-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{task.dao_numero}</span>
                  </div>
                  <p className="text-sm text-slate-600">{task.dao_objet}</p>
                </div>

                {/* Date d'échéance et assigné par */}
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span className={isOverdue(task.date_echeance) ? 'text-red-600 font-medium' : ''}>
                        {new Date(task.date_echeance).toLocaleDateString('fr-FR')}
                        {isOverdue(task.date_echeance) && ' (En retard)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>Assigné par {task.assigne_par}</span>
                    </div>
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
              {searchTerm ? 'Aucune tâche trouvée.' : 'Aucune tâche assignée.'}
            </h3>
            <p className="text-slate-500">
              {searchTerm 
                ? 'Essayez de modifier votre recherche.'
                : 'Vous n\'avez pas de tâches assignées pour le moment.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
