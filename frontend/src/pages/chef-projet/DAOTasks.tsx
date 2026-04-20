import { useState, useEffect } from 'react'
import { ArrowLeft, User } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiPost } from '../../config/api'
import { useAuth } from '../../contexts/AuthContext'

interface User {
  id: number
  username: string
  email?: string
  url_photo?: string
  role_id?: number
}

interface TaskRow {
  id: number
  id_task: number
  nom: string
  assigned_to: number | null
  assigned_username?: string
  progress?: number
  statut?: string
  membres?: User[]
}

export default function ChefProjetDAOTasks() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [tasks, setTasks]       = useState<TaskRow[]>([])
  const [users, setUsers]       = useState<User[]>([])
  const [assignments, setAssignments] = useState<Record<number, number | null>>({})
  const [loading, setLoading]   = useState(true)
    const [daoInfo, setDaoInfo] = useState<any>(null)
  const [newTaskName, setNewTaskName] = useState('')
  const [saving, setSaving] = useState(false)

  // Permission checks
  const isDaoChef = user && daoInfo && user.id === daoInfo.chef_id
  const isAdmin = user && user.role_id === 2
  const isChefProjetRole = user && user.role_id === 3
  const canAssignTasks = isDaoChef || isAdmin || isChefProjetRole
  
  // Logs de diagnostic
  console.log('Permission checks:', {
    user: user,
    daoInfo: daoInfo,
    isDaoChef,
    isAdmin,
    isChefProjetRole,
    canAssignTasks,
    userId: user?.id,
    daoChefId: daoInfo?.chef_id,
    userRoleId: user?.role_id
  })


  
  useEffect(() => {
    let isMounted = true
    
    const loadData = async () => {
      if (!isMounted) return
      await loadAll()
    }
    
    loadData()
    
    return () => {
      isMounted = false
    }
  }, [id])


  const loadAll = async () => {
    let isMounted = true
    
    try {
      console.log('Chargement des tâches et membres d\'équipe du DAO...')

      // Charger selon la documentation à deux niveaux
      // 1. Charger les MODÈLES de tâches (table task)
      // 2. Charger les membres de l'équipe du DAO
      // 3. Charger les TÂCHES EXISTANTES du DAO (table tasks)
      // 4. Charger les infos du DAO
      const [taskModelsRes, teamRes, taskAssignmentsRes, daoRes] = await Promise.all([
        apiGet(`/task`),  // API task (modèles) selon la documentation
        apiGet(`/team/dao/${id}/team-members`),  // API team-members existante dans le backend
        apiGet(`/task-assignment?daoId=${id}`),  // API task-assignment selon la documentation
        apiGet(`/dao/${id}`),  // API DAO existante dans le backend
      ])

      let taskModels: any[] = []
      let assignments: Record<number, number | null> = {}
      
      // 1. Charger les modèles de tâches
      if (taskModelsRes.success && isMounted) {
        console.log('Réponse API task models:', taskModelsRes)
        taskModels = taskModelsRes.data || []
        console.log('Modèles de tâches:', taskModels)
      } else if (isMounted) {
        console.error('Erreur chargement modèles de tâches:', taskModelsRes.error)
      }
      
      // 2. Charger les membres d'équipe
      if (teamRes.success && isMounted) {
        console.log('Réponse API team:', teamRes)
        const members = (teamRes.data?.members || []).map((member: any) => ({
          ...member,
          id: Number(member.id) // Convertir l'ID en number
        }))
        setUsers(members)
      } else if (isMounted) {
        console.error('Erreur chargement membres d\'équipe:', teamRes.error)
      }

      // 3. Charger les assignations existantes
      if (taskAssignmentsRes.success && isMounted) {
        console.log('Réponse API task-assignments:', taskAssignmentsRes)
        const rows = taskAssignmentsRes.data?.assignments || []

        // Créer un mapping id_task -> assigned_to
        for (const row of rows) {
          assignments[row.id_task] = row.assigned_to ?? null
        }
        setAssignments(assignments)
        console.log('Assignations chargées:', assignments)
      } else if (isMounted) {
        console.error('Erreur chargement assignations:', taskAssignmentsRes.error)
      }

      // 4. Charger les infos du DAO
      if (daoRes.success && isMounted) {
        console.log('Infos DAO reçues:', daoRes.data?.dao)
        setDaoInfo(daoRes.data?.dao)
      } else if (isMounted) {
        console.error('Erreur chargement infos DAO:', daoRes.error)
      }

      // Mettre à jour les tâches avec les modèles
      if (isMounted) {
        setTasks(taskModels)
      }
      
    } catch (error) {
      if (isMounted) {
        console.error('Erreur lors du chargement:', error)
      }
    } finally { 
      if (isMounted) {
        setLoading(false) 
      }
    }
  }

  
  const handleSaveTask = async () => {
    if (!newTaskName.trim()) return
    
    try {
      setSaving(true)
      const response = await apiPost('/task', {
        nom: newTaskName.trim()
      })
      
      if (response.success) {
        setNewTaskName('')
        // Recharger les tâches
        loadAll()
      } else {
        alert(response.error || 'Erreur lors de la création de la tâche')
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      alert('Erreur lors de la création de la tâche')
    } finally {
      setSaving(false)
    }
  }

  const handleAssign = async (task: TaskRow, memberId: string) => {
    // Check if user can assign tasks before allowing assignment
    if (!canAssignTasks) {
      alert('Seul un administrateur ou le chef de projet peut assigner des membres aux tâches')
      return
    }

    try {
      // Utiliser la nouvelle API /task-assignment selon la documentation
      const response = await apiPost('/task-assignment', {
        dao_id: Number(id),
        id_task: task.id,
        assigned_to: memberId ? Number(memberId) : null
      })
      
      if (response.success) {
        // Mettre à jour les assignations
        const newAssignments = { ...assignments }
        if (memberId) {
          newAssignments[task.id] = Number(memberId)
        } else {
          delete newAssignments[task.id]
        }
        setAssignments(newAssignments)
        console.log('Tâche assignée avec succès:', response.data)
      } else {
        throw new Error(response.message || 'Erreur lors de l\'assignation')
      }
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error)
      alert('Erreur lors de l\'assignation: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    }
  }



  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  
  return (
    <div className="min-h-screen bg-slate-100 font-sans border border-slate-100 rounded-lg m-2">
      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-5">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/chef-projet/mes-daos')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">Gestion des tâches DAO N°{id}</h1>
          {daoInfo && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Groupement:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                daoInfo.groupement === "oui" 
                  ? "bg-green-100 text-green-700" 
                  : "bg-gray-100 text-gray-600"
              }`}>
                {daoInfo.groupement === "oui" ? (
                  daoInfo.nom_partenaire || "Aucun nom"
                ) : (
                  "Non"
                )}
              </span>
            </div>
          )}
        </div>

        {/* Section 1: Création de nouvelles tâches */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Créer une nouvelle tâche</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Nom de la nouvelle tâche..."
              value={newTaskName}
              onChange={e => setNewTaskName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveTask()}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition"
            />
            <button
              onClick={handleSaveTask}
              disabled={saving || !newTaskName.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* Section 2: Table des 15 tâches avec assignation selon la documentation */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Tâches du DAO</h2>

          {loading ? (
            <div className="text-center py-8 text-slate-500">Chargement...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-16">N°</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 min-w-[300px]">Tache</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-48">Assigner à</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-48">Membres assignés</th>

                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, index) => (
                    <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-600">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-800">{task.nom}</div>
                      </td>
                      <td className="px-4 py-3">
                        {canAssignTasks ? (
                          <select
                            value={assignments[task.id] || ""}
                            onChange={(e) => handleAssign(task, e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm transition-colors border border-slate-300"
                          >
                            <option value="">Non assignée</option>
                            {users.map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.username}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-slate-600">
                            {assignments[task.id] ? 
                              users.find(u => u.id === assignments[task.id])?.username || "Utilisateur inconnu" 
                              : "Non assigné"
                            }
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {assignments[task.id] ? (
                          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg flex-1">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {getInitials(users.find(m => m.id === assignments[task.id])?.username || 'U')}
                            </div>
                            <span className="font-medium text-slate-800">
                              {users.find(m => m.id === assignments[task.id])?.username || 'Utilisateur inconnu'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Non assigné</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
