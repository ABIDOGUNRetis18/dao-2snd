import { useState, useEffect } from 'react'
import { Users, TrendingUp, ChevronDown, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface TeamMember {
  id: number
  username: string
  email: string
  role_id: number
  assigned_at: string
}

interface Team {
  dao_id: number
  numero: string
  objet: string
  statut: string
  created_at: string
  chef_name: string
  chef_email: string
  members: TeamMember[]
}

interface MemberTask {
  id: number
  nom: string
  statut: string
  progress: number
  assigned_to: number
}

export default function MesEquipes() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null)
  const [memberTasks, setMemberTasks] = useState<Record<number, MemberTask[]>>({})
  const [loadingTasks, setLoadingTasks] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (user?.id) {
      loadTeams()
    }
  }, [user])

  const loadTeams = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/chef-teams?chefId=${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTeams(data.data.teams || [])
          console.log('Équipes chargées:', data.data.teams)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des équipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMemberTasks = async (memberId: number) => {
    if (memberTasks[memberId]) {
      return // Déjà chargé
    }

    setLoadingTasks(prev => ({ ...prev, [memberId]: true }))
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/my-tasks?userId=${memberId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMemberTasks(prev => ({
            ...prev,
            [memberId]: data.data.tasks || []
          }))
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tâches du membre:', error)
    } finally {
      setLoadingTasks(prev => ({ ...prev, [memberId]: false }))
    }
  }

  const toggleTeam = (teamId: number) => {
    if (expandedTeam === teamId) {
      setExpandedTeam(null)
    } else {
      setExpandedTeam(teamId)
      // Charger les tâches des membres de cette équipe
      const team = teams.find(t => t.dao_id === teamId)
      if (team) {
        team.members.forEach(member => {
          loadMemberTasks(member.id)
        })
      }
    }
  }

  const calculateMemberProgress = (memberId: number) => {
    const tasks = memberTasks[memberId] || []
    if (tasks.length === 0) return 0
    
    const completedTasks = tasks.filter(task => 
      task.statut === 'termine' || Number(task.progress || 0) >= 100
    )
    
    return Math.round((completedTasks.length / tasks.length) * 100)
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE': return 'bg-yellow-100 text-yellow-800'
      case 'EN_COURS': return 'bg-blue-100 text-blue-800'
      case 'TERMINE': return 'bg-green-100 text-green-800'
      case 'A_RISQUE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress < 33) return 'bg-red-500'
    if (progress < 66) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const totalTeams = teams.length
  const totalMembers = teams.reduce((sum, team) => sum + team.members.length, 0)
  const averageProgress = teams.length > 0 
    ? Math.round(teams.reduce((sum, team) => {
        const teamProgress = team.members.reduce((memberSum, member) => 
          memberSum + calculateMemberProgress(member.id), 0
        )
        return sum + (teamProgress / Math.max(team.members.length, 1))
      }, 0) / teams.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-4">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-3">
          <Users className="h-6 w-6 text-blue-600" />
          Vue d'ensemble des équipes
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gérez vos équipes et suivez la progression des tâches
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total équipes</p>
              <p className="text-2xl font-bold text-slate-800">{totalTeams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total membres</p>
              <p className="text-2xl font-bold text-slate-800">{totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Progression moyenne</p>
              <p className="text-2xl font-bold text-slate-800">{averageProgress}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des équipes */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Mes équipes</h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-slate-500">Chargement des équipes...</div>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-500">Aucune équipe trouvée</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {teams.map((team) => (
              <div key={team.dao_id} className="p-6">
                {/* En-tête de l'équipe */}
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-50 -m-6 p-6 rounded-t-2xl transition-colors"
                  onClick={() => toggleTeam(team.dao_id)}
                >
                  <div className="flex items-center gap-4">
                    <ChevronDown 
                      className={`h-5 w-5 text-slate-400 transition-transform ${
                        expandedTeam === team.dao_id ? 'rotate-180' : ''
                      }`} 
                    />
                    <div>
                      <h3 className="font-semibold text-slate-800">{team.numero}</h3>
                      <p className="text-sm text-slate-600">{team.objet}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Chef: {team.chef_name} ({team.chef_email})
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(team.statut)}`}>
                      {team.statut?.replace('_', ' ')}
                    </span>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">{team.members.length} membres</p>
                      <p className="text-xs text-slate-400">
                        Créé le {new Date(team.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Détails de l'équipe */}
                {expandedTeam === team.dao_id && (
                  <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {team.members.map((member) => {
                        const progress = calculateMemberProgress(member.id)
                        const tasks = memberTasks[member.id] || []
                        const isLoading = loadingTasks[member.id]
                        
                        return (
                          <div key={member.id} className="border border-slate-200 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                {member.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-slate-800">{member.username}</p>
                                <p className="text-xs text-slate-500">{member.email}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">Progression</span>
                                <span className="text-xs font-medium text-slate-700">{progress}%</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              
                              <div className="text-xs text-slate-500">
                                {isLoading ? (
                                  <span>Chargement des tâches...</span>
                                ) : (
                                  <span>{tasks.length} tâche{tasks.length > 1 ? 's' : ''}</span>
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
      </div>
    </div>
  )
}
