import { useEffect, useState } from 'react'
import { Search, Filter, ArrowLeft, Trash2, Edit, Archive } from 'lucide-react'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('tous')
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
        // Filtrer pour ne pas afficher les DAO archivés
        const nonArchivedDaos = (data.data.daos || []).filter((dao: any) => dao.statut !== 'ARCHIVE')
        setDaos(nonArchivedDaos)
        // Charger les tâches pour chaque DAO
        await loadTasksForAllDaos(nonArchivedDaos)
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

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'bg-yellow-100 text-yellow-800'
      case 'EN_COURS':
        return 'bg-blue-100 text-blue-800'
      case 'TERMINE':
        return 'bg-green-100 text-green-800'
      case 'A_RISQUE':
      case 'EN_RETARD':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgression = (dao: DAO) => {
    const tasks = daoTasks[dao.id] || [];
    if (tasks.length === 0) {
      // Pour les DAO sans tâches, utiliser la logique de date
      if (!dao.date_depot) return 25;
      const diffDays = Math.floor((new Date(dao.date_depot).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 4) return 60;
      if (diffDays <= 3) return 40;
      return 25;
    }
    // Calculer la progression réelle basée sur les tâches
    const completedTasks = tasks.filter(task => task.statut === 'termine').length;
    return tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  }

  const getProgressionColor = (dao: DAO) => {
    const status = getDAOStatus(dao).label;
    switch (status) {
      case 'Terminée':
        return 'bg-green-500'
      case 'En cours':
        return 'bg-yellow-500'
      case 'À risque':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
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
        setDaos(daos.filter(dao => dao.id !== daoId))
        alert('DAO supprimé avec succès')
      } else {
        alert('Erreur lors de la suppression du DAO')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur réseau lors de la suppression')
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
    
    const matchesStatus = statusFilter === 'tous' || dao.statut === statusFilter
    
    return matchesSearch && matchesStatus
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

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Barre de recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro, objet ou référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filtre par statut */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="tous">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
              <option value="A_RISQUE">À risque</option>
            </select>
          </div>
        </div>
      </div>

      {/* DAO Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
              onClick={() => window.location.href = `/admin/dao/${dao.id}`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-900">{dao.numero}</span>
                  <span className={getDAOStatus(dao).className}>
                    {getDAOStatus(dao).label}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-1">{dao.objet}</h3>
                <p className="text-sm text-slate-500">Référence: {dao.reference}</p>
              </div>
              
              {/* Progression Bar */}
              <div className="px-4 py-3 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600">Progression</span>
                  <span className="text-xs font-medium text-slate-600">{getProgression(dao)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressionColor(dao)}`}
                    style={{ width: `${getProgression(dao)}%` }}
                  />
                </div>
              </div>
              
              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Date de dépôt:</span>
                  <span className="text-sm text-slate-700">
                    {new Date(dao.date_depot).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Autorité:</span>
                  <span className="text-sm text-slate-700">{dao.autorite}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Chef de projet:</span>
                  <span className="text-sm text-slate-700">{dao.chef_projet_nom || 'Non assigné'}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Groupement:</span>
                  <span className="text-sm text-slate-700">
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
                  </span>
                </div>
              </div>
              
              {/* Card Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => handleEdit(dao.id)}
                    className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex items-center justify-center"
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(dao.id)}
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded transition-colors flex items-center justify-center"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleArchive(dao.id)}
                    className="w-8 h-8 bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors flex items-center justify-center"
                    title="Archiver"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
