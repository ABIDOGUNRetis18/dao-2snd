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
  is_chef?: boolean
}

interface TaskRow {
  id: number
  id_task: number
  nom: string
  assigned_to: number | null
  assigned_username?: string
  assigned_email?: string
  progress?: number
  statut?: string
  membres?: User[]
  dao_id?: number
  created_at?: string
  updated_at?: string
  is_unlocked?: boolean
  is_blocked?: boolean
}

export default function DAOTasks() {
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
    const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('tous')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Permission checks
  const isDaoChef = user && daoInfo && user.id === daoInfo.chef_id
  const isAdmin = user && user.role_id === 2
  const isChefProjetRole = user && user.role_id === 3
  const canAssignTasks = isDaoChef || isAdmin || isChefProjetRole
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

      // Charger les tâches, les membres d'équipe du DAO, les assignations et les infos du DAO
      const [tasksRes, teamRes, assignmentsRes, daoRes] = await Promise.all([
        apiGet(API_ENDPOINTS.DAO_TASKS(id!)),
        apiGet(`/team/dao/${id}/team-members`),
        apiGet(`/task-assignment/dao/${id}`),
        apiGet(API_ENDPOINTS.DAO_BY_ID(id!)),
      ])

      if (tasksRes.success) {
        console.log('Tâches reçues:', tasksRes.data?.tasks)
        const loadedTasks = tasksRes.data?.tasks || []
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

      if (assignmentsRes.success) {
        console.log('Assignations reçues:', assignmentsRes.data?.assignments)
        // Mettre à jour les tâches avec les informations d'assignation
        const assignments = assignmentsRes.data?.assignments || []
        const updatedTasks = tasks.map((task: any) => {
          const assignment = assignments.find((a: any) => a.task_id === task.id)
          return {
            ...task,
            assigned_to: assignment?.assigned_to || null,
            assigned_username: assignment?.assigned_username || null,
            assigned_email: assignment?.assigned_email || null,
            assigned_role_id: assignment?.assigned_role_id || null
          }
        })
        setTasks(updatedTasks)
      } else {
        console.error('Erreur chargement assignations:', assignmentsRes.error)
      }

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
      // Utiliser la nouvelle API d'assignation
      const response = await apiPut(`/task-assignment/${taskId}`, { userId })
      
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
    // Find the task to check permissions
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

  // Filtrer les tâches selon la recherche et le statut
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchTerm === '' || 
      task.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.assigned_username && task.assigned_username.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'tous' || task.statut === statusFilter
    
    return matchesSearch && matchesStatus
  })

  
  
  
  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="w-full px-4 pt-6 space-y-5">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Tâches du DAO</h1>
              <p className="text-sm text-slate-500">{daoInfo?.objet || 'Chargement...'}</p>
            </div>
          </div>
          
                  </div>

        
        {/* PROGRESSION DU DAO */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-700">Progression globale du DAO</h2>
              <span className={`text-2xl font-bold ${getProgressTextColor(daoProgress)}`}>{daoProgress}%</span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(daoProgress)}`}
                style={{ width: `${daoProgress}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="text-slate-500">Total</p>
              <p className="text-xl font-bold text-slate-800">{daoStats.total_tasks}</p>
            </div>
            <div>
              <p className="text-slate-500">Assignées</p>
              <p className="text-xl font-bold text-blue-600">{daoStats.assigned_tasks}</p>
            </div>
            <div>
              <p className="text-slate-500">Terminées</p>
              <p className="text-xl font-bold text-green-600">{daoStats.completed_tasks}</p>
            </div>
          </div>
        </div>

        {/* RECHERCHE ET FILTRES */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Rechercher une tâche ou un assigné..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Statut:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              >
                <option value="tous">Tous</option>
                <option value="a_faire">À faire</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── CREATE TASK ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Créer une tache (table task)
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Nom de la tache a enregistrer dans la table task"
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

        {/* ── TASKS TABLE ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6" ref={dropdownRef}>
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Tâches du DAO</h2>

          {loading ? (
            <div className="text-center py-12 text-sm text-slate-400">Chargement...</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full min-w-[1200px] text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 w-16">N°</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 min-w-[400px]">Tâche</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 w-64">Progression</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 w-64">Statut</th>
                    <th className="text-left px-4 py-4 text-xs font-semibold text-slate-500 w-64">Membre assigné</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task, index) => (
                    <tr
                      key={task.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* N° */}
                      <td className="px-4 py-4 text-slate-400 text-xs font-medium">{index + 1}</td>

                      {/* Tâche */}
                      <td className="px-4 py-4 text-slate-700 leading-relaxed font-medium">
                        <div className="flex items-center gap-2">
                          <span>{task.nom}</span>
                          {task.is_blocked && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Bloquée</span>
                          )}
                          {task.is_unlocked && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Disponible</span>
                          )}
                        </div>
                      </td>

                      {/* Progression */}
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-500">
                            {task.progress || 0}%
                          </span>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${getProgressColor(task.progress || 0)}`}
                              style={{ width: `${task.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-4 relative">
                        {task.assigned_to ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Assignée
                          </span>
                        ) : (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenDropdown(openDropdown === task.id ? null : task.id)
                              }}
                              className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            >
                              <span>Assigner</span>
                              <ChevronDown className={`h-3 w-3 transition-transform ${openDropdown === task.id ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {/* Dropdown pour l'assignation */}
                            {openDropdown === task.id && (
                              <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 min-w-[150px]">
                                {(() => {
                                  console.log('Dropdown ouvert, membres disponibles:', users.length, users)
                                  return null
                                })()}
                                {users.length === 0 ? (
                                  <div className="px-3 py-2 text-sm text-slate-500">
                                    Aucun membre disponible
                                  </div>
                                ) : (
                                  users.map((user) => (
                                    <button
                                      key={user.id}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        console.log('Assignation de la tâche', task.id, 'au membre', user.id, user.username)
                                        handleAssign(task.id, user.id)
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                                        {user.username.charAt(0).toUpperCase()}
                                      </div>
                                      <span>{user.username}</span>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Membre assigné */}
                      <td className="px-4 py-4">
                        {task.assigned_to && task.assigned_username ? (
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${colorFor(users.findIndex(u => u.id === task.assigned_to))} flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}>
                              {getInitials(task.assigned_username)}
                            </div>
                            <span className="text-sm text-slate-600 font-medium">{task.assigned_username}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-sm text-slate-400">
                        {searchTerm || statusFilter !== 'tous' ? 'Aucune tâche ne correspond à votre recherche.' : 'Aucune tâche trouvée pour ce DAO.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
