import { useState, useEffect } from 'react'
import { ArrowLeft, User, MessageCircle, Clock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

interface Task {
  id: number
  titre: string
  statut: 'a_faire' | 'en_cours' | 'termine'
  priorite: 'basse' | 'moyenne' | 'haute'
  date_echeance?: string
  assigned_to?: number
  assigned_username?: string
  assigned_email?: string
  progress?: number
}

interface DAO {
  id: number
  numero: string
  objet: string
  reference: string
  date_depot: string
  autorite: string
  chef_projet_nom: string
  groupement: string
  nom_partenaire?: string
  statut: string
  description: string
  type_dao?: string
  created_at: string
}

export default function DAODetails() {
  const { id } = useParams<{ id: string }>()
  const [dao, setDao] = useState<DAO | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedTask, setExpandedTask] = useState<number | null>(null)

  useEffect(() => {
    if (id) {
      loadDao()
      loadTasks()
    }
  }, [id])

  const loadDao = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/dao/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) { setError('DAO non trouvé'); return }
      const data = await response.json()
      if (data.success) setDao(data.data.dao)
    } catch {
      setError('Erreur lors du chargement du DAO')
    } finally {
      setLoading(false)
    }
  }

  const loadTasks = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/dao/${id}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) setTasks(data.data.tasks || [])
      }
    } catch {
      // silent fail
    }
  }

  // Grouper les tâches par membre assigné
  const tasksByMember = tasks.reduce((acc, task) => {
    if (task.assigned_to && task.assigned_username) {
      const memberKey = `${task.assigned_to}-${task.assigned_username}`;
      if (!acc[memberKey]) {
        acc[memberKey] = {
          id: task.assigned_to,
          username: task.assigned_username,
          email: task.assigned_email,
          tasks: []
        }
      }
      acc[memberKey].tasks.push(task)
    } else {
      // Tâches non assignées
      if (!acc['unassigned']) {
        acc['unassigned'] = {
          id: null,
          username: 'Non assignées',
          email: null,
          tasks: []
        }
      }
      acc['unassigned'].tasks.push(task)
    }
    return acc
  }, {} as Record<string, any>)

  // Calculer la progression pour chaque membre
  const membersWithProgress = Object.values(tasksByMember).map(member => ({
    ...member,
    totalTasks: member.tasks.length,
    completedTasks: member.tasks.filter((t: any) => t.statut === 'termine').length,
    inProgressTasks: member.tasks.filter((t: any) => t.statut === 'en_cours').length,
    averageProgress: member.tasks.length > 0 
      ? Math.round(member.tasks.reduce((sum: number, t: any) => sum + (t.progress || 0), 0) / member.tasks.length)
      : 0
  }))

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE': return { label: 'En attente', bg: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' }
      case 'EN_COURS':   return { label: 'En cours',   bg: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' }
      case 'TERMINEE':   return { label: 'Terminée',   bg: 'bg-green-100 text-green-700', dot: 'bg-green-500' }
      case 'A_RISQUE':   return { label: 'À risque',   bg: 'bg-red-100 text-red-700',     dot: 'bg-red-500' }
      case 'ARCHIVE':    return { label: 'Archivé',    bg: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' }
      default:           return { label: statut,       bg: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' }
    }
  }

  const getTaskStatutBadge = (statut: string) => {
    switch (statut) {
      case 'termine':  return { label: 'Terminé',   cls: 'bg-green-100 text-green-700' }
      case 'en_cours': return { label: 'En cours',  cls: 'bg-blue-100 text-blue-700' }
      default:         return { label: 'À faire',   cls: 'bg-slate-100 text-slate-600' }
    }
  }

  const getPrioriteBadge = (priorite: string) => {
    switch (priorite) {
      case 'haute':  return { label: 'Haute',  cls: 'bg-red-50 text-red-600' }
      case 'moyenne':return { label: 'Moyenne',cls: 'bg-orange-50 text-orange-600' }
      default:       return { label: 'Basse',  cls: 'bg-green-50 text-green-600' }
    }
  }

  const completedTasks = tasks.filter(t => t.statut === 'termine').length
  const totalTasks = tasks.length
  const globalProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-400 text-sm">Chargement...</div>
    </div>
  )

  if (error || !dao) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-red-500 text-sm">{error || 'DAO non trouvé'}</div>
    </div>
  )

  const badge = getStatutBadge(dao.statut)

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── HEADER CARD ── */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">

          {/* Back */}
          <Link to="/admin/all-daos"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Link>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-800 truncate">{dao.numero}</h1>
            <p className="text-sm text-slate-400 truncate">{dao.objet}</p>
          </div>

          {/* Chef de projet */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <User className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400 leading-none">Chef de projet</p>
              <p className="text-sm font-semibold text-slate-700">{dao.chef_projet_nom || '—'}</p>
            </div>
          </div>

          {/* Statut */}
          <div className="flex-shrink-0 text-center">
            <p className="text-xs text-slate-400 mb-1">Statut</p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
          </div>

          {/* Chat icon */}
          <button className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-xl transition-colors flex-shrink-0">
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">

        {/* Progression globale */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600">{globalProgress}%</span>
            </div>
            <h2 className="text-base font-bold text-slate-800">Progression globale du DAO</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{completedTasks} / {totalTasks} tâches terminées</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${globalProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Date de dépôt : {new Date(dao.date_depot).toLocaleDateString('fr-FR')}</span>
              <span>Progression : {globalProgress}%</span>
            </div>
          </div>
        </div>

        {/* Progression des tâches par membre */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-base font-bold text-slate-800 mb-5">Progression des tâches par membre</h2>

          {membersWithProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <Clock className="h-5 w-5 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500 font-medium">Aucune tâche trouvée pour ce DAO.</p>
              <p className="text-xs text-slate-400 mt-1">
                Les 15 tâches standards devraient être créées automatiquement lors de la création du DAO.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {membersWithProgress.map((member, index) => (
                <div key={member.id || `unassigned-${index}`} className="border border-slate-100 rounded-xl p-4">
                  {/* Header du membre */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {member.username ? member.username.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{member.username}</h3>
                        {member.email && <p className="text-xs text-slate-500">{member.email}</p>}
                      </div>
                    </div>
                    
                    {/* Statistiques */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-800">{member.averageProgress}%</div>
                      <div className="text-xs text-slate-500">Progression moyenne</div>
                    </div>
                  </div>

                  {/* Barre de progression globale */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                      <span>{member.completedTasks} / {member.totalTasks} tâches terminées</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                        style={{ width: `${member.averageProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Tâches individuelles */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Détail des tâches</span>
                    </div>
                    {member.tasks.map((task: any, taskIndex) => {
                      const tBadge = getTaskStatutBadge(task.statut)
                      const taskProgress = task.statut === 'termine' ? 100 : task.statut === 'en_cours' ? (task.progress || 50) : 0

                      return (
                        <div key={task.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono text-slate-400 w-5">{String(taskIndex + 1).padStart(2, '0')}</span>
                              <span className="text-sm font-medium text-slate-700">{task.nom}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${tBadge.cls}`}>
                                {tBadge.label}
                              </span>
                              <span className="text-xs text-slate-600">{taskProgress}%</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}