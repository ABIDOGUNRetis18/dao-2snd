import { useState, useEffect } from 'react'
import { Calendar, Hourglass, AlertTriangle, CheckSquare } from 'lucide-react'
import { computeAdminStatus } from '../../utils/statusUtils'

export default function AdminDashboard() {
  const [daoData, setDaoData] = useState<any[]>([])

  // Fonction getDAOStatus - Utilise maintenant le statut de la base de données via computeAdminStatus
  const getDAOStatus = (dao: any) => {
    return computeAdminStatus(dao);
  }

  // Statistiques calculées avec useMemo - utilise le statut de la base de données
  const stats = {
    totalDaos: daoData.length,
    completedDaos: daoData.filter(d => {
      const status = computeAdminStatus(d);
      return status.label === "Terminée";
    }).length,
    inProgressDaos: daoData.filter(d => {
      const status = computeAdminStatus(d);
      return status.label === "En cours" || status.label === "EN COURS";
    }).length,
    atRiskDaos: daoData.filter(d => {
      const status = computeAdminStatus(d);
      return status.label === "À risque";
    }).length
  };

  const statsDisplay = [
    { label: 'Total DAOs', value: stats.totalDaos, icon: Calendar, color: 'bg-blue-500' },
    { label: 'Terminés', value: stats.completedDaos, icon: CheckSquare, color: 'bg-green-500' },
    { label: 'En cours', value: stats.inProgressDaos, icon: Hourglass, color: 'bg-yellow-500' },
    { label: 'À risque', value: stats.atRiskDaos, icon: AlertTriangle, color: 'bg-red-500' }
  ];

  useEffect(() => {
    // Charger les données des DAOs
    const fetchDAOs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/dao', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setDaoData(data.data.daos || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des DAOs:', error);
      }
    };

    fetchDAOs();
  }, []);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Tableau de bord Administrateur</h1>
        <p className="text-slate-600">Vue d'ensemble de tous les DAOs et leur état d'avancement</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsDisplay.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tableau des DAOs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Liste des DAOs</h2>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Chef de projet</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Groupement</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {daoData.map((dao, index) => (
                <tr key={index} className="hover:bg-slate-50">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <footer className="text-center text-xs text-slate-400 pt-8">
        © 2026 2SND TECHNOLOGIES - Tous droits réservés.
      </footer>
    </div>
  )
}
