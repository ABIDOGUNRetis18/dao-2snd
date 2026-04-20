import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_ENDPOINTS, apiGet, apiPost, apiPut, apiDelete } from '../../config/api'
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
  const [loading, setLoading]   = useState(true)
  const [newTaskName, setNewTaskName] = useState('')
  const [saving, setSaving]     = useState(false)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const [daoProgress, setDaoProgress] = useState(0)
  const [daoStats, setDaoStats] = useState({ total_tasks: 0, assigned_tasks: 0, completed_tasks: 0 })
  const [daoInfo, setDaoInfo] = useState<any>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
  const canUpdateTask = (task: TaskRow) => user && task.assigned_to === user.id

  const isTaskCompleted = (task: TaskRow) =>
    task.statut === 'termine' || Number(task.progress || 0) >= 100

  const recalculateDaoMetrics = (taskList: TaskRow[]) => {
    const assignedTasks = taskList.filter(t => t.assigned_to !== null)
    const completedTasks = assignedTasks.filter(isTaskCompleted)
    const averageProgress = assignedTasks.length > 0
      ? Math.round(assignedTasks.reduce((sum, t) => sum + Number(t.progress || 0), 0) / assignedTasks.length)
      : 0

    setDaoProgress(averageProgress)
    setDaoStats({
      total_tasks: taskList.length,
      assigned_tasks: assignedTasks.length,
      completed_tasks: completedTasks.length
    })
  }

  useEffect(() => { loadAll() }, [id])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const loadAll = async () => {
    try {
      console.log('Chargement des tâches et membres d\'équipe du DAO...')

      // Charger les tâches (avec assignations incluses), les membres d'équipe du DAO et les infos du DAO
      const [tasksRes, teamRes, daoRes] = await Promise.all([
        apiGet(`/task`),  // API task selon la documentation
        apiGet(`/dao/${id}/team-members`),  // API team-members selon la documentation
        apiGet(`/dao/${id}`),  // API DAO selon la documentation
      ])

      let loadedTasks: any[] = []
      
      if (tasksRes.success) {
        console.log('Réponse complète API tasks:', tasksRes)
        console.log('Structure des données:', tasksRes.data)
        console.log('Première tâche exemple:', tasksRes.data?.[0])
        
        // Adapter les données selon la documentation
        const rawData = tasksRes.data || []
        loadedTasks = rawData.map((task: any) => ({
          id: task.id,
          nom: task.titre || task.name || `Tâche ${task.id}`,
          description: task.description || task.comment || "À faire",
          progress: task.progress || 0,
          statut: task.statut || (task.progress === 100 ? 'termine' : task.progress > 0 ? 'en_cours' : 'a_faire'),
          assigned_to: task.assigned_to,
          assigned_username: task.assigned_username || (task.assigned_to ? "Utilisateur inconnu" : null),
          assigned_email: task.assigned_email || null
        }))
        
        console.log('Tâches adaptées:', loadedTasks)
        setTasks(loadedTasks)
        
        // Récupérer la progression du DAO
        setDaoProgress(tasksRes.data?.dao_progress || 0)
        setDaoStats(tasksRes.data?.dao_stats || { total_tasks: 0, assigned_tasks: 0, completed_tasks: 0 })
        // Sécurise l'affichage côté UI même si l'API n'a pas encore les nouveaux champs
        recalculateDaoMetrics(loadedTasks)
      } else {
        console.error('Erreur chargement tâches:', tasksRes.error)
      }
      
      if (teamRes.success) {
        console.log('Réponse complète API team:', teamRes)
        console.log('Membres d\'équipe reçus:', teamRes.data?.members)
        setUsers(teamRes.data?.members || [])
      } else {
        console.error('Erreur chargement membres d\'équipe:', teamRes.error)
        console.log('Réponse erreur API team:', teamRes)
      }

      // Les tâches viennent déjà avec assigned_username depuis l'API tasks
      console.log('Tâches avec assignations incluses:', loadedTasks)

      if (daoRes.success) {
        console.log('Infos DAO reçues:', daoRes.data?.dao)
        setDaoInfo(daoRes.data?.dao)
      } else {
        console.error('Erreur chargement infos DAO:', daoRes.error)
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally { 
      setLoading(false) 
    }
  }

  
  const handleSaveTask = async () => {
    if (!newTaskName.trim()) return
    setSaving(true)
    try {
      console.log('Création de la tâche:', newTaskName.trim())
      
      const responseData = await apiPost(
        API_ENDPOINTS.TASK_CREATE_DAO(id!),
        { nom: newTaskName.trim() }
      )
      
      console.log('Réponse de l\'API:', responseData)
      
      if (responseData.success) {
        console.log('Tâche créée avec succès dans la base:', responseData.data)
        setNewTaskName('')
        // Attendre un peu pour s'assurer que la base est mise à jour
        setTimeout(() => {
          loadAll()
        }, 500)
      } else {
        console.error('❌ Erreur lors de la création:', responseData)
        alert('Erreur lors de la création: ' + (responseData.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('❌ Erreur:', error)
      alert('Erreur: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return
    
    try {
      const res = await apiDelete(API_ENDPOINTS.TASK_DELETE(taskId))
      
      if (res.success) {
        console.log('✅ Tâche supprimée avec succès')
        const updatedTasks = tasks.filter(t => t.id !== taskId)
        setTasks(updatedTasks)
        recalculateDaoMetrics(updatedTasks)
      } else {
        console.error('❌ Erreur lors de la suppression:', res.error)
        alert('Erreur lors de la suppression: ' + (res.error || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('❌ Erreur:', error)
      alert('Erreur: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    }
  }

  const handleAssign = async (taskId: number, userId: number | null) => {
    // Check if user can assign tasks before allowing assignment
    if (!canAssignTasks) {
      alert('Seul un administrateur ou le chef de projet peut assigner des membres aux tâches')
      return
    }

    try {
      // Utiliser l'ancienne API d'assignation qui fonctionne
      const response = await apiPut(API_ENDPOINTS.TASK_ASSIGN(taskId), { assigned_to: userId })
      
      if (response.success) {
        const updatedTasks = tasks.map(t =>
          t.id === taskId
            ? { 
                ...t, 
                assigned_to: userId, 
                assigned_username: users.find(u => u.id === userId)?.username,
                assigned_email: users.find(u => u.id === userId)?.email
              }
            : t
        )
        setTasks(updatedTasks)
        recalculateDaoMetrics(updatedTasks)
        console.log('Tâche assignée avec succès:', response.data)
      } else {
        throw new Error(response.message || 'Erreur lors de l\'assignation')
      }
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error)
      alert('Erreur lors de l\'assignation: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    }
    setOpenDropdown(null)
  }

  const handleUpdateProgress = async (taskId: number, progress: number) => {
    // Find task to check permissions
    const task = tasks.find(t => t.id === taskId)
    if (!task) {
      alert('Tâche non trouvée')
      return
    }

    // Check if user is assigned to this task
    if (!canUpdateTask(task)) {
      alert('Seul le membre assigné à cette tâche peut la modifier')
      return
    }

    try {
      const statut = progress >= 100 ? 'termine' : progress > 0 ? 'en_cours' : 'a_faire'
      const res = await apiPut(
        API_ENDPOINTS.TASK_PROGRESS(taskId),
        { progress, statut }
      )
      if (res.success) {
        const updatedTasks = tasks.map(t =>
          t.id === taskId
            ? { ...t, progress, statut }
            : t
        )
        setTasks(updatedTasks)
        recalculateDaoMetrics(updatedTasks)
      } else {
        alert(res.error || 'Mise à jour bloquée par la règle de progression du DAO')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      alert('Erreur lors de la mise à jour: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    }
  }

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const getProgressColor = (progress: number = 0) => {
    if (progress < 33) return 'bg-red-500'
    if (progress < 66) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const getProgressTextColor = (progress: number = 0) => {
    if (progress < 33) return 'text-red-600'
    if (progress < 66) return 'text-amber-600'
    return 'text-green-600'
  }

  const COLORS = ['bg-blue-500','bg-green-500','bg-purple-500','bg-amber-500','bg-rose-500','bg-teal-500']
  const colorFor = (i: number) => COLORS[i % COLORS.length]

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-5">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/my-dao')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">DAO N°{id}</h1>
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

        {/* STATS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-5">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{daoStats.total_tasks}</div>
              <div className="text-sm text-slate-500">Tâches totales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{daoStats.assigned_tasks}</div>
              <div className="text-sm text-slate-500">Assignées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{daoStats.completed_tasks}</div>
              <div className="text-sm text-slate-500">Terminées</div>
            </div>
          </div>
          
          {/* Progression globale du DAO */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">Progression globale</span>
              <span className={`text-sm font-bold ${getProgressTextColor(daoProgress)}`}>{daoProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${getProgressColor(daoProgress)}`}
                style={{ width: `${daoProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* TASKS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">Tâches</h2>
            <div className="text-sm text-slate-500">
              {tasks.length} tâche{tasks.length > 1 ? 's' : ''}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-500">Chargement...</div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <div key={task.id} className="border-b border-slate-100 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${colorFor(index)}`}>
                        {getInitials(task.nom)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{task.nom}</div>
                        {task.description && (
                          <div className="text-sm text-slate-500">{task.description}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Progression */}
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-slate-600">{task.progress || 0}%</div>
                        <div className="w-16 bg-slate-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all ${getProgressColor(task.progress)}`}
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Assignation */}
                      {canAssignTasks ? (
                        <div className="relative" ref={dropdownRef}>
                          <button
                            onClick={() => setOpenDropdown(openDropdown === task.id ? null : task.id)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm transition-colors"
                          >
                            {task.assigned_username ? (
                              <>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${colorFor(index)}`}>
                                  {getInitials(task.assigned_username)}
                                </div>
                                <span className="text-slate-700">{task.assigned_username}</span>
                              </>
                            ) : (
                              <span className="text-slate-400">Non assigné</span>
                            )}
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          </button>

                          {openDropdown === task.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                              <button
                                onClick={() => handleAssign(task.id, null)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                              >
                                <span className="text-slate-400">— Non assigné —</span>
                              </button>
                              {users.map((member) => (
                                <button
                                  key={member.id}
                                  onClick={() => handleAssign(task.id, member.id)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
                                >
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${colorFor(member.id)}`}>
                                    {getInitials(member.username)}
                                  </div>
                                  <span className="text-slate-700">{member.username}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {task.assigned_username ? (
                            <>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${colorFor(index)}`}>
                                {getInitials(task.assigned_username)}
                              </div>
                              <span className="text-sm text-slate-600">{task.assigned_username}</span>
                            </>
                          ) : (
                            <span className="text-sm text-slate-400">Non assigné</span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      {canUpdateTask(task) && (
                        <div className="flex items-center gap-1">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={task.progress || 0}
                            onChange={(e) => handleUpdateProgress(task.id, parseInt(e.target.value))}
                            className="w-20"
                          />
                          <span className={`text-xs font-medium ${getProgressTextColor(task.progress)}`}>
                            {task.progress || 0}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ajouter une tâche */}
          {canAssignTasks && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Nom de la nouvelle tâche"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button 
                  onClick={handleSaveTask}
                  disabled={saving || !newTaskName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {saving ? 'Création...' : 'Créer la tâche'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
