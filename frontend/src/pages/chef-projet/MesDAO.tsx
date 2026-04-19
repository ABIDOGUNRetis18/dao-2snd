import { useEffect, useState } from 'react'
import { Search, ArrowLeft, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { computeStatusFromProgress } from '../../utils/daoStatusUtils'

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
  created_at: string
}

export default function MesDAOs() {
  const navigate = useNavigate()
  const [daos, setDaos] = useState<DAO[]>([])
  const [daoTasks, setDaoTasks] = useState<{[key: number]: any[]}>({})
  const [daoMembers, setDaoMembers] = useState<{[key: number]: any[]}>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [statutFilter, setStatutFilter] = useState('')
  const [showStatutMenu, setShowStatutMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

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
  }, [])

  const loadDaos = async () => {
    try {
      setError(null)
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('Token d\'authentification manquant')
        setLoading(false)
        return
      }
      
      // Utiliser l'API pour récupérer les DAOs assignés à ce chef de projet
      let daoUrl = 'http://localhost:3001/api/dao/mes-daos'
      
      // Si on a l'ID utilisateur, utiliser l'API filtrée par chefId
      if (currentUserId) {
        daoUrl = `http://localhost:3001/api/dao?chefId=${currentUserId}`
      }
      
      const response = await fetch(daoUrl, {
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
        // Filtrer pour ne pas afficher les DAO archivés (mais afficher les terminés)
        let allDaos = data.data.daos || []
        
        // Si on utilise l'API sans chefId, filtrer manuellement pour n'afficher que les DAOs du chef
        if (!currentUserId) {
          const storedUser = localStorage.getItem("user")
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser)
              const userId = Number(parsed.id)
              allDaos = allDaos.filter((dao: any) => Number(dao.chef_id) === userId)
            } catch (error) {
              console.error('Erreur parsing utilisateur pour filtrage:', error)
            }
          }
        }
        
        const activeDaos = allDaos.filter((dao: any) => dao.statut !== 'ARCHIVE')
        setDaos(activeDaos)
        // Charger les tâches et les membres pour chaque DAO
        await loadTasksForAllDaos(activeDaos)
        await loadMembersForAllDaos(activeDaos)
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

  const loadTasksForAllDaos = async (daos: DAO[]) => {
    const token = localStorage.getItem('token')
    const tasksData: {[key: number]: any[]} = {}
    
    console.log('[Chef Projet Mes DAO] Chargement des tâches pour', daos.length, 'DAOs')
    
    for (const dao of daos) {
      try {
        // Utiliser l'API selon la documentation : /api/tasks?daoId=X
        const response = await fetch(`http://localhost:3001/api/tasks?daoId=${dao.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          // L'API retourne data.data.tasks selon la documentation
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
    
    console.log('[Chef Projet Mes DAO] Toutes les tâches chargées')
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

  // Statut basé sur la logique centralisée
  const getDAOStatus = (dao: DAO) => {
    const progression = getProgression(dao)
    const status = computeStatusFromProgress(progression, dao.statut)
    
    // Convertir les classes CSS pour correspondre au style de la page
    const className = status.className.replace(/bg-(\w+)-(\d+)/g, 'px-2 py-1 text-xs font-medium rounded-full bg-$1-$2 text-$1-$800')
    
    return { label: status.label, className }
  }

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

  
  
  
  // Fonction computeStatus selon la documentation exacte (améliorée avec progression)
  const computeStatus = (dao: DAO, progress?: number): { label: string; className: string } => {
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
      dao.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.autorite.toLowerCase().includes(searchTerm.toLowerCase())
    
    const progress = getProgression(dao)
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
          to="/chef-projet"
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
              placeholder="Rechercher par numéro, référence, objet ou autorité..."
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
              loadDaos()
            }}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* DAO Cards Grid - Structure moderne comme admin/my-daos */}
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
            const progress = getProgression(dao)
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
                  <h3 className="text-sm font-semibold text-slate-800 mb-1 truncate">{dao.objet}</h3>
                  <p className="text-xs text-slate-600 truncate">{dao.reference}</p>
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
                    <span className="font-semibold text-slate-700 text-xs truncate max-w-20">{dao.chef_projet_nom || 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded-lg">
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Équipe
                    </span>
                    <span className="font-semibold text-slate-700 text-xs">{daoMembers[dao.id]?.length || 0}</span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded-lg">
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Progression
                    </span>
                    <span className="font-semibold text-slate-700 text-xs">{progress}%</span>
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
