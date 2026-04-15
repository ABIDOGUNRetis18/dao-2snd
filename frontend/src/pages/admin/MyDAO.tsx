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
  statut: 'EN_COURS' | 'A_RISQUE' | 'TERMINEE'
}

const STATUTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'EN_COURS',   label: 'En cours' },
  { value: 'A_RISQUE',   label: 'À risque' },
  { value: 'TERMINEE',   label: 'Terminée' },
]


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

  // Statut basé sur la logique simplifiée à 3 statuts
  const getDAOStatus = (dao: DAO) => {
    // Utiliser le statut du DAO si disponible, sinon le calculer
    const status = dao.statut || calculateStatus(dao)
    
    switch (status) {
      case 'EN_COURS':
        return { label: 'En cours', className: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800' }
      case 'A_RISQUE':
        return { label: 'À risque', className: 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800' }
      case 'TERMINEE':
        return { label: 'Terminée', className: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800' }
      default:
        return { label: 'En cours', className: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800' }
    }
  }

  // Calculer le statut basé sur la logique métier simplifiée
  const calculateStatus = (dao: DAO) => {
    const tasks = daoTasks[dao.id] || []
    
    // Si aucune tâche, statut par défaut
    if (tasks.length === 0) {
      return 'EN_COURS'
    }
    
    // Calculer la progression moyenne sur TOUTES les tâches
    const totalProgress = tasks.reduce((sum, task) => 
      sum + Number(task.progress || 0), 0)
    const avgProgress = tasks.length > 0 ? totalProgress / tasks.length : 0
    
    // Compter les tâches complétées (progress = 100 OU statut = 'termine')
    const allCompletedTasks = tasks.filter(task => 
      task.statut === 'termine' || Number(task.progress || 0) >= 100
    )
    
    // TERMINEE : Toutes les tâches sont complétées ET progression moyenne = 100%
    if (allCompletedTasks.length === tasks.length && Math.round(avgProgress) === 100) {
      return 'TERMINEE'
    }
    
    // Logique temporelle pour A_RISQUE (>=3 jours depuis la date de dépôt ET aucune progression)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    
    if (avgProgress === 0 && dao.date_depot && new Date(dao.date_depot) < threeDaysAgo) {
      return 'A_RISQUE'
    }
    
    // Par défaut : EN_COURS
    return 'EN_COURS'
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