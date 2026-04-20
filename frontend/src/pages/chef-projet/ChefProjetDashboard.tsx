import { useState, useEffect } from 'react'
import { SlidersHorizontal, RefreshCw } from 'lucide-react'

interface DAO {
  id: number
  numero: string
  objet: string
  reference: string
  date_depot: string
  autorite: string
  chef_projet_nom: string
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'A_RISQUE' | 'TERMINEE' | 'ARCHIVE'
  progression?: number
  groupement: string
  nom_partenaire?: string
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
    case 'A_RISQUE':   return { label: 'À risque',   cls: 'bg-red-600 text-white' }
    case 'TERMINEE':   return { label: 'Terminée',   cls: 'bg-green-100 text-green-700' }
    case 'ARCHIVE':    return { label: 'Archivé',    cls: 'bg-gray-100 text-gray-500' }
    default:           return { label: statut,       cls: 'bg-gray-100 text-gray-500' }
  }
}

export default function ChefProjetDashboard() {
  const [daos, setDaos]                     = useState<DAO[]>([])
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [statutFilter, setStatutFilter]     = useState('')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [refreshing, setRefreshing]         = useState(false)
  const [currentUserId, setCurrentUserId]   = useState<number | null>(null)

  useEffect(() => { 
    // Récupérer l'utilisateur connecté pour filtrer ses DAOs
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        setCurrentUserId(Number(parsed.id))
      } catch (error) {
        console.error('Erreur parsing utilisateur:', error)
      }
    }
    
    loadDaos() 
    
    // Rafraîchissement automatique toutes les 30 secondes
    const interval = setInterval(() => {
      loadDaos(true)
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadDaos = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const token = localStorage.getItem('token')
      
      // Utiliser l'API pour récupérer les DAOs assignés à ce chef de projet
      let daoUrl = 'http://localhost:3001/api/dao/mes-daos'
      
      // Si on a l'ID utilisateur, utiliser l'API filtrée par chefId
      if (currentUserId) {
        daoUrl = `http://localhost:3001/api/dao?chefId=${currentUserId}`
      }
      
      const res = await fetch(daoUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          let daoList = data.data.daos || []
          
          // Si on utilise l'API sans chefId, filtrer manuellement pour n'afficher que les DAOs du chef
          if (!currentUserId) {
            const storedUser = localStorage.getItem("user")
            if (storedUser) {
              try {
                const parsed = JSON.parse(storedUser)
                const userId = Number(parsed.id)
                daoList = daoList.filter((dao: any) => Number(dao.chef_id) === userId)
              } catch (error) {
                console.error('Erreur parsing utilisateur pour filtrage:', error)
              }
            }
          }
          
          // Pour chaque DAO, calculer la progression
          const daosWithProgress = await Promise.all(
            daoList.map(async (dao: any) => {
              try {
                const tasksRes = await fetch(`http://localhost:3001/api/task-assignment/dao/${dao.id}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                })
                const tasksData = await tasksRes.json()
                const tasks = tasksData.data?.assignments || []
                
                if (tasks.length > 0) {
                  const totalProgress = tasks.reduce((sum: number, task: any) => sum + (task.progress || 0), 0)
                  const averageProgress = Math.round(totalProgress / tasks.length)
                  return { ...dao, progression: averageProgress }
                }
                return { ...dao, progression: 0 }
              } catch (error) {
                console.error('Erreur lors du chargement de la progression pour le DAO', dao.id, error)
                return { ...dao, progression: 0 }
              }
            })
          )
          
          setDaos(daosWithProgress)
        }
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

  // Statistiques calculées comme l'admin
  const stats = {
    totalDaos: daos.length,
    completedDaos: daos.filter(d => d.statut === 'TERMINEE').length,
    inProgressDaos: daos.filter(d => d.statut === 'EN_COURS').length,
    atRiskDaos: daos.filter(d => d.statut === 'A_RISQUE').length
  };

  
  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-4 flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-800 flex-shrink-0">Mes DAO</h1>
        <div className="flex-1" />

        <input
          type="text"
          placeholder="Rechercher (n°, objet, équipe...)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-300 transition"
        />

        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors"
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
                      statutFilter === s.value ? 'text-green-600 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => loadDaos(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-blue-500 p-6 rounded-xl border-b-4 border-blue-600 flex justify-between items-start shadow-lg">
          <div>
            <p className="text-xs font-bold text-blue-100 mb-1">Total DAOs</p>
            <h3 className="text-3xl font-headline font-bold text-white">{stats.totalDaos}</h3>
          </div>
          <div className="p-3 bg-white/20 text-white rounded-lg backdrop-blur-sm">
            <span className="material-symbols-outlined">calendar_today</span>
          </div>
        </div>
        {/* Card 2 */}
        <div className="bg-green-500 p-6 rounded-xl border-b-4 border-green-600 flex justify-between items-start shadow-lg">
          <div>
            <p className="text-xs font-bold text-green-100 mb-1">Terminés</p>
            <h3 className="text-3xl font-headline font-bold text-white">{stats.completedDaos}</h3>
          </div>
          <div className="p-3 bg-white/20 text-white rounded-lg backdrop-blur-sm">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
        </div>
        {/* Card 3 */}
        <div className="bg-orange-400 p-6 rounded-xl border-b-4 border-orange-500 flex justify-between items-start shadow-lg">
          <div>
            <p className="text-xs font-bold text-orange-100 mb-1">En cours</p>
            <h3 className="text-3xl font-headline font-bold text-white">{stats.inProgressDaos}</h3>
          </div>
          <div className="p-3 bg-white/20 text-white rounded-lg backdrop-blur-sm">
            <span className="material-symbols-outlined">hourglass_empty</span>
          </div>
        </div>
        {/* Card 4 */}
        <div className="bg-red-600 p-6 rounded-xl border-b-4 border-red-800 flex justify-between items-start shadow-lg">
          <div>
            <p className="text-xs font-bold text-red-100 mb-1">À risque</p>
            <h3 className="text-3xl font-headline font-bold text-white">{stats.atRiskDaos}</h3>
          </div>
          <div className="p-3 bg-white/20 text-white rounded-lg backdrop-blur-sm">
            <span className="material-symbols-outlined">error</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Tous mes DAO
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Numéro</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Objet</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date Dépôt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Référence</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Autorité</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Groupement</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-sm text-slate-400">Chargement...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-sm text-slate-400">
                    {search || statutFilter ? 'Aucun DAO ne correspond à votre recherche.' : 'Aucun DAO assigné.'}
                  </td>
                </tr>
              ) : filtered.map(dao => {
                const badge = getStatutBadge(dao.statut)
                
                return (
                  <tr key={dao.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{dao.numero}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{dao.objet}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {new Date(dao.date_depot).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{dao.reference}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{dao.autorite}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {dao.groupement === "oui" ? (
                        dao.nom_partenaire ? (
                          <span style={{ whiteSpace: "pre-wrap" }}>
                            {dao.nom_partenaire.replace(/,/g, ",\n")}
                          </span>
                        ) : (
                          "-"
                        )
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
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
