import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, Users, CheckSquare, MessageSquare, SlidersHorizontal, RefreshCw, Calendar, Hourglass, AlertTriangle } from 'lucide-react'

interface DAO {
  id: number
  numero: string
  objet: string
  reference: string
  date_depot: string
  autorite: string
  chef_projet_nom: string
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'A_RISQUE' | 'TERMINEE' | 'ARCHIVE'
}

const STATUTS = [
  { value: '',           label: 'Tous les statuts' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'EN_COURS',   label: 'En cours' },
  { value: 'A_RISQUE',   label: 'À risque' },
  { value: 'TERMINEE',   label: 'Terminée' },
  { value: 'ARCHIVE',    label: 'Archivé' },
]

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case 'EN_ATTENTE': return { label: 'En attente', cls: 'bg-yellow-100 text-yellow-700' }
    case 'EN_COURS':   return { label: 'En cours',   cls: 'bg-blue-100 text-blue-700' }
    case 'A_RISQUE':   return { label: 'À risque',   cls: 'bg-red-100 text-red-600' }
    case 'TERMINEE':   return { label: 'Terminée',   cls: 'bg-green-100 text-green-700' }
    case 'ARCHIVE':    return { label: 'Archivé',    cls: 'bg-gray-100 text-gray-500' }
    default:           return { label: statut,       cls: 'bg-gray-100 text-gray-500' }
  }
}

// Navigation basée sur les routes accessibles pour un chef de projet
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',   icon: LayoutDashboard, path: '/chef-projet' },
  { id: 'my-daos', label: 'Mes DAO',     icon: FileText,        path: '/chef-projet' },
  { id: 'my-tasks', label: 'Mes tâches',  icon: CheckSquare,     path: '/chef-projet' },
]

export default function ChefProjet() {
  const navigate  = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  const [daos, setDaos]                     = useState<DAO[]>([])
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [statutFilter, setStatutFilter]     = useState('')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [refreshing, setRefreshing]         = useState(false)

  useEffect(() => { loadDaos() }, [])

  const loadDaos = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3001/api/dao/mes-daos', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) setDaos(data.data.daos || [])
      }
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false) }
  }

  const filtered = daos.filter(dao => {
    const q = search.toLowerCase()
    const matchSearch =
      dao.numero?.toLowerCase().includes(q) ||
      dao.objet?.toLowerCase().includes(q) ||
      dao.autorite?.toLowerCase().includes(q) ||
      dao.chef_projet_nom?.toLowerCase().includes(q)
    const matchStatut = statutFilter === '' || dao.statut === statutFilter
    return matchSearch && matchStatut
  })

  const totalAssignes = daos.length
  const enCours       = daos.filter(d => d.statut === 'EN_COURS').length
  const aRisque       = daos.filter(d => d.statut === 'A_RISQUE').length

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">

      {/* ── SIDEBAR ── */}
      <aside className="w-44 bg-white border-r border-slate-100 flex flex-col py-5 flex-shrink-0">
        <div className="px-4 mb-7">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <div className="grid grid-cols-2 gap-0.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 bg-white rounded-sm" />
              ))}
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 px-2">
          {NAV_ITEMS.map(item => {
            const active = currentPath === item.path
            const Icon   = item.icon
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors text-left w-full ${
                  active
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 px-6 py-6 space-y-5 overflow-auto">

        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-4 flex items-center gap-4">
          <h1 className="text-base font-bold text-slate-800 flex-shrink-0">Mes DAO</h1>
          <div className="flex-1" />

          <input
            type="text"
            placeholder="Rechercher (n°, objet, équipe...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition"
          />

          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(v => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtrer
            </button>
            {showFilterMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20">
                  {STATUTS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => { setStatutFilter(s.value); setShowFilterMenu(false) }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 ${
                        statutFilter === s.value ? 'text-blue-600 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors">
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <div className="bg-white px-8 py-5 flex items-center gap-4 border-r border-slate-200">
            <Calendar className="h-9 w-9 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Total assignés</p>
              <p className="text-3xl font-bold text-slate-700">{totalAssignes}</p>
            </div>
          </div>

          <div className="bg-yellow-50 px-8 py-5 flex items-center gap-4 border-r border-yellow-100">
            <Hourglass className="h-9 w-9 text-yellow-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-yellow-600 mb-0.5">En cours</p>
              <p className="text-3xl font-bold text-yellow-600">{enCours}</p>
            </div>
          </div>

          <div className="bg-red-50 px-8 py-5 flex items-center gap-4">
            <AlertTriangle className="h-9 w-9 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-red-500 mb-0.5">À risque</p>
              <p className="text-3xl font-bold text-red-500">{aRisque}</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Tous mes DAO
            </span>
            <button
              onClick={() => loadDaos(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Rafraîchir
            </button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Nom</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Référence</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Autorité contractante</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Date de clôture</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-sm text-slate-400">Chargement...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-sm text-slate-400">
                    {search || statutFilter ? 'Aucun DAO ne correspond à votre recherche.' : 'Aucun DAO assigné.'}
                  </td>
                </tr>
              ) : filtered.map(dao => {
                const badge = getStatutBadge(dao.statut)
                return (
                  <tr
                    key={dao.id}
                    onClick={() => navigate(`/admin/dao/${dao.id}`)}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-800">{dao.numero}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{dao.objet}</p>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{dao.reference || '—'}</td>
                    <td className="px-6 py-3.5 text-slate-600">{dao.autorite || '—'}</td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {dao.date_depot ? new Date(dao.date_depot).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}