import { useEffect, useState } from 'react'
import { Search, ArrowLeft, Trash2, Edit, Archive, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

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

export default function AllDAOs() {
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
        const activeDaos = (data.data.daos || []).filter((dao: any) => dao.statut !== 'ARCHIVE')
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
    
    console.log('[Tous les DAO] Chargement des tâches pour', daos.length, 'DAOs')
    
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
    
    console.log('[Tous les DAO] Toutes les tâches chargées')
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

  
  const handleDelete = async (daoId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce DAO ?')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/dao/${daoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        loadDaos()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du DAO:', error)
    }
  }

  const handleEdit = (daoId: number) => {
    window.location.href = `/admin/edit-dao/${daoId}`
  }

  const handleArchive = async (daoId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir archiver ce DAO ?')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/dao/${daoId}/archive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        // Mettre à jour la liste pour enlever le DAO archivé
        setDaos(daos.filter(dao => dao.id !== daoId))
        alert('DAO archivé avec succès')
      } else {
        alert('Erreur lors de l\'archivage du DAO')
      }
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error)
      alert('Erreur réseau lors de l\'archivage')
    }
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
          to="/admin"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div key="loading" className="col-span-full text-center py-12">
            <div className="text-slate-500">Chargement...</div>
          </div>
        ) : filteredDaos.length === 0 ? (
          <div key="no-results" className="col-span-full text-center py-12">
            <div className="text-slate-500">Aucun DAO trouvé.</div>
          </div>
        ) : (
          filteredDaos.map((dao) => (
            <div 
              key={`dao-${dao.id}`} 
              className="bg-white rounded border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300 overflow-hidden"
              onClick={() => window.location.href = `/admin/dao/${dao.id}/details`}
            >
              {/* Header minimal */}
              <div className="p-2 border-b border-slate-100">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-bold text-slate-900">{dao.numero}</span>
                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${getDAOStatus(dao).className}`}>
                    {getDAOStatus(dao).label}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-0.5 truncate leading-tight">{dao.objet}</h3>
                <p className="text-xs text-slate-500 truncate leading-tight">{dao.reference}</p>
              </div>
              
              {/* Progression minimale */}
              <div className="px-2 py-1.5 bg-slate-50">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-slate-600">Progression</span>
                  <span className="text-xs font-bold text-blue-600">{getProgression(dao)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all duration-300 ${getProgressionColor(dao)}`}
                    style={{ width: `${getProgression(dao)}%` }}
                  />
                </div>
              </div>
              
              {/* Informations minimales */}
              <div className="p-2 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Date:</span>
                  <span className="font-medium text-slate-700 text-xs">
                    {new Date(dao.date_depot).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Autorité:</span>
                  <span className="font-medium text-slate-700 text-xs truncate max-w-[70px]">{dao.autorite}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Chef:</span>
                  <span className="font-medium text-slate-700 text-xs truncate max-w-[70px]">{dao.chef_projet_nom || 'N/A'}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Équipe:</span>
                  <div className="flex items-center gap-0.5">
                    <Users className="h-2.5 w-2.5 text-slate-400" />
                    <span className="font-medium text-slate-700 text-xs">
                      {daoMembers[dao.id]?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Actions minimales */}
              <div className="p-2 border-t border-slate-100 bg-slate-50">
                <div className="flex gap-1 mb-1.5" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => handleEdit(dao.id)}
                    className="w-5 h-5 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex items-center justify-center"
                    title="Modifier"
                  >
                    <Edit className="h-2.5 w-2.5" />
                  </button>
                  <button 
                    onClick={() => handleArchive(dao.id)}
                    className="w-5 h-5 bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors flex items-center justify-center"
                    title="Archiver"
                  >
                    <Archive className="h-2.5 w-2.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(dao.id)}
                    className="w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded transition-colors flex items-center justify-center"
                    title="Supprimer"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
                
                <button 
                  onClick={() => window.location.href = `/admin/dao/${dao.id}/details`}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-1 px-1.5 rounded transition-colors flex items-center justify-center gap-0.5"
                  title="Voir détails"
                >
                  Détails
                  <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
