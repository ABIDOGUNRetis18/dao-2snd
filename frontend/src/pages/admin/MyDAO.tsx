import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Dao {
  id: number;
  numero: string;
  reference: string;
  autorite: string;
  date_depot?: string;
  statut?: string;
  chef_projet?: string;
  chef_id?: number;
}



export default function MyDAO() {
  const navigate = useNavigate()
  const [daos, setDaos] = useState<Dao[]>([])
  const [daoTasks, setDaoTasks] = useState<{[key: number]: any[]}>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statutFilter, setStatutFilter] = useState('')
  const [showStatutMenu, setShowStatutMenu] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)


  useEffect(() => {
    // 1. Récupération utilisateur depuis localStorage
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      console.error('[MyDAO] Aucun utilisateur trouvé dans localStorage')
      setError('Utilisateur non connecté')
      setLoading(false)
      return
    }
    
    try {
      // 2. Parsing des données
      const parsed = JSON.parse(storedUser)
      const userId = Number(parsed.id)
      const roleId = Number(parsed.role_id)
      
      // 3. Validation que l'ID utilisateur est valide
      if (!userId || isNaN(userId)) {
        console.error('[MyDAO] ID utilisateur invalide:', parsed.id)
        setError('ID utilisateur invalide')
        setLoading(false)
        return
      }
      
      console.log('[MyDAO] User ID:', userId, 'Role ID:', roleId)
      setCurrentUserId(userId)
      
      // 4. Charger les DAOs après validation
      loadDaos(userId)
    } catch (error) {
      console.error('[MyDAO] Erreur parsing utilisateur:', error)
      setError('Erreur de lecture des données utilisateur')
      setLoading(false)
    }
  }, [])

  const loadDaos = async (userId: number) => {
    try {
      setError(null)
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('Token d\'authentification manquant')
        setLoading(false)
        return
      }
      
      // Récupérer tous les DAOs
      const response = await fetch('http://localhost:3001/api/dao', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        console.error('Erreur lors du chargement des DAO')
        setError('Erreur lors du chargement des DAOs')
        return
      }
      
      const data = await response.json()
      if (data.success) {
        const allDaos = data.data.daos || []
        
        // 4. Filtrage personnalisé : Number(dao.chef_id) === Number(currentUserId)
        const myDaos = allDaos.filter((dao: any) => Number(dao.chef_id) === Number(userId))
        
        console.log('[MyDAO] DAOs filtrés pour utilisateur', userId, ':', myDaos.length, 'sur', allDaos.length)
        setDaos(myDaos)
        
        // Charger les tâches pour chaque DAO
        await loadTasksForAllDaos(myDaos)
      } else {
        setError('Erreur de données du serveur')
      }
    } catch (error) {
      console.error('Erreur lors du chargement des DAO:', error)
      setError('Erreur réseau lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const loadTasksForAllDaos = async (daos: Dao[]) => {
    const token = localStorage.getItem('token')
    const tasksData: {[key: number]: any[]} = {}
    
    try {
      // Charger les tâches assignées pour chaque DAO
      for (const dao of daos) {
        try {
          const response = await fetch(`http://localhost:3001/api/dao/${dao.id}/tasks`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            const daoTaskList = data.data.tasks || []
            tasksData[dao.id] = daoTaskList
          }
        } catch (error) {
          console.error(`Erreur lors du chargement des tâches pour DAO ${dao.id}:`, error)
          tasksData[dao.id] = []
        }
      }
      
      setDaoTasks(tasksData)
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error)
      setDaoTasks({})
    }
  }

  // Calculer la progression d'un DAO
  const calculateDaoProgress = (daoId: number) => {
    const tasks = daoTasks[daoId] || []
    if (tasks.length === 0) return 0
    const totalProgress = tasks.reduce((sum: number, task: any) => sum + (task.progress || 0), 0)
    return Math.round(totalProgress / tasks.length)
  }

  // Fonction computeStatus selon la documentation exacte (améliorée avec progression)
  const computeStatus = (dao: Dao, progress?: number): { label: string; className: string } => {
    const today = new Date();
    const rawStatut = String(dao.statut || "").toUpperCase();

    // 1. Si progression = 100%, statut terminée
    if (progress === 100) {
      return { label: "Terminée", className: "px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800" };
    }

    // 2. Statut terminé
    if (rawStatut === "TERMINEE" || rawStatut === "TERMINE") {
      return { label: "Terminée", className: "px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800" };
    }

    // 3. Pas de date de dépôt
    if (!dao.date_depot) {
      return { label: "En cours", className: "px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800" };
    }

    // 4. Calcul selon la date d'échéance
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



  // Filtrage des DAO
  const filteredDaos = daos.filter(dao => {
    const matchesSearch = searchTerm === '' || 
      dao.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.autorite.toLowerCase().includes(searchTerm.toLowerCase())
    
    const progress = calculateDaoProgress(dao.id)
    const status = computeStatus(dao, progress)
    const matchesStatut = statutFilter === '' || 
      (statutFilter === 'en_cours' && (status.label.includes('En cours') || status.label.includes('EN COURS'))) ||
      (statutFilter === 'a_risque' && status.label.includes('À risque')) ||
      (statutFilter === 'termine' && status.label.includes('Terminée'))
    
    return matchesSearch && matchesStatut
  })


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin"
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Mes DAO</h1>
          <p className="text-slate-500 text-sm">
            {filteredDaos.length} DAO trouvé{filteredDaos.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro, référence ou autorité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowStatutMenu(!showStatutMenu)}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center gap-2"
            >
              {statutFilter === '' ? 'Tous les statuts' : statutFilter === 'en_cours' ? 'En cours' : statutFilter === 'a_risque' ? 'À risque' : 'Terminé'}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showStatutMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-slate-200 shadow-lg z-10">
                <button
                  onClick={() => { setStatutFilter(''); setShowStatutMenu(false) }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700"
                >
                  Tous les statuts
                </button>
                <button
                  onClick={() => { setStatutFilter('en_cours'); setShowStatutMenu(false) }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700"
                >
                  En cours
                </button>
                <button
                  onClick={() => { setStatutFilter('a_risque'); setShowStatutMenu(false) }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700"
                >
                  À risque
                </button>
                <button
                  onClick={() => { setStatutFilter('termine'); setShowStatutMenu(false) }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700"
                >
                  Terminé
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 text-sm">{error}</div>
          <button
            onClick={() => {
              setError(null)
              if (currentUserId) {
                loadDaos(currentUserId)
              }
            }}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* DAO Cards Grid - Structure simplifiée selon documentation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="text-slate-500">Chargement...</div>
          </div>
        ) : filteredDaos.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-slate-500">Aucun DAO trouvé.</div>
          </div>
        ) : (
          filteredDaos.map((dao) => {
            const progress = calculateDaoProgress(dao.id)
            const status = computeStatus(dao, progress)
            return (
              <div 
                key={dao.id} 
                className="bg-white rounded-xl border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-blue-400 hover:scale-105 overflow-hidden group"
                onClick={() => navigate(`/chef-projet/dao/${dao.id}/tasks`)}
              >
                {/* En-tête avec gradient */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base font-bold text-slate-900">{dao.numero}</span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-1 truncate">{dao.reference}</h3>
                  <p className="text-xs text-slate-600 truncate">{dao.autorite}</p>
                </div>
                
                {/* Informations */}
                <div className="p-3 space-y-3 flex-1">
                  <div className="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded-lg">
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Date
                    </span>
                    <span className="font-semibold text-slate-700 text-xs">
                      {dao.date_depot ? new Date(dao.date_depot).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short', year: 'numeric'}) : 'Non définie'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded-lg">
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Chef
                    </span>
                    <span className="font-semibold text-slate-700 text-xs truncate max-w-20">{dao.chef_projet || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}