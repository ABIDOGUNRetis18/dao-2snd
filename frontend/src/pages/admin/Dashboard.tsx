import { useState, useEffect, useMemo } from "react";

interface Dao {
  id: number;
  numero: string;
  reference: string;
  autorite: string;
  date_depot?: string;
  chef_id?: number | null;
  chef_projet?: string | null;
  statut?: string | null;
  groupement?: string | null;
  nom_partenaire?: string | null;
  type_dao?: string | null;
  // objet: string; // Non utilisé dans le tableau admin
}

interface User {
  id: number;
  role_id: number;
  name?: string;
}

export default function AdminDashboard() {
  const [daos, setDaos] = useState<Dao[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction computeStatus selon la documentation exacte (améliorée avec progression)
  const computeStatus = (dao: Dao, progress?: number): { label: string; className: string } => {
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
      return { label: "À risque", className: "px-2 py-1 text-xs font-medium rounded-full bg-red-600 text-white" };
    }

    return { label: "En cours", className: "px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800" };
  };

  // Logique de calcul des statistiques selon documentation exacte
  const stats = useMemo(() => {
    const total = daos.length;
    let enCours = 0;
    let aRisque = 0;
    let terminees = 0;
    
    daos.forEach(dao => {
      const statut = String(dao.statut || "").toUpperCase();
      
      // Logique exacte selon documentation
      if (statut === "TERMINEE" || statut === "TERMINE") {
        terminees++;
      } else if (!dao.date_depot) {
        enCours++;
      } else {
        const dateDepot = new Date(dao.date_depot);
        const today = new Date();
        const diffDays = Math.floor((dateDepot.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 5 || diffDays === 4) {
          enCours++;
        } else if (diffDays <= 3) {
          aRisque++;
        } else {
          enCours++;
        }
      }
    });
    
    return {
      total,
      enCours,
      aRisque,
      terminees
    };
  }, [daos]);

  
  // Utiliser localStorage comme source principale (endpoint /api/me n'existe pas)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({ id: parsed.id, role_id: parsed.role_id, name: parsed.name });
        console.log('[Admin Dashboard] Utilisateur chargé depuis localStorage:', parsed);
      } catch (error) {
        console.error('[Admin Dashboard] Erreur parsing utilisateur:', error);
      }
    } else {
      console.log('[Admin Dashboard] Aucun utilisateur trouvé dans localStorage');
    }
  }, []);
  
  // Système de notifications automatiques selon documentation
  useEffect(() => {
    if (!user) return;
    
    const checkNotifications = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/notifications?userId=${user.id}&checkDeposits=true`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const notifications = await response.json();
          console.log('Notifications vérifiées:', notifications);
        } else {
          console.log('[Admin Dashboard] Endpoint notifications non disponible (404):', response.status);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des notifications:', error);
      }
    };
    
    // Vérification immédiate
    checkNotifications();
    
    // Vérification périodique toutes les 5 minutes
    const interval = setInterval(checkNotifications, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);
  
  // Charger les données des DAOs
  useEffect(() => {
    loadDaos();
  }, []);


  
  const loadDaos = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      console.log('[Admin Dashboard] Début chargement DAOs - Token:', token ? 'présent' : 'manquant');
      
      if (!token) {
        setError('Token d\'authentification manquant');
        return;
      }
      
      console.log('[Admin Dashboard] Appel API: GET http://localhost:3001/api/dao');
      
      const response = await fetch("http://localhost:3001/api/dao", {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: "no-store"
      });

      console.log('[Admin Dashboard] Réponse API:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Admin Dashboard] Erreur HTTP:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[Admin Dashboard] Structure des données reçues:', {
        success: data.success,
        dataKeys: Object.keys(data),
        dataContent: data,
        dataType: typeof data,
        dataPath: data.data,
        daosPath: data.data?.daos,
        daosDirectPath: data.daos,
        daosLength: data.daos?.length,
        isArray: Array.isArray(data.daos)
      });
      
      if (data.success) {
        const activeDaos = (data.data?.daos || []).filter((dao: Dao) => dao.statut !== 'ARCHIVE');
        console.log('[Admin Dashboard] DAOs à charger:', activeDaos.length);
        setDaos(activeDaos);
      } else {
        console.error('[Admin Dashboard] Échec API:', data);
        throw new Error(data.message || 'Erreur de données du serveur');
      }
    } catch (error) {
      console.error("[Admin Dashboard] Erreur complète:", error);
      setError(error instanceof Error ? error.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="p-6 border border-slate-100 rounded-lg bg-gray-50">
      {/* Titre du Dashboard */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900 mb-2">Tableau de bord Administrateur</h1>
        <p className="text-sm text-slate-500">Vue d'ensemble de tous les DAOs et leur état d'avancement</p>
      </div>
      
      {/* Stats Section - Style chef projet avec couleurs pleines */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 border border-slate-100 rounded-lg p-4 bg-white">
        {/* Total DAO - Bleu */}
        <div className="bg-blue-500 p-6 rounded-xl border-b-4 border-blue-600 flex justify-between items-start shadow-lg">
          <div>
            <p className="text-xs font-bold text-blue-100 mb-1">Total DAO</p>
            <h3 className="text-3xl font-bold text-white">{stats.total}</h3>
            <p className="text-[10px] text-blue-200 mt-2 font-semibold">Projets actifs</p>
          </div>
          <div className="p-3 bg-white/20 text-white rounded-lg backdrop-blur-sm">
            <span className="material-symbols-outlined">calendar_today</span>
          </div>
        </div>
        
        {/* En cours - Orange */}
        <div className="bg-orange-400 p-6 rounded-xl border-b-4 border-orange-500 flex justify-between items-start shadow-lg">
          <div>
            <p className="text-xs font-bold text-orange-100 mb-1">En cours</p>
            <h3 className="text-3xl font-bold text-white">{stats.enCours}</h3>
            <p className="text-[10px] text-orange-200 mt-2 font-semibold">Processus actifs</p>
          </div>
          <div className="p-3 bg-white/20 text-white rounded-lg backdrop-blur-sm">
            <span className="material-symbols-outlined">hourglass_empty</span>
          </div>
        </div>
        
        {/* À risque - Rouge danger */}
        <div className="bg-red-600 p-6 rounded-xl border-b-4 border-red-800 flex justify-between items-start shadow-lg">
          <div>
            <p className="text-xs font-bold text-red-100 mb-1">À risque</p>
            <h3 className="text-3xl font-bold text-white">{stats.aRisque}</h3>
            <p className="text-[10px] text-red-200 mt-2 font-semibold">Alertes critiques</p>
          </div>
          <div className="p-3 bg-white/20 text-white rounded-lg backdrop-blur-sm">
            <span className="material-symbols-outlined">error</span>
          </div>
        </div>
        
        {/* Terminés - Vert */}
        <div className="bg-green-500 p-6 rounded-xl border-b-4 border-green-600 flex justify-between items-start shadow-lg">
          <div>
            <p className="text-xs font-bold text-green-100 mb-1">Terminés</p>
            <h3 className="text-3xl font-bold text-white">{stats.terminees}</h3>
            <p className="text-[10px] text-green-200 mt-2 font-semibold">Objectifs atteints</p>
          </div>
          <div className="p-3 bg-white/20 text-white rounded-lg backdrop-blur-sm">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
        </div>
      </section>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800">{error}</div>
          <button
            onClick={loadDaos}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Table Section */}
      <section className="mt-16 space-y-6 border border-slate-100 rounded-lg p-4 bg-white">
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[11px] font-bold tracking-widest uppercase">
                <th className="px-6 py-4 border border-slate-100 rounded-t-lg">Nom</th>
                <th className="px-6 py-4 border border-slate-100 rounded-t-lg">Type de DAO</th>
                <th className="px-6 py-4 border border-slate-100 rounded-t-lg">Référence</th>
                <th className="px-6 py-4 border border-slate-100 rounded-t-lg">Autorité contractante</th>
                <th className="px-6 py-4 border border-slate-100 rounded-t-lg">Chef Projet</th>
                <th className="px-6 py-4 border border-slate-100 rounded-t-lg">Groupement</th>
                <th className="px-6 py-4 border border-slate-100 rounded-t-lg">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500 border border-slate-100 rounded-b-lg">
                    Chargement...
                  </td>
                </tr>
              ) : daos.length === 0 ? (
                <tr>
                  <td 
                    colSpan={7} 
                    className="px-6 py-8 text-center text-sm text-slate-500 border border-slate-100 rounded-b-lg"
                  >
                    Aucun DAO pour le moment
                  </td>
                </tr>
              ) : (
                daos.map((dao: Dao, index: number) => {
                  const status = computeStatus(dao);
                  console.log('[Admin Dashboard] DAO %d:', index, {
                    id: dao.id,
                    numero: dao.numero,
                    reference: dao.reference,
                    autorite: dao.autorite,
                    chef_projet: dao.chef_projet,
                    type_dao: dao.type_dao,
                    groupement: dao.groupement,
                    nom_partenaire: dao.nom_partenaire,
                    statut: dao.statut,
                    computedStatus: status
                  });
                  return (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      {/* Nom - Numéro du DAO */}
                      <td className="px-6 py-5 border-l border-r border-b border-slate-100">
                        <span className="font-bold text-blue-900 text-sm">{dao.numero}</span>
                      </td>
                      
                      {/* Type de DAO - Badge */}
                      <td className="px-6 py-5 border-l border-r border-b border-slate-100">
                        {dao.type_dao ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {dao.type_dao}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      
                      {/* Référence */}
                      <td className="px-6 py-5 border-l border-r border-b border-slate-100 text-sm text-slate-600">
                        {dao.reference || "-"}
                      </td>
                      
                      {/* Autorité contractante */}
                      <td className="px-6 py-5 border-l border-r border-b border-slate-100 text-sm text-slate-600">
                        {dao.autorite || "-"}
                      </td>
                      
                      {/* Chef Projet */}
                      <td className="px-6 py-5 border-l border-r border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                            {dao.chef_projet?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <span className="text-sm text-slate-600 font-medium">
                            {dao.chef_projet || 'N/A'}
                          </span>
                        </div>
                      </td>
                      
                      {/* Groupement - Logique conditionnelle */}
                      <td className="px-6 py-5 border-l border-r border-b border-slate-100 text-sm text-slate-600">
                        {dao.groupement === "oui" ? (
                          dao.nom_partenaire ? (
                            <span style={{ whiteSpace: "pre-wrap" }}>
                              {dao.nom_partenaire.replace(/,/g, ",\n")}
                            </span>
                          ) : (
                            <span>-</span>
                          )
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      
                      {/* Statut - Badge calculé */}
                      <td className="px-6 py-4 border-l border-r border-b border-slate-100 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
