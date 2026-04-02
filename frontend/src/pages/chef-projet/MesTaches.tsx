import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckSquare, Plus, RefreshCw, Calendar, Clock, AlertTriangle, CheckCircle, Timer, Eye, Edit, Trash2 } from 'lucide-react'

interface Task {
  id: number
  titre: string
  description: string
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'TERMINEE' | 'EN_RETARD'
  priorite: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE'
  date_echeance: string
  dao_numero: string
  dao_objet: string
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
  const [tasks, setTasks]                     = useState<Task[]>([])
  const [loading, setLoading]                 = useState(true)
  const [search, setSearch]                   = useState('')
  const [statutFilter, setStatutFilter]       = useState('')
  const [prioriteFilter, setPrioriteFilter]   = useState('')
  const [showFilterMenu, setShowFilterMenu]   = useState(false)
  const [refreshing, setRefreshing]           = useState(false)

  useEffect(() => { loadTasks() }, [])

  const loadTasks = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const token = localStorage.getItem('token')
      // Simuler des données pour l'instant
      const mockTasks: Task[] = [
        {
          id: 1,
          titre: "Préparer l'offre technique",
          description: "Rédiger le document technique pour le DAO-2026-001",
          statut: 'EN_COURS',
          priorite: 'HAUTE',
          date_echeance: '2026-04-05',
          dao_numero: 'DAO-2026-001',
          dao_objet: 'Test DAO Creation'
        },
        {
          id: 2,
          titre: "Réunion avec l'équipe",
          description: "Présenter les objectifs du projet",
          statut: 'EN_ATTENTE',
          priorite: 'MOYENNE',
          date_echeance: '2026-04-03',
          dao_numero: 'DAO-2026-002',
          dao_objet: 'test2'
        },
        {
          id: 3,
          titre: "Validation documents",
          description: "Faire valider les documents par la direction",
          statut: 'EN_RETARD',
          priorite: 'URGENTE',
          date_echeance: '2026-03-30',
          dao_numero: 'DAO-2026-001',
          dao_objet: 'Test DAO Creation'
        }
      ]
      setTasks(mockTasks)
    } catch { /* silent */ }
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
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
          <Plus className="h-4 w-4" />
          Nouvelle tâche
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">En cours</p>
              <p className="text-2xl font-bold text-blue-600">{enCours}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">En retard</p>
              <p className="text-2xl font-bold text-red-600">{enRetard}</p>
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
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Échéance</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mr-2"></div>
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
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
                          className="p-1 text-slate-400 hover:text-green-600 transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
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
