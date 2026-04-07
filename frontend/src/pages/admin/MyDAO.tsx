import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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
  { value: '', label: 'Tous les statuts' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'EN_COURS',   label: 'En cours' },
  { value: 'A_RISQUE',   label: 'À risque' },
  { value: 'TERMINEE',   label: 'Terminée' },
  { value: 'ARCHIVE',    label: 'Archivé' },
]

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case 'EN_ATTENTE': return { label: 'En attente', bg: 'bg-yellow-100 text-yellow-700' }
    case 'EN_COURS':   return { label: 'En cours',   bg: 'bg-blue-100 text-blue-700' }
    case 'A_RISQUE':   return { label: 'À risque',   bg: 'bg-red-100 text-red-600' }
    case 'TERMINEE':   return { label: 'Terminée',   bg: 'bg-green-100 text-green-700' }
    case 'ARCHIVE':    return { label: 'Archivé',    bg: 'bg-gray-100 text-gray-500' }
    default:           return { label: statut,       bg: 'bg-gray-100 text-gray-500' }
  }
}

export default function MesDAOs() {
  const navigate = useNavigate()
  const [daos, setDaos] = useState<DAO[]>([])
  const [daoTasks, setDaoTasks] = useState<{[key: number]: any[]}>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState('')
  const [showStatutMenu, setShowStatutMenu] = useState(false)

  useEffect(() => {
    loadDaos()
  }, [])

  const loadDaos = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/dao/mes-daos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        console.error('Erreur lors du chargement des DAO')
        return
      }
      
      const data = await response.json()
      if (data.success) {
        setDaos(data.data.daos || [])
        // Charger les tâches pour chaque DAO
        await loadTasksForAllDaos(data.data.daos || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des DAO:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTasksForAllDaos = async (daos: DAO[]) => {
    const token = localStorage.getItem('token')
    const tasksData: {[key: number]: any[]} = {}
    
    for (const dao of daos) {
      try {
        const response = await fetch(`http://localhost:3001/api/dao/${dao.id}/tasks`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          tasksData[dao.id] = data.data.tasks || []
        }
      } catch (error) {
        console.error(`Erreur lors du chargement des tâches pour DAO ${dao.id}:`, error)
        tasksData[dao.id] = []
      }
    }
    
    setDaoTasks(tasksData)
  }

  // Fonction getDAOStatus - Logique basée sur la progression des tâches
  const getDAOStatus = (dao: DAO) => {
    const tasks = daoTasks[dao.id] || [];
    
    // Si pas de tâches assignées, le DAO ne peut pas être terminé
    if (tasks.length === 0) {
      // Logique basée sur la date de dépôt pour les DAO sans tâches
      if (!dao.date_depot) {
        return { label: "En cours", className: "px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800" };
      }
      
      const dateDepot = new Date(dao.date_depot);
      const today = new Date();
      const diffDays = Math.floor((dateDepot.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 4) {
        return { label: "En cours", className: "px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800" };
      }
      
      if (diffDays <= 3) {
        return { label: "À risque", className: "px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800" };
      }
      
      return { label: "En cours", className: "px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800" };
    }
    
    // Calculer la progression globale basée sur les tâches
    const completedTasks = tasks.filter(task => task.statut === 'termine').length;
    const globalProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    
    // Logique basée sur la progression des tâches
    if (globalProgress === 100) {
      return { label: "Terminée", className: "px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800" };
    }
    
    // Si progression < 100%, utiliser la logique de date pour déterminer "En cours" vs "À risque"
    if (!dao.date_depot) {
      return { label: "En cours", className: "px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800" };
    }
    
    const dateDepot = new Date(dao.date_depot);
    const today = new Date();
    const diffDays = Math.floor((dateDepot.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 4) {
      return { label: "En cours", className: "px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800" };
    }
    
    if (diffDays <= 3) {
      return { label: "À risque", className: "px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800" };
    }
    
    return { label: "En cours", className: "px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800" };
  }

  const filtered = daos.filter(dao => {
    const q = search.toLowerCase()
    const matchSearch =
      dao.numero?.toLowerCase().includes(q) ||
      dao.objet?.toLowerCase().includes(q) ||
      dao.chef_projet_nom?.toLowerCase().includes(q) ||
      dao.autorite?.toLowerCase().includes(q)
    const matchStatut = statutFilter === '' || dao.statut === statutFilter
    return matchSearch && matchStatut
  })

  const activeStatutLabel = STATUTS.find(s => s.value === statutFilter)?.label || 'Tous les statuts'

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-4">

        {/* ── HEADER CARD ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-4 flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-800 flex-shrink-0">Mes DAO</h1>

          <div className="flex-1" />

          {/* Search */}
          <input
            type="text"
            placeholder="Rechercher (n°, objet, équipe...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-72 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition"
          />

          {/* Statut filter */}
          <div className="relative">
            <button
              onClick={() => setShowStatutMenu(v => !v)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              {activeStatutLabel}
              <svg className="h-3.5 w-3.5 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
              </svg>
            </button>

            {showStatutMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20">
                {STATUTS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => { setStatutFilter(s.value); setShowStatutMenu(false) }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 ${
                      statutFilter === s.value ? 'text-blue-600 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── HINT ── */}
        <p className="text-xs text-slate-400 px-1">Cliquer sur une carte pour ouvrir le détail</p>

        {/* ── DAO CARDS ── */}
        {loading ? (
          <div className="text-center py-16 text-sm text-slate-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-slate-400">
            {search || statutFilter ? 'Aucun DAO ne correspond à votre recherche.' : 'Aucun DAO trouvé.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(dao => {
              const badge = getDAOStatus(dao)
              return (
                <div
                  key={dao.id}
                  onClick={() => navigate(`/admin/dao/${dao.id}/tasks`)}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">N° {dao.numero}</h2>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {dao.objet}{dao.reference ? ` - ${dao.reference}` : ''}
                      </p>
                    </div>
                    <span className={badge.className}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-50 my-3" />

                  {/* Bottom row */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Date dépôt</span>
                    <span className="font-semibold text-slate-700">
                      {dao.date_depot
                        ? new Date(dao.date_depot).toLocaleDateString('fr-FR')
                        : '—'}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Chef: <span className="text-slate-700 font-medium">{dao.chef_projet_nom || '—'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Close dropdown on outside click */}
      {showStatutMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowStatutMenu(false)} />
      )}
    </div>
  )
}