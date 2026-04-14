import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ChevronDown, Check, X, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_ENDPOINTS, apiGet, apiPost, apiPut, apiDelete } from '../../config/api'

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

export default function DAOTasks() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

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
      console.log('Chargement des tâches et membres du DAO...')

      // Charger les tâches, les membres du DAO et les infos du DAO
      const [tasksRes, membersRes, daoRes] = await Promise.all([
        apiGet(API_ENDPOINTS.DAO_TASKS(id!)),
        apiGet(API_ENDPOINTS.DAO_MEMBERS(id!)),
        apiGet(`http://localhost:3001/api/dao/${id}`),
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
      
      if (membersRes.success) {
        console.log('Membres du DAO reçus:', membersRes.data?.members)
        setUsers(membersRes.data?.members || [])
      } else {
        console.error('Erreur chargement membres:', membersRes.error)
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
      console.log('🔄 Création de la tâche:', newTaskName.trim())
      
      const responseData = await apiPost(
        API_ENDPOINTS.TASK_CREATE_DAO(id!),
        { nom: newTaskName.trim() }
      )
      
      console.log('📡 Réponse de l\'API:', responseData)
      
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
    try {
      await apiPut(
        API_ENDPOINTS.TASK_ASSIGN(taskId),
        { assigned_to: userId }
      )
      const updatedTasks = tasks.map(t =>
        t.id === taskId
          ? { ...t, assigned_to: userId, assigned_username: users.find(u => u.id === userId)?.username }
          : t
      )
      setTasks(updatedTasks)

      recalculateDaoMetrics(updatedTasks)
    } catch { /* silent */ }
    setOpenDropdown(null)
  }

  const handleUpdateProgress = async (taskId: number, progress: number) => {
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

        {/* ── HEADER ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
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

        {/* ── PROGRESSION DU DAO ── */}
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
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Taches du DAO</h2>

          {loading ? (
            <div className="text-center py-12 text-sm text-slate-400">Chargement...</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-12">N°</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Tache</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-40">Progression</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-48">Assigner à</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-48">Membres assignés</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-16">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, index) => (
                    <tr
                      key={task.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* N° */}
                      <td className="px-4 py-3 text-slate-400 text-xs">{index + 1}</td>

                      {/* Tâche */}
                      <td className="px-4 py-3 text-slate-700 leading-snug">{task.nom}</td>

                      {/* Progression */}
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            
                            <span className={`text-xs font-bold w-10 text-right ${getProgressTextColor(task.progress || 0)}`}>
                              {task.progress || 0}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${getProgressColor(task.progress || 0)}`}
                              style={{ width: `${task.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Assigner à — dropdown */}
                      <td className="px-4 py-3 relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === task.id ? null : task.id)}
                          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                        >
                          <span className={task.assigned_to ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                            {task.assigned_username || 'Non assignée'}
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        </button>

                        {/* Dropdown */}
                        {openDropdown === task.id && (
                          <div className="absolute left-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-30">
                            {/* Unassign option */}
                            <button
                              onClick={() => handleAssign(task.id, null)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                              Non assignée
                            </button>
                            <div className="border-t border-slate-50 my-1" />
                            {users.map((user, i) => (
                              <button
                                key={user.id}
                                onClick={() => handleAssign(task.id, user.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <div className={`w-6 h-6 rounded-full ${colorFor(i)} flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}>
                                  {getInitials(user.username)}
                                </div>
                                <span className="truncate">{user.username}</span>
                                {task.assigned_to === user.id && (
                                  <Check className="h-3.5 w-3.5 text-blue-500 ml-auto flex-shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Membres assignés — avatar */}
                      <td className="px-4 py-3">
                        {task.assigned_to && task.assigned_username ? (
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full ${colorFor(users.findIndex(u => u.id === task.assigned_to))} flex items-center justify-center text-white text-xs font-medium`}>
                              {getInitials(task.assigned_username)}
                            </div>
                            <span className="text-sm text-slate-600 truncate">{task.assigned_username}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>

                      {/* Actions — bouton suppression */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer cette tâche"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-sm text-slate-400">
                        Aucune tâche trouvée pour ce DAO.
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
