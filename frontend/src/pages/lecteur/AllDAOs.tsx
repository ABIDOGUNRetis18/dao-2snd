import { useEffect, useState } from 'react'
import { Search, ArrowLeft, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

interface DAO {
  [x: string]: string | number | undefined
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
  created_at: string
}

export default function AllDAOsLecteur() {
  const [daos, setDaos] = useState<DAO[]>([])
  const [daoTasks, setDaoTasks] = useState<{[key: number]: any[]}>({})
  const [daoMembers, setDaoMembers] = useState<{[key: number]: any[]}>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDaos()
  }, [])

  const loadDaos = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/dao', {
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
        // Filtrer pour ne pas afficher les DAO archivés (mais afficher les terminés)
        let activeDaos: any[] = []
        
        if (Array.isArray(data.data)) {
          activeDaos = data.data
        } else if (data.data && typeof data.data === 'object') {
          const possibleArrays = Object.values(data.data).filter(Array.isArray)
          if (possibleArrays.length > 0) {
            activeDaos = possibleArrays[0]
          } else {
            activeDaos = []
          }
        }
        
        activeDaos = activeDaos.filter((dao: any) => dao.statut !== 'ARCHIVE')
        setDaos(activeDaos)
        
        // Charger les tâches et les membres pour chaque DAO
        await loadTasksForAllDaos(activeDaos)
        await loadMembersForAllDaos(activeDaos)
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
    
    console.log('[Lecteur - Tous les DAO] Chargement des tâches pour', daos.length, 'DAOs')
    
    for (const dao of daos) {
      try {
        const response = await fetch(`http://localhost:3001/api/tasks?daoId=${dao.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          tasksData[dao.id] = data.data?.tasks || []
          console.log(`DAO ${dao.id}: ${tasksData[dao.id].length} tâches chargées`)
        } else {
          console.warn(`Erreur HTTP pour DAO ${dao.id}:`, response.status)
          tasksData[dao.id] = []
        }
      } catch (error) {
        console.error(`Erreur lors du chargement des tâches pour DAO ${dao.id}:`, error)
        tasksData[dao.id] = []
      }
    }
    
    console.log('[Lecteur - Tous les DAO] Toutes les tâches chargées')
    setDaoTasks(tasksData)
  }

  const loadMembersForAllDaos = async (daos: DAO[]) => {
    const token = localStorage.getItem('token')
    const membersData: {[key: number]: any[]} = {}
    
    for (const dao of daos) {
      try {
        const response = await fetch(`http://localhost:3001/api/dao/${dao.id}/members`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          membersData[dao.id] = data.data.members || []
        }
      } catch (error) {
        console.error(`Erreur lors du chargement des membres pour DAO ${dao.id}:`, error)
        membersData[dao.id] = []
      }
    }
    
    setDaoMembers(membersData)
  }

  // Fonction computeStatus selon la documentation
  const computeStatus = (dao: DAO): { label: string; className: string } => {
    const today = new Date();
    const rawStatut = String(dao.statut || "").toUpperCase();

    // 1. Statut terminé
    if (rawStatut === "TERMINEE" || rawStatut === "TERMINE") {
      return { label: "Terminée", className: "px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800" };
    }

    // 2. Pas de date de dépôt
    if (!dao.date_depot) {
      return { label: "En cours", className: "px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800" };
    }

    // 3. Calcul selon la date d'échéance
    const dateDepot = new Date(dao.date_depot);
    const diffDays = Math.floor((dateDepot.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= 5 || diffDays === 4) {
      return { label: "EN COURS", className: "px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800" };
    }

    if (diffDays <= 3) {
      return { label: "À risque", className: "px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800" };
    }

    return { label: "En cours", className: "px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800" };
  };

  // Statut basé sur la logique de la documentation
  const getDAOStatus = (dao: DAO) => {
    return computeStatus(dao)
  }

  // Calculer le statut basé sur la logique métier simplifiée

  const getProgression = (dao: DAO) => {
    const tasks = daoTasks[dao.id] || []
    if (tasks.length === 0) return 0

    // Calcul de la progression moyenne selon la documentation
    const totalProgress = tasks.reduce((sum: number, task: any) => sum + (task.progress || 0), 0)
    const avgProgress = Math.round(totalProgress / tasks.length)
    
    return avgProgress
  }

  const getProgressionColor = (dao: DAO) => {
    const progress = getProgression(dao)
    // Couleurs selon la documentation
    if (progress === 100) return 'bg-green-600'
    if (progress > 0) return 'bg-blue-600'
    return 'bg-gray-400'
  }

  
  // Filtrage des DAO
  const filteredDaos = daos.filter(dao => {
    const matchesSearch = searchTerm === '' || 
      dao.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.reference.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/lecteur"
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Tous les DAO</h1>
          <p className="text-slate-500 text-sm">
            {filteredDaos.length} DAO trouvé{filteredDaos.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro, objet ou référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* DAO Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="text-slate-500">Chargement...</div>
          </div>
        ) : filteredDaos.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-slate-500">Aucun DAO trouvé.</div>
          </div>
        ) : (
          filteredDaos.map((dao) => (
            <div 
              key={dao.id} 
              className="bg-white rounded-lg border border-slate-200/60 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-blue-400 hover:scale-102 overflow-hidden group"
            >
              {/* En-tête compact */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-slate-900">{dao.numero}</span>
                  <span className={`px-1.5 py-0.5 text-xs font-semibold rounded-full ${getDAOStatus(dao).className}`}>
                    {getDAOStatus(dao).label}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-800 mb-1 truncate">{dao.reference}</h3>
                <p className="text-xs text-slate-600 truncate">{dao.autorite}</p>
              </div>
              
              {/* Informations compactes */}
              <div className="p-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between py-1 px-1.5 bg-slate-50 rounded text-xs">
                    <span className="font-medium text-slate-500">Date:</span>
                    <span className="font-semibold text-slate-700">
                      {dao.date_depot ? new Date(dao.date_depot).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'}) : 'N/D'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-1 px-1.5 bg-slate-50 rounded text-xs">
                    <span className="font-medium text-slate-500">Chef:</span>
                    <span className="font-semibold text-slate-700 truncate">
                      {dao.chef_projet_nom || dao.chef_projet || dao.chef || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-1 px-1.5 bg-slate-50 rounded text-xs">
                    <span className="font-medium text-slate-500">Équipe:</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-slate-400" />
                      <span className="font-semibold text-slate-700">{daoMembers[dao.id]?.length || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-1 px-1.5 bg-slate-50 rounded text-xs">
                    <span className="font-medium text-slate-500">Progression:</span>
                    <div className="flex items-center gap-1">
                      <div className="w-12 bg-slate-200 rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full transition-all duration-300 ${getProgressionColor(dao)}`}
                          style={{ width: `${getProgression(dao)}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-700">{getProgression(dao)}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action compacte */}
              <div className="p-2 border-t border-slate-100 bg-gradient-to-b from-slate-50 to-white">
                <button 
                  className="w-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 text-xs font-medium py-1.5 px-2 rounded transition-all duration-200 flex items-center justify-center gap-1 hover:shadow-md group-hover:from-blue-50 group-hover:to-blue-100 group-hover:text-blue-700"
                  title="Voir les détails"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Détails
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
