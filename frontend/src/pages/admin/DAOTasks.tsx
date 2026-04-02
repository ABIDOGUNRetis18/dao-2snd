import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ChevronDown, Check, X, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

interface User {
  id: number
  username: string
  url_photo?: string
}

interface TaskRow {
  id: number
  id_task: number
  nom: string
  assigned_to: number | null
  assigned_username?: string
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
  const dropdownRef = useRef<HTMLDivElement>(null)

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
      console.log('🔄 Chargement des tâches et membres assignables...')
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` }

      // Charger les tâches et les membres assignables au DAO
      const [tasksRes, membersRes] = await Promise.all([
        fetch(`http://localhost:3001/api/dao/${id}/tasks`, { headers }),
        fetch(`http://localhost:3001/api/dao/${id}/members`, { headers }),
      ])

      if (tasksRes.ok) {
        const d = await tasksRes.json()
        console.log('📋 Tâches reçues:', d.data.tasks)
        if (d.success) setTasks(d.data.tasks || [])
      } else {
        console.error('❌ Erreur chargement tâches:', await tasksRes.json())
      }
      
      if (membersRes.ok) {
        const d = await membersRes.json()
        console.log('👥 Membres assignables reçus:', d.data.members)
        if (d.success) {
          // Inclure tous les membres assignables (admin, chef projet, membres d'équipe)
          setUsers(d.data.members || [])
        }
      } else {
        console.error('❌ Erreur chargement membres:', await membersRes.json())
        // Fallback: charger tous les utilisateurs
        const usersRes = await fetch(`http://localhost:3001/api/users`, { headers })
        if (usersRes.ok) {
          const d = await usersRes.json()
          if (d.success) setUsers(d.data.users || [])
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error)
    } finally { 
      setLoading(false) 
    }
  }

  const handleSaveTask = async () => {
    if (!newTaskName.trim()) return
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      console.log('🔄 Création de la tâche:', newTaskName.trim())
      
      const res = await fetch(`http://localhost:3001/api/tasks/dao/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nom: newTaskName.trim() }),
      })
      
      const responseData = await res.json()
      console.log('📡 Réponse de l\'API:', responseData)
      
      if (res.ok && responseData.success) {
        console.log('✅ Tâche créée avec succès dans la base:', responseData.data.task)
        setNewTaskName('')
        // Attendre un peu pour s'assurer que la base est mise à jour
        setTimeout(() => {
          loadAll()
        }, 500)
      } else {
        console.error('❌ Erreur lors de la création:', responseData)
        alert('Erreur lors de la création: ' + (responseData.message || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error)
      alert('Erreur réseau: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return
    
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (res.ok) {
        console.log('✅ Tâche supprimée avec succès')
        loadAll()
      } else {
        const errorData = await res.json()
        console.error('❌ Erreur lors de la suppression:', errorData)
        alert('Erreur lors de la suppression: ' + (errorData.message || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error)
      alert('Erreur réseau: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    }
  }

  const handleAssign = async (taskId: number, userId: number | null) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`http://localhost:3001/api/tasks/${taskId}/assign`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assigned_to: userId }),
      })
      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, assigned_to: userId, assigned_username: users.find(u => u.id === userId)?.username }
          : t
      ))
    } catch { /* silent */ }
    setOpenDropdown(null)
  }

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

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
