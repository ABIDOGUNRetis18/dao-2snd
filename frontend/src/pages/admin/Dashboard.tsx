import { useState, useEffect } from "react";
import { computeAdminStatus } from "../../utils/statusUtils";
import { computeStatusFromProgress } from "../../utils/daoStatusUtils";

export default function AdminDashboard() {
  const [daoData, setDaoData] = useState<any[]>([]);
  const [tasksData, setTasksData] = useState<any[]>([]);

  // Fonction pour calculer la progression moyenne des tâches d'un DAO
  const calculateDaoProgress = (daoId: number) => {
    const daoTasks = tasksData.filter(task => task.dao_id === daoId);
    if (daoTasks.length === 0) return 0;
    
    const totalProgress = daoTasks.reduce((sum, task) => sum + (task.progress || 0), 0);
    return Math.round(totalProgress / daoTasks.length);
  };

  // Fonction getDAOStatus - Utilise maintenant la logique basée sur la progression comme Mes tâches
  const getDAOStatus = (dao: any) => {
    const progress = calculateDaoProgress(dao.id);
    return computeStatusFromProgress(progress, dao.statut);
  };

  // Statistiques calculées - utilise la logique basée sur la progression comme Mes tâches
  const stats = {
    totalDaos: daoData.length,
    completedDaos: daoData.filter((d) => {
      const status = getDAOStatus(d);
      return status.label === "Terminée";
    }).length,
    inProgressDaos: daoData.filter((d) => {
      const status = getDAOStatus(d);
      return status.label === "En cours" || status.label === "EN COURS";
    }).length,
    atRiskDaos: daoData.filter((d) => {
      const status = getDAOStatus(d);
      return status.label === "À risque";
    }).length,
  };

  
  useEffect(() => {
    // Charger les données des DAOs et des tâches
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Charger les DAOs
        const daoResponse = await fetch("http://localhost:3001/api/dao", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (daoResponse.ok) {
          const daoData = await daoResponse.json();
          setDaoData(daoData.data.daos || []);
        }

        // Charger toutes les tâches
        const tasksResponse = await fetch("http://localhost:3001/api/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setTasksData(tasksData.data.tasks || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };

    fetchData();
  }, []);

  // Rafraîchir les données quand les tâches changent (comme dans Mes tâches)
  useEffect(() => {
    if (tasksData.length > 0 && daoData.length > 0) {
      console.log('[Admin Dashboard] Tâches mises à jour:', tasksData.length, 'pour', daoData.length, 'DAOs')
    }
  }, [tasksData, daoData])

  // Fonction pour mettre à jour une tâche et rafraîchir les données (comme dans Mes tâches)
  const updateTaskProgress = async (taskId: number, progress: number, statut?: string) => {
    try {
      const token = localStorage.getItem('token')
      const autoStatut = progress === 0 ? 'a_faire' : progress === 100 ? 'termine' : 'en_cours'
      const finalStatut = statut || autoStatut
      
      const response = await fetch(`http://localhost:3001/api/task-progress/${taskId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ progress, statut: finalStatut })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('[Admin Dashboard] Tâche mise à jour:', result)
        
        // Mettre à jour tasksData localement (comme dans Mes tâches)
        setTasksData(prev => {
          const updatedTasks = prev.map(task => 
            task.id === taskId 
              ? { ...task, progress, statut: finalStatut }
              : task
          )
          
          return updatedTasks
        })
      }
    } catch (error) {
      console.error('[Admin Dashboard] Erreur mise à jour tâche:', error)
    }
  }

  return (
    <div className="p-6">
      {/* DAO List Title */}
      <div className="mb-6">
        <h2 className="text-xl font-headline font-bold text-blue-900">Liste des DAOs</h2>
      </div>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 -mt-4">
        {/* Card 1 */}
        <div className="bg-blue-500 p-6 rounded-xl border-b-4 border-blue-600 flex justify-between items-start shadow-lg">
          <div>
            <p className="text-xs font-bold text-blue-100 mb-1">Total DAOs</p>
            <h3 className="text-3xl font-headline font-bold text-white">{stats.totalDaos}</h3>
            <p className="text-[10px] text-blue-200 mt-2 font-semibold">Active projects</p>
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
            <p className="text-[10px] text-green-200 mt-2 font-semibold">All targets met</p>
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
            <p className="text-[10px] text-orange-200 mt-2 font-semibold">Active processes</p>
          </div>
          <div className="p-3 bg-white/20 text-white rounded-lg backdrop-blur-sm">
            <span className="material-symbols-outlined">hourglass_empty</span>
          </div>
        </div>
        {/* Card 4 */}
        <div className="bg-red-400 p-6 rounded-xl border-b-4 border-red-500 flex justify-between items-start shadow-lg">
          <div>
            <p className="text-xs font-bold text-red-100 mb-1">À risque</p>
            <h3 className="text-3xl font-headline font-bold text-white">{stats.atRiskDaos}</h3>
            <p className="text-[10px] text-red-200 mt-2 font-semibold">Critical alerts</p>
          </div>
          <div className="p-3 bg-white/20 text-white rounded-lg backdrop-blur-sm">
            <span className="material-symbols-outlined">error</span>
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="mt-16 space-y-6">
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[11px] font-bold tracking-widest uppercase">
                <th className="px-6 py-4">Numéro</th>
                <th className="px-6 py-4">Objet</th>
                <th className="px-6 py-4">Date Dépôt</th>
                <th className="px-6 py-4">Référence</th>
                <th className="px-6 py-4">Autorité</th>
                <th className="px-6 py-4">Chef de Projet</th>
                <th className="px-6 py-4">Groupement</th>
                <th className="px-6 py-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {daoData.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Aucun DAO disponible
                  </td>
                </tr>
              ) : (
                daoData.map((dao: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <span className="font-bold text-blue-900 text-sm">{dao.numero}</span>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600">{dao.objet}</td>
                    <td className="px-6 py-5 text-sm text-slate-600">
                      {dao.date_depot
                        ? new Date(dao.date_depot).toLocaleDateString("fr-FR")
                        : "-"}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600">
                      {dao.reference || "-"}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600">
                      {dao.autorite || "-"}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                          {dao.chef_projet_nom?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <span className="text-sm text-slate-600 font-medium">
                          {dao.chef_projet_nom || 'admin'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-400 text-center">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getDAOStatus(dao).className}`}
                      >
                        {getDAOStatus(dao).label}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
