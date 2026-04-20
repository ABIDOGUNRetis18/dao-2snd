import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Edit, Archive, Trash2, Search, ArrowLeft } from 'lucide-react'
import ProgressManager from '../../utils/progressManager'
import './AllDAOs.css'

interface DAO {
  id: number
  numero: string
  reference: string
  autorite: string
  date_depot?: string
  statut?: string
  chef_projet?: string
  chef_id?: number
  team_id?: string
  progression?: number // Champ calculé
}

export default function AllDAOs() {
  const navigate = useNavigate()
  const [daos, setDaos] = useState<DAO[]>([])
  const [daoTasks, setDaoTasks] = useState<{[key: number]: any[]}>({})
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statutFilter, setStatutFilter] = useState('')
  const [showStatutMenu, setShowStatutMenu] = useState(false)

  // Initialiser le gestionnaire de progression
  const progressManager = ProgressManager.getInstance()

  // S'abonner aux mises à jour de progression
  useEffect(() => {
    progressManager.subscribe('task-progress', (data) => {
      // console.log('[AllDAOs] Progression mise à jour:', data)
      // Mettre à jour les états locaux
      setAllTasks(prev => {
        const updatedTasks = prev.map(task => 
          task.id === data.taskId 
            ? { ...task, progress: data.progress, statut: data.statut }
            : task
        )
        
        // Mettre à jour les tâches par DAO
        const updatedDaoTasks: {[key: number]: any[]} = {}
        daos.forEach(dao => {
          updatedDaoTasks[dao.id] = updatedTasks.filter((task: any) => task.dao_id === dao.id)
        })
        setDaoTasks(updatedDaoTasks)
        
        return updatedTasks
      })
    })

    progressManager.subscribe('dao-progress', () => {
      // console.log('[AllDAOs] Progression DAO mise à jour')
    })

    // S'abonner aux mises à jour depuis DAODetails
    progressManager.subscribe('dao-details-task-progress', (data) => {
      // console.log('[AllDAOs] Mise à jour depuis DAODetails:', data)
      // Mettre à jour les états locaux
      setAllTasks(prev => {
        const updatedTasks = prev.map(task => 
          task.id === data.taskId 
            ? { ...task, progress: data.progress, statut: data.statut }
            : task
        )
        
        // Mettre à jour les tâches par DAO
        const updatedDaoTasks: {[key: number]: any[]} = {}
        daos.forEach(dao => {
          updatedDaoTasks[dao.id] = updatedTasks.filter((task: any) => task.dao_id === dao.id)
        })
        setDaoTasks(updatedDaoTasks)
        
        return updatedTasks
      })
    })

    progressManager.subscribe('dao-details-dao-update', (data) => {
      // console.log('[AllDAOs] DAO mis à jour depuis DAODetails:', data)
      setDaos(prev => prev.map(dao => 
        dao.id === data.daoId 
          ? { ...dao, ...data.daoData }
          : dao
      ))
    })

    // Nettoyage
    return () => {
      progressManager.destroy()
    }
  }, [])

  // Fonction de progression comme dans Mes tâches
  const calculateDaoProgress = (daoId: number) => {
    // Utiliser allTasks si disponible, sinon fallback sur daoTasks
    let tasksToUse = allTasks.filter(task => task.dao_id === daoId);
    
    // Fallback si allTasks est vide (pendant le chargement)
    if (tasksToUse.length === 0 && Object.keys(daoTasks).length > 0) {
      tasksToUse = daoTasks[daoId] || [];
    }
    
    if (tasksToUse.length === 0) return 0;
    
    // Logique exacte de Mes tâches
    const totalProgress = tasksToUse.reduce((sum, task) => sum + (task.progress || 0), 0);
    const averageProgress = Math.round(totalProgress / tasksToUse.length);
    
    // console.log(`[DEBUG] DAO ${daoId}:`, {
    //   tasks: tasksToUse.length,
    //   tasksProgress: tasksToUse.map(t => ({ id: t.id, progress: t.progress, statut: t.statut })),
    //   totalProgress,
    //   averageProgress
    // });
    
    return averageProgress;
  };

  useEffect(() => {
    loadDaos()
  }, [])

  // Recharger les données quand la page devient visible (retour d'une autre page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDaos()
      }
    }

    // Écouter les changements de visibilité
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Écouter les changements de focus
    const handleFocus = () => {
      loadDaos()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Rafraîchir les données quand les tâches changent (comme dans Mes tâches)
  useEffect(() => {
    if (allTasks.length > 0 && daos.length > 0) {
      // Mettre à jour daoTasks quand allTasks change
      const updatedDaoTasks: {[key: number]: any[]} = {}
      daos.forEach(dao => {
        updatedDaoTasks[dao.id] = allTasks.filter(task => task.dao_id === dao.id)
      })
      setDaoTasks(updatedDaoTasks)
      
      // Débogage de l'association tâches-DAO
      /* console.log('[DEBUG ASSOCIATION] Tâches-DAO:', {
        totalTasks: allTasks.length,
        totalDaos: daos.length,
        daoIds: [...new Set(allTasks.map(t => t.dao_id))],
        tasksByDao: Object.fromEntries(
          Object.entries(updatedDaoTasks).map(([daoId, tasks]) => [
            daoId, 
            { count: tasks.length, progresses: tasks.map(t => t.progress) }
          ])
        )
      }) */
    }
  }, [allTasks, daos])

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
        // Charger les tâches pour chaque DAO
        await loadTasksForAllDaos(activeDaos)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des DAO:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTasksForAllDaos = async (daos: DAO[]) => {
    const token = localStorage.getItem('token')
    const tasksData: {[key: number]: any[]} = []
    const allTasksData: any[] = []
    
    try {
      // Charger les vraies tâches assignées pour chaque DAO
      for (const dao of daos) {
        try {
          const response = await fetch(`http://localhost:3001/api/dao/${dao.id}/tasks`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            const daoTasks = data.data.tasks || []
            tasksData[dao.id] = daoTasks
            allTasksData.push(...daoTasks.map((task: any) => ({ ...task, dao_id: dao.id })))
      console.log(`[AllDAOs] ${daoTasks.length} tâches chargées pour DAO ${dao.id}`)
          }
        } catch (error) {
          console.error(`Erreur lors du chargement des tâches pour DAO ${dao.id}:`, error)
          tasksData[dao.id] = []
        }
      }
      
      setAllTasks(allTasksData)
      setDaoTasks(tasksData)
      console.log('[AllDAOs] Total tâches chargées:', allTasksData.length, 'pour', Object.keys(tasksData).length, 'DAOs')
      
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error)
      setAllTasks([])
      setDaoTasks({})
    }
  }

  // Fonction computeStatus selon la documentation (améliorée avec progression)
  const computeStatus = (dao: DAO, progress?: number): { label: string; className: string } => {
    const today = new Date();
    const rawStatut = String(dao.statut || "").toUpperCase();

    // 1. Si progression = 100%, statut terminée
    if (progress === 100) {
      return { label: "Terminée", className: "px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800" };
    }

    // 2. Statut terminé en BD
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
      return { label: "À risque", className: "px-2 py-1 text-xs font-medium rounded-full bg-red-600 text-white" };
    }

    return { label: "En cours", className: "px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800" };
  };

  // Statut basé sur la logique de la documentation + progression
  const getDAOStatus = (dao: DAO, progress?: number) => {
    return computeStatus(dao, progress);
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
    navigate(`/admin/edit-dao/${daoId}`)
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
      dao.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.autorite.toLowerCase().includes(searchTerm.toLowerCase())
    
    const status = computeStatus(dao)
    const matchesStatut = statutFilter === '' || 
      (statutFilter === 'en_cours' && (status.label.includes('En cours') || status.label.includes('EN COURS'))) ||
      (statutFilter === 'a_risque' && status.label.includes('À risque')) ||
      (statutFilter === 'termine' && status.label.includes('Terminée'))
    
    return matchesSearch && matchesStatut
  })

  // Forcer le recalcul du statut quand les tâches changent (comme dans Mes tâches)
  const daosWithStatus = useMemo(() => {
    const result = filteredDaos.map(dao => {
      const progress = calculateDaoProgress(dao.id);
      const status = getDAOStatus(dao, progress);
      
      // Débogage du statut - commenté pour réduire le bruit de la console
      // console.log(`[DEBUG STATUS] DAO ${dao.id}:`, {
      //   progress,
      //   statusLabel: status.label,
      //   statusClass: status.className,
      //   daoStatut: dao.statut
      // });
      
      return {
        ...dao,
        status,
        progress
      };
    });
    
    return result;
  }, [filteredDaos, allTasks])

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

      {/* DAO Cards Grid */}
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
          daosWithStatus.map((dao) => (
            <div 
              key={dao.id} 
              className="bg-white rounded-xl border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-blue-400 hover:scale-105 overflow-hidden group"
              onClick={() => navigate(`/admin/dao/${dao.id}/details`)}
            >
              {/* En-tête avec gradient */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base font-bold text-slate-900">{dao.numero}</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${dao.status.className}`}>
                    {dao.status.label}
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
              
              {/* Actions */}
        <div className="p-3 border-t border-slate-100 bg-gradient-to-b from-slate-50 to-white">
          <div className="flex gap-1.5 mb-2" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => handleEdit(dao.id)}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-2 rounded-lg transition-all duration-200 flex items-center justify-center hover:shadow-md" 
              title="Modifier"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => handleArchive(dao.id)}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-1.5 px-2 rounded-lg transition-all duration-200 flex items-center justify-center hover:shadow-md"
              title="Archiver"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => handleDelete(dao.id)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1.5 px-2 rounded-lg transition-all duration-200 flex items-center justify-center hover:shadow-md"
              title="Supprimer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            </div>
                
            <button 
              onClick={() => navigate(`/admin/dao/${dao.id}/details`)}
              className="w-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 text-xs font-medium py-1.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 hover:shadow-md group-hover:from-blue-50 group-hover:to-blue-100 group-hover:text-blue-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
