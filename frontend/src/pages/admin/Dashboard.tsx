import { useState, useEffect, useMemo } from 'react'
import { Calendar, Hourglass, AlertTriangle, CheckSquare } from 'lucide-react'

export default function AdminDashboard() {
  const [daoData, setDaoData] = useState<any[]>([])
  const [daoTasks, setDaoTasks] = useState<{[key: number]: any[]}>({})

  // Fonction getDAOStatus - Logique basée sur la progression des tâches
  const getDAOStatus = (dao: any) => {
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

  // Statistiques calculées avec useMemo - basées sur la progression des tâches
  const stats = useMemo(() => {
    return {
      totalDaos: daoData.length,
      completedDaos: daoData.filter(d => {
        const tasks = daoTasks[d.id] || [];
        if (tasks.length === 0) return false;
        const completedTasks = tasks.filter(task => task.statut === 'termine').length;
        return completedTasks === tasks.length;
      }).length,
      inProgressDaos: daoData.filter(d => {
        const tasks = daoTasks[d.id] || [];
        if (tasks.length === 0) {
          // Pour les DAO sans tâches, utiliser la logique de date
          if (!d.date_depot) return true;
          const diffDays = Math.floor((new Date(d.date_depot).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 4;
        }
        const completedTasks = tasks.filter(task => task.statut === 'termine').length;
        return completedTasks < tasks.length;
      }).length,
      atRiskDaos: daoData.filter(d => {
        const tasks = daoTasks[d.id] || [];
        if (tasks.length === 0) {
          // Pour les DAO sans tâches, utiliser la logique de date
          if (!d.date_depot) return false;
          const diffDays = Math.floor((new Date(d.date_depot).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return diffDays <= 3;
        }
        // Les DAO avec des tâches ne sont jamais "à risque" si elles ont des tâches assignées
        return false;
      }).length,
    };
  }, [daoData, daoTasks]);

  const statsDisplay = [
    { label: 'Total DAO', value: stats.totalDaos.toString(), icon: Calendar, color: 'bg-gray-200', textColor: 'text-gray-600' },
    { label: 'En cours', value: stats.inProgressDaos.toString(), icon: Hourglass, color: 'bg-yellow-200', textColor: 'text-yellow-700' },
    { label: 'À risque', value: stats.atRiskDaos.toString(), icon: AlertTriangle, color: 'bg-red-200', textColor: 'text-red-700' },
    { label: 'Terminés', value: stats.completedDaos.toString(), icon: CheckSquare, color: 'bg-green-200', textColor: 'text-green-700' },
  ]

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
        setDaoData(data.data.daos || [])
        // Charger les tâches pour chaque DAO
        await loadTasksForAllDaos(data.data.daos || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des DAO:', error)
    }
  }

  const loadTasksForAllDaos = async (daos: any[]) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Bienvenue Admin</h1>
        <p className="text-slate-500 text-sm">Voici les statistiques des DAO.</p>
      </div>

      {/* Stats cards - connected row */}
      <div className="flex">
        {statsDisplay.map((stat: any, index: number) => {
          const Icon = stat.icon
          const isFirst = index === 0
          const isLast = index === statsDisplay.length - 1
          return (
            <div 
              key={stat.label} 
              className={`${stat.color} flex-1 p-4 ${isFirst ? 'rounded-l-lg' : ''} ${isLast ? 'rounded-r-lg' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-6 w-6 ${stat.textColor}`} />
                <div>
                  <p className={`text-xs font-medium ${stat.textColor} opacity-80`}>{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* DAO Table Section */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        {/* Table Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">TOUS LES DAO</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded transition-colors" onClick={loadDaos}>
              Rafraîchir
            </button>
            <button className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors" onClick={() => window.location.href = '/admin/create-dao'}>
              Créer DAO
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Numéro DAO</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Objet du dossier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date de dépôt</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Référence</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Autorité contractante</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Chef de projet</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Groupement</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Statut</th>
              </tr>
            </thead>
            <tbody>
              {daoData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-left text-sm text-slate-500">
                    Aucun DAO pour le moment.
                  </td>
                </tr>
              ) : (
                daoData.map((dao) => (
                  <tr key={dao.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{dao.numero}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{dao.objet}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {new Date(dao.date_depot).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{dao.reference}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{dao.autorite}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {dao.chef_projet_nom || 'Non assigné'}
                    </td>
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
                      <span className={getDAOStatus(dao).className}>
                        {getDAOStatus(dao).label}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 pt-8">
        © 2026 2SND TECHNOLOGIES - Tous droits réservés.
      </footer>
    </div>
  )
}
