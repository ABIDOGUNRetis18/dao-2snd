import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckSquare, Plus, RefreshCw, Calendar, Clock, AlertTriangle, CheckCircle, Timer, Eye, Edit, Trash2, Minus } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { API_ENDPOINTS, apiPut } from '../../config/api'

interface Task {
  id: number
  titre: string
  description: string
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'TERMINEE' | 'EN_RETARD'
  priorite: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE'
  date_echeance: string
  dao_numero: string
  dao_objet: string
  progress?: number
  dao_id?: number
}

const STATUTS = [
  { value: '',           label: 'Tous les statuts' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'EN_COURS',   label: 'En cours' },
  { value: 'TERMINEE',   label: 'Terminée' },
  { value: 'EN_RETARD',   label: 'En retard' },
]

const PRIORITES = [
  { value: '',           label: 'Toutes les priorités' },
  { value: 'BASSE',      label: 'Basse' },
  { value: 'MOYENNE',    label: 'Moyenne' },
  { value: 'HAUTE',      label: 'Haute' },
  { value: 'URGENTE',    label: 'Urgente' },
]

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case 'EN_ATTENTE': return { label: 'En attente', cls: 'bg-gray-100 text-gray-700' }
    case 'EN_COURS':   return { label: 'En cours',   cls: 'bg-blue-100 text-blue-700' }
    case 'TERMINEE':   return { label: 'Terminée',   cls: 'bg-green-100 text-green-700' }
    case 'EN_RETARD':   return { label: 'En retard',   cls: 'bg-red-100 text-red-600' }
    default:            return { label: statut,        cls: 'bg-gray-100 text-gray-500' }
  }
}

const getPrioriteBadge = (priorite: string) => {
  switch (priorite) {
    case 'BASSE':    return { label: 'Basse',    cls: 'bg-gray-100 text-gray-600' }
    case 'MOYENNE':  return { label: 'Moyenne',  cls: 'bg-yellow-100 text-yellow-700' }
    case 'HAUTE':    return { label: 'Haute',    cls: 'bg-orange-100 text-orange-700' }
    case 'URGENTE':  return { label: 'Urgente',  cls: 'bg-red-100 text-red-700' }
    default:         return { label: priorite,  cls: 'bg-gray-100 text-gray-500' }
  }
}

export default function MesTaches() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tasks, setTasks]                     = useState<Task[]>([])
  const [loading, setLoading]                 = useState(true)
  const [search, setSearch]                   = useState('')
  const [statutFilter, setStatutFilter]       = useState('')
  const [prioriteFilter, setPrioriteFilter]   = useState('')
  const [showFilterMenu, setShowFilterMenu]   = useState(false)
  const [refreshing, setRefreshing]           = useState(false)
  const [editingTask, setEditingTask]         = useState<number | null>(null)
  const [taskProgress, setTaskProgress]       = useState<{[key: number]: number}>({})
  const [progressTimeout, setProgressTimeout] = useState<number | null>(null)

  // Check if user can update a task (user must be assigned to the task)
  const canUpdateTask = (task: Task) => {
    // This will be updated when we get proper task assignment data from API
    // For now, we'll assume all tasks in "My Tasks" are assigned to current user
    return true
  }

  useEffect(() => { loadTasks() }, [])

  const loadTasks = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/my-tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      
      const data = await response.json()
      
      // Map the API response to the Task interface
      const mappedTasks: Task[] = data.data.tasks.map((task: any) => ({
        id: task.id,
        titre: task.nom || task.titre || '',
        description: task.description || '',
        statut: task.statut || 'EN_ATTENTE',
        priorite: task.priority || 'MOYENNE',
        date_echeance: task.due_date || new Date().toISOString().split('T')[0],
        dao_numero: task.dao_numero || '',
        dao_objet: task.dao_objet || ''
      }))
      
      setTasks(mappedTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
      setTasks([])
    }
    finally { setLoading(false); setRefreshing(false) }
  }

  const filtered = tasks.filter(task => {
    const q = search.toLowerCase()
    const matchSearch =
      task.titre?.toLowerCase().includes(q) ||
      task.description?.toLowerCase().includes(q) ||
      task.dao_numero?.toLowerCase().includes(q) ||
      task.dao_objet?.toLowerCase().includes(q)
    const matchStatut = statutFilter === '' || task.statut === statutFilter
    const matchPriorite = prioriteFilter === '' || task.priorite === prioriteFilter
    return matchSearch && matchStatut && matchPriorite
  })

  // Fonctions de mise à jour de progression
  const updateTaskProgress = async (taskId: number, progress: number) => {
    try {
      const statut = progress === 100 ? 'termine' : progress > 0 ? 'en_cours' : 'a_faire'
      
      const response = await fetch(`/api/tasks/${taskId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ progress, statut })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTasks(prev => prev.map(task => 
            task.id === taskId 
              ? { ...task, progress, statut: statut.toUpperCase() as any }
              : task
          ))
        }
      } else {
        console.error('Erreur lors de la mise à jour de la progression')
      }
    } catch (error) {
      console.error('Erreur réseau:', error)
    }
  }

  const handleProgressChange = async (taskId: number, delta: number) => {
    const currentProgress = taskProgress[taskId] ?? 0
    const newProgress = Math.max(0, Math.min(100, currentProgress + delta))
    
    // Mise à jour locale immédiate
    setTaskProgress(prev => ({ ...prev, [taskId]: newProgress }))
    
    // Mise à jour en arrière-plan avec debounce
    if (progressTimeout) {
      clearTimeout(progressTimeout)
    }
    
    const timeout = setTimeout(() => {
      updateTaskProgress(taskId, newProgress)
    }, 500) as unknown as number
    
    setProgressTimeout(timeout)
  }

  const handleProgressInput = (taskId: number, value: string) => {
    const progress = Math.max(0, Math.min(100, parseInt(value) || 0))
    setTaskProgress(prev => ({ ...prev, [taskId]: progress }))
  }

  const navigateToTaskDetails = (task: Task) => {
    if (task.dao_id) {
      navigate(`/chef-projet/dao/${task.dao_id}/tasks`)
    }
  }

  const totalTasks = tasks.length
  const enCours = tasks.filter(t => t.statut === 'EN_COURS').length
  const enRetard = tasks.filter(t => t.statut === 'EN_RETARD').length
  const terminees = tasks.filter(t => t.statut === 'TERMINEE').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mes Tâches</h1>
          <p className="text-slate-500 mt-1">Suivez et gérez toutes vos tâches</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <CheckSquare className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-800">{totalTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Terminées</p>
              <p className="text-2xl font-bold text-green-600">{terminees}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher une tâche..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(v => !v)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Timer className="h-4 w-4" />
                Filtrer
              </button>
              {showFilterMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-20">
                    <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</div>
                    {STATUTS.map(s => (
                      <button
                        key={s.value}
                        onClick={() => { setStatutFilter(s.value); setShowFilterMenu(false) }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${
                          statutFilter === s.value ? 'text-green-600 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 my-1"></div>
                    <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Priorité</div>
                    {PRIORITES.map(p => (
                      <button
                        key={p.value}
                        onClick={() => { setPrioriteFilter(p.value); setShowFilterMenu(false) }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${
                          prioriteFilter === p.value ? 'text-green-600 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => loadTasks(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Rafraîchir
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Tâche</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">DAO</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Priorité</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Progression</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Échéance</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mr-2"></div>
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    {search || statutFilter || prioriteFilter ? 'Aucune tâche ne correspond à votre recherche.' : 'Aucune tâche trouvée.'}
                  </td>
                </tr>
              ) : filtered.map(task => {
                const statutBadge = getStatutBadge(task.statut)
                const prioriteBadge = getPrioriteBadge(task.priorite)
                const isOverdue = new Date(task.date_echeance) < new Date() && task.statut !== 'TERMINEE'
                
                return (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{task.titre}</p>
                        <p className="text-sm text-slate-500 truncate max-w-xs">{task.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{task.dao_numero}</p>
                        <p className="text-xs text-slate-500 truncate max-w-xs">{task.dao_objet}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${prioriteBadge.cls}`}>
                        {prioriteBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {editingTask === task.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleProgressChange(task.id, -10)}
                            className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={taskProgress[task.id] ?? (task.progress || 0)}
                            onChange={(e) => handleProgressInput(task.id, e.target.value)}
                            onBlur={() => {
                              updateTaskProgress(task.id, taskProgress[task.id] ?? (task.progress || 0))
                              setEditingTask(null)
                            }}
                            className="w-16 px-2 py-1 text-sm border border-slate-200 rounded text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <button
                            onClick={() => handleProgressChange(task.id, 10)}
                            className="p-1 text-green-500 hover:text-green-700 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center gap-2 cursor-pointer hover:text-green-600 transition-colors"
                          onClick={() => {
                            setEditingTask(task.id)
                            setTaskProgress(prev => ({ ...prev, [task.id]: task.progress || 0 }))
                          }}
                        >
                          <div className="w-16 bg-slate-200 rounded-full h-2">
                            <div 
                              className="h-full rounded-full bg-green-500 transition-all duration-300"
                              style={{ width: `${task.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{task.progress || 0}%</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                          {new Date(task.date_echeance).toLocaleDateString('fr-FR')}
                        </span>
                        {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statutBadge.cls}`}>
                        {statutBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigateToTaskDetails(task)}
                          className="p-1 text-slate-400 hover:text-green-600 transition-colors"
                          title="Voir les détails du DAO"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Modifier la progression"
                          onClick={() => {
                            setEditingTask(task.id)
                            setTaskProgress(prev => ({ ...prev, [task.id]: task.progress || 0 }))
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
