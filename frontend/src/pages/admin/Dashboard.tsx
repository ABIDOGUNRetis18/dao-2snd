import { useState, useEffect } from 'react'
import { computeAdminStatus } from '../../utils/statusUtils'

export default function AdminDashboard() {
  const [daoData, setDaoData] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Fonction getDAOStatus - Utilise maintenant le statut de la base de données via computeAdminStatus
  const getDAOStatus = (dao: any) => {
    return computeAdminStatus(dao);
  }

  // Statistiques calculées - utilise le statut de la base de données
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

  // Filtrer les DAOs selon le terme de recherche
  const filteredDaos = daoData.filter(dao =>
    dao.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dao.objet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dao.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dao.autorite?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dao.chef_projet_nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Administrateur</h1>
        <p className="text-gray-600">Vue d'ensemble de tous les DAOs et leur état d'avancement</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total DAOs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDaos}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="material-symbols-outlined text-blue-600">calendar_today</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Terminés</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedDaos}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgressDaos}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <span className="material-symbols-outlined text-orange-600">hourglass_empty</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">À risque</p>
              <p className="text-2xl font-bold text-gray-900">{stats.atRiskDaos}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <span className="material-symbols-outlined text-red-600">error</span>
            </div>
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Liste des DAOs</h2>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Filter
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Objet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Dépôt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Autorité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chef de Projet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Groupement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDaos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'Aucun DAO trouvé pour cette recherche' : 'Aucun DAO disponible'}
                  </td>
                </tr>
              ) : (
                filteredDaos.map((dao, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{dao.numero}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{dao.objet}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {dao.date_depot ? new Date(dao.date_depot).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{dao.reference || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{dao.autorite || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {dao.chef_projet_nom ? (
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mr-2">
                            {dao.chef_projet_nom.charAt(0).toUpperCase()}
                          </div>
                          <span>{dao.chef_projet_nom}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Non assigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 text-center">
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
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDAOStatus(dao).className}`}>
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
  )
}
