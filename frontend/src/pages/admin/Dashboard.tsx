import { useState, useEffect } from "react";
import { computeAdminStatus } from "../../utils/statusUtils";

export default function AdminDashboard() {
  const [daoData, setDaoData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fonction getDAOStatus - Utilise maintenant le statut de la base de données via computeAdminStatus
  const getDAOStatus = (dao: any) => {
    return computeAdminStatus(dao);
  };

  // Statistiques calculées - utilise le statut de la base de données
  const stats = {
    totalDaos: daoData.length,
    completedDaos: daoData.filter((d) => {
      const status = computeAdminStatus(d);
      return status.label === "Terminée";
    }).length,
    inProgressDaos: daoData.filter((d) => {
      const status = computeAdminStatus(d);
      return status.label === "En cours" || status.label === "EN COURS";
    }).length,
    atRiskDaos: daoData.filter((d) => {
      const status = computeAdminStatus(d);
      return status.label === "À risque";
    }).length,
  };

  // Filtrer les DAOs selon le terme de recherche
  const filteredDaos = daoData.filter(
    (dao) =>
      dao.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.objet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.autorite?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.chef_projet_nom?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    // Charger les données des DAOs
    const fetchDAOs = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:3001/api/dao", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setDaoData(data.data.daos || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des DAOs:", error);
      }
    };

    fetchDAOs();
  }, []);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Tableau de bord Administrateur
        </h1>
        <p className="text-gray-600">
          Vue d'ensemble de tous les DAOs et leur état d'avancement
        </p>
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

      {/* DAO List Title */}
      <div className="mb-6">
        <h2 className="text-xl font-headline font-bold text-blue-900">Liste des DAOs</h2>
      </div>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 -mt-2">
        {/* Card 1 */}
        <div className="bg-blue-600 p-6 rounded-xl border-b-4 border-blue-800 flex justify-between items-start shadow-lg">
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
        <div className="bg-green-600 p-6 rounded-xl border-b-4 border-green-800 flex justify-between items-start shadow-lg">
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
        <div className="bg-orange-500 p-6 rounded-xl border-b-4 border-orange-700 flex justify-between items-start shadow-lg">
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
        <div className="bg-red-500 p-6 rounded-xl border-b-4 border-red-700 flex justify-between items-start shadow-lg">
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
      <section className="mt-12">
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
              {filteredDaos.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    {searchTerm
                      ? "Aucun DAO trouvé pour cette recherche"
                      : "Aucun DAO disponible"}
                  </td>
                </tr>
              ) : (
                filteredDaos.map((dao: any, index: number) => (
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
