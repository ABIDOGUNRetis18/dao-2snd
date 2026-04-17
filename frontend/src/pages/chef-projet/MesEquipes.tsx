import { useState, useEffect } from 'react'
import { Users, TrendingUp, User, Search, ChevronRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface TeamMember {
  id: number
  name: string
  email: string
  role_id: number
  role: string
  tasks: MemberTask[]
}

interface MemberTask {
  id_task: number
  dao_id: number
  titre: string
  description?: string
  statut: string
  progress: number
  dao_numero: string
  dao_objet: string
  created_at: string
}

interface Team {
  id: number
  name: string
  objet: string
  leader: string
  memberCount: number
  members: TeamMember[]
  team_id: number
}

interface TeamStats {
  totalTeams: number
  totalMembers: number
  totalDaos: number
  averageProgress: number
}

// Fonction pour calculer la progression depuis le statut
const getProgressFromStatus = (statut: string) => {
  switch (statut) {
    case 'termine': return 100;
    case 'en_cours': return 50;
    case 'a_faire': return 0;
    default: return 0;
  }
};


export default function MesEquipes() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState<TeamStats>({
    totalTeams: 0,
    totalMembers: 0,
    totalDaos: 0,
    averageProgress: 0
  })

  useEffect(() => {
    if (user?.id) {
      loadTeams()
    }
  }, [user])

  const loadTeams = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/chef-teams?chefId=${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }

      const data = await response.json()
      const apiData: Team[] = data.data || []

      // Calculer les statistiques globales
      const totalTeams = apiData.length
      const totalMembers = apiData.reduce((sum, team) => sum + team.memberCount, 0)
      const totalDaos = apiData.length // 1 DAO = 1 équipe
      const allTasks = apiData.flatMap(team => team.members.flatMap(member => member.tasks))
      const totalProgress = allTasks.reduce((sum, task) => {
        const progress = task.progress || getProgressFromStatus(task.statut)
        return sum + progress
      }, 0)
      const averageProgress = allTasks.length > 0 ? Math.round(totalProgress / allTasks.length) : 0

      setStats({
        totalTeams,
        totalMembers,
        totalDaos,
        averageProgress
      })

      setTeams(apiData)
    } catch (error) {
      console.error('Erreur lors du chargement des équipes:', error)
    } finally {
      setLoading(false)
    }
  }

  
  // Filtrer les équipes
  const filteredTeams = teams.filter((team) => {
    const matchesSearch = 
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.leader.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Gérer l'expansion d'une équipe
  const toggleTeamExpansion = (teamId: number) => {
    if (expandedTeam === teamId) {
      setExpandedTeam(null)
    } else {
      setExpandedTeam(teamId)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Équipes</h1>
        <p className="text-gray-600">Vue d'ensemble de vos équipes et de l'avancement des tâches</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Users className="h-4 w-4 text-blue-600" />
            <div className="ml-3">
              <p className="text-xl font-bold text-gray-900">{stats.totalTeams}</p>
              <p className="text-sm text-gray-600">Équipes Totales</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <User className="h-4 w-4 text-green-600" />
            <div className="ml-3">
              <p className="text-xl font-bold text-gray-900">{stats.totalMembers}</p>
              <p className="text-sm text-gray-600">Membres Totaux</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <div className="ml-3">
              <p className="text-xl font-bold text-gray-900">{stats.totalDaos}</p>
              <p className="text-sm text-gray-600">DAOs Assignés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recherche et filtrage */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une équipe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-600">Chargement des équipes...</p>
        </div>
      )}

      {/* Liste des équipes */}
      {!loading && (
        <div className="space-y-6">
          {filteredTeams.map((team) => (
            <div key={team.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Header de l'équipe */}
              <div 
                className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleTeamExpansion(team.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">{team.name}</h4>
                      <p className="text-xs text-gray-600">Chef d'équipe: {team.leader}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">{team.memberCount} membres</span>
                    <ChevronRight 
                      className={`h-3 w-3 text-gray-400 transition-transform ${
                        expandedTeam === team.id ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>
                </div>
              </div>

              {/* Détails dépliés */}
              {expandedTeam === team.id && (
                <div className="p-6">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Tâches Assignées</h4>
                  
                  {team.members.map((member) => {
                    const memberTasksForDao = member.tasks?.filter(
                      (task: MemberTask) => task.dao_id === team.id
                    ) || [];
                    
                    return (
                      <div key={member.id} className="mb-6">
                        {/* Header du membre */}
                        <div className="bg-gray-100 px-4 py-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <User className="h-3 w-3 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-600">{member.role}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Tâches du membre */}
                        <div className="p-4 space-y-3">
                          {memberTasksForDao.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Aucune tâche assignée à ce membre pour ce DAO</p>
                          ) : (
                            memberTasksForDao.map((task: MemberTask) => {
                              const progress = task.progress || getProgressFromStatus(task.statut);
                              
                              return (
                                <div key={task.id_task} className="bg-white p-4 rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-gray-900">
                                      {task.id_task} - {task.titre}
                                    </span>
                                    <span className="text-sm text-gray-600">{progress}%</span>
                                  </div>
                                  
                                  {/* Barre de progression */}
                                  <div className="w-full bg-gray-100 h-3 rounded-full mb-2">
                                    <div 
                                      className={`h-3 rounded-full transition-all duration-300 ${
                                        task.statut === 'termine' ? 'bg-green-500' :
                                        task.statut === 'en_cours' ? 'bg-yellow-500' : 
                                        'bg-blue-500'
                                      }`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">
                                      {task.statut === 'termine' ? 'Terminé' : 
                                       task.statut === 'en_cours' ? 'En cours' :
                                       task.statut === 'a_faire' ? 'À faire' : task.statut}
                                    </span>
                                    {task.description && (
                                      <span className="text-sm text-gray-500 truncate ml-2">{task.description}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* État vide */}
      {!loading && filteredTeams.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune équipe trouvée</h3>
          <p className="text-gray-600">
            {searchTerm 
              ? `Aucune équipe ne correspond à "${searchTerm}"`
              : "Vous n'avez pas encore d'équipe assignée"
            }
          </p>
        </div>
      )}
    </div>
  )
}
