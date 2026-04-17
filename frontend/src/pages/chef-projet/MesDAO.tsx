import { useEffect, useState } from 'react'
import { Search, ArrowLeft, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { computeStatusFromProgress } from '../../utils/daoStatusUtils'
import '../admin/MyTasks.css'

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
  const [loading, setLoading] = useState(true)

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

  const handleEdit = (daoId: number) => {
    navigate(`/chef-projet/dao/${daoId}/edit`)
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
              className="bg-white rounded border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300 overflow-hidden"
              onClick={() => navigate(`/chef-projet/dao/${dao.id}/tasks`)}
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
              
              {/* Actions simplifiées pour chef-projet */}
              <div className="p-2 border-t border-slate-100 bg-slate-50">
                <div className="flex gap-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/chef-projet/dao/${dao.id}/tasks`)
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-1 px-1.5 rounded transition-colors flex items-center justify-center gap-0.5"
                    title="Voir détails"
                  >
                    Détails
                    <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7-7" />
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(dao.id)
                    }}
                    className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs py-1 px-1.5 rounded transition-colors"
                    title="Modifier"
                  >
                    <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(dao.id)
                    }}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs py-1 px-1.5 rounded transition-colors"
                    title="Supprimer"
                  >
                    <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
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
