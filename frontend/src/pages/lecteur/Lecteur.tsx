import { useState, useEffect, useMemo } from 'react'
import { Search, Grid } from 'lucide-react'
import { Link } from 'react-router-dom'

// Importer Chart.js
import Chart from 'chart.js/auto'

interface DAO {
  id: number
  reference?: string
  numero: string
  objet: string
  statut: string
  chef_projet_nom: string
  created_at: string
  date_depot?: string
  description?: string
}

interface Task {
  id: number
  id_task: number
  dao_id: number
  title: string
  description: string
  progress: number
  statut: string
  assigned_to?: number
  assigned_username?: string
  created_at: string
}




export default function Lecteur() {
  const [daos, setDaos] = useState<DAO[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedDao, setSelectedDao] = useState<DAO | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
      
      // 1. Fetch DAOs depuis le vrai backend
      console.log("Début de la requête GET /api/daos")
      const daosResponse = await fetch('http://localhost:3001/api/dao', {
        method: 'GET',
        headers
      })
      
      if (!daosResponse.ok) {
        throw new Error(`HTTP error! status: ${daosResponse.status}`)
      }
      
      const daosData = await daosResponse.json()
      console.log("Résultat de la requête des DAO:", JSON.stringify(daosData, null, 2))
      
      // 2. Validation de la structure de réponse
      if (!daosData.success) {
        throw new Error(daosData.message || 'Erreur lors du chargement des DAOs')
      }
      
      // 3. Vérification et adaptation des données
      let daoRows: any[] = []
      
      if (Array.isArray(daosData.data)) {
        daoRows = daosData.data
      } else if (daosData.data && typeof daosData.data === 'object') {
        const possibleArrays = Object.values(daosData.data).filter(Array.isArray)
        daoRows = possibleArrays.length > 0 ? possibleArrays[0] : []
      } else {
        console.warn("Structure de données inattendue, utilisation d'un tableau vide")
        daoRows = []
      }
      
      console.log(`DAO trouvés: ${daoRows.length}`)
      
      // 4. Formatage des données pour le frontend
      const adaptedDaos: DAO[] = daoRows.map((dao: any) => ({
        id: dao.id,
        reference: dao.reference || dao.numero || `DAO-${dao.id}`,
        numero: dao.numero || `DAO${dao.id}`,
        objet: dao.objet || dao.object || 'Sans objet',
        statut: dao.statut || dao.status || 'EN_COURS',
        chef_projet_nom: dao.chef_projet_nom || dao.chef_projet || 'Non assigné',
        created_at: dao.created_at || dao.createdAt || new Date().toISOString(),
        date_depot: dao.date_depot || dao.date_depot || null,
        description: dao.description || dao.desc || null
      }))
      
      // 5. Stockage dans le state
      setDaos(adaptedDaos)
      console.log("DAOs stockés dans le state:", adaptedDaos.length)

    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour charger les tâches d'un DAO spécifique
  const loadTasksForDao = async (daoId: number) => {
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
      
      console.log(`=== CHARGEMENT DES TÂCHES POUR DAO ${daoId} ===`)
      console.log(`URL: http://localhost:3001/api/tasks?daoId=${daoId}`)
      
      const tasksResponse = await fetch(`http://localhost:3001/api/tasks?daoId=${daoId}`, {
        method: 'GET',
        headers
      })
      
      console.log('Status de la réponse tasks:', tasksResponse.status)
      
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        console.log("Résultat de la requête des tâches:", JSON.stringify(tasksData, null, 2))
        
        // Validation de la structure de réponse
        if (!tasksData.success) {
          throw new Error(tasksData.message || 'Erreur lors du chargement des tâches')
        }
        
        // Vérification et adaptation des données
        let taskRows: any[] = []
        
        if (Array.isArray(tasksData.data)) {
          taskRows = tasksData.data
        } else if (tasksData.data && typeof tasksData.data === 'object') {
          const possibleArrays = Object.values(tasksData.data).filter(Array.isArray)
          taskRows = possibleArrays.length > 0 ? possibleArrays[0] : []
        } else {
          console.warn("Structure de données inattendue, utilisation d'un tableau vide")
          taskRows = []
        }
        
        console.log(`Tâches trouvées pour DAO ${daoId}: ${taskRows.length}`)
        
        // Formatage des données pour le frontend
        const adaptedTasks: Task[] = taskRows.map((task: any) => ({
          id: task.id,
          id_task: task.id_task || task.id,
          dao_id: task.dao_id,
          title: task.title || task.titre || 'Sans titre',
          description: task.description || task.desc || '',
          progress: task.progress || 0,
          statut: task.statut || task.status || 'en_cours',
          assigned_to: task.assigned_to,
          assigned_username: task.assigned_username,
          created_at: task.created_at || task.createdAt || new Date().toISOString()
        }))
        
        // Stockage dans le state
        setTasks(adaptedTasks)
        console.log("Tâches stockées dans le state:", adaptedTasks.length)
      } else {
        console.error('Erreur lors du chargement des tâches:', tasksResponse.statusText)
        setTasks([]) // Vider les tâches en cas d'erreur
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error)
      setTasks([]) // Vider les tâches en cas d'erreur
    }
  }

  const filteredDaos = daos.filter(dao => 
    dao.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dao.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dao.chef_projet_nom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calcul des statistiques avec useMemo
  const stats = useMemo(() => {
    const today = new Date();
    
    return {
      totalDaos: daos.length,
      completedDaos: daos.filter(d => {
        const statut = String(d.statut || "").toUpperCase();
        return statut === "TERMINEE" || statut === "TERMINE";
      }).length,
      inProgressDaos: daos.filter(d => {
        const statut = String(d.statut || "").toUpperCase();
        if (statut === "TERMINEE" || statut === "TERMINE") return false;
        if (!d.date_depot) return true; // Sans date = en cours
        
        const dateDepot = new Date(d.date_depot);
        const diffDays = Math.floor((dateDepot.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 4; // Plus de 4 jours avant échéance
      }).length,
      atRiskDaos: daos.filter(d => {
        const statut = String(d.statut || "").toUpperCase();
        if (statut === "TERMINEE" || statut === "TERMINE") return false;
        if (!d.date_depot) return false;
        
        const dateDepot = new Date(d.date_depot);
        const diffDays = Math.floor((dateDepot.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 3; // 3 jours ou moins avant échéance
      }).length,
    };
  }, [daos]);

  // Filtrage des tâches par DAO sélectionné
  const selectedDaoTasks = useMemo(() => {
    console.log('=== DEBUG SELECTED DAO TASKS ===');
    console.log('selectedDao:', selectedDao);
    console.log('tasks.length:', tasks.length);
    console.log('tasks sample:', tasks.slice(0, 3));
    
    if (!selectedDao) {
      console.log('Pas de DAO sélectionné, retour tableau vide');
      return [];
    }
    
    // Vérifier si les tâches ont bien un dao_id
    const tasksWithDaoId = tasks.filter(task => task.dao_id !== undefined && task.dao_id !== null);
    console.log('Tâches avec dao_id valide:', tasksWithDaoId.length);
    
    const filtered = tasks.filter(task => task.dao_id === selectedDao.id);
    console.log('Tâches filtrées pour DAO', selectedDao.id, ':', filtered.length);
    console.log('Tâches filtrées sample:', filtered.slice(0, 3));
    
    // Afficher les IDs des DAOs disponibles dans les tâches
    const daoIdsInTasks = [...new Set(tasks.map(task => task.dao_id))];
    console.log('DAO IDs disponibles dans les tâches:', daoIdsInTasks);
    
    return filtered;
  }, [selectedDao, tasks]);

  
  // Gestion de la sélection de DAO
  const handleDaoSelect = async (dao: DAO) => {
    console.log('=== SÉLECTION DAO ===');
    console.log('DAO sélectionné:', dao);
    console.log('DAO ID:', dao.id);
    
    setSelectedDao(dao);
    
    // Charger les tâches pour ce DAO
    await loadTasksForDao(dao.id);
  };

  
  // Fonction pour calculer le statut visuel d'un DAO
  const getDAOStatus = (dao: DAO) => {
    const statut = String(dao.statut || "").toUpperCase();
    
    // 1. DAO terminé
    if (statut === "TERMINEE" || statut === "TERMINE") {
      return { 
        label: "Terminée", 
        className: "bg-green-100 text-green-800"  // Badge vert
      };
    }
    
    // 2. DAO sans date d'échéance
    if (!dao.date_depot) {
      return { 
        label: "En cours", 
        className: "bg-yellow-100 text-yellow-800"  // Badge jaune
      };
    }
    
    const today = new Date();
    const dateDepot = new Date(dao.date_depot);
    const diffDays = Math.floor((dateDepot.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // 3. DAO avec échéance lointaine
    if (diffDays >= 4) {
      return { 
        label: "En cours", 
        className: "bg-yellow-100 text-yellow-800"  // Badge jaune
      };
    }
    
    // 4. DAO avec échéance proche
    if (diffDays <= 3) {
      return { 
        label: "À risque", 
        className: "bg-red-100 text-red-800"  // Badge rouge
      };
    }
    
    // 5. Par défaut
    return { 
      label: "En cours", 
      className: "bg-yellow-100 text-yellow-800"
    };
  };


  // Gestionnaire pour désélectionner le DAO lors d'un clic en dehors
  const handleBackgroundClick = () => {
    console.log('🔍 Debug - Clic dans le vide, désélection du DAO');
    setSelectedDao(null);
  };

  // Optimisation : calcul des données de graphiques avec useMemo
  const chartData = useMemo(() => {
    console.log('=== TRANSMISSION DONNÉES GRAPHIQUES ===');
    console.log('selectedDao:', selectedDao);
    console.log('selectedDaoTasks:', selectedDaoTasks);
    
    // Étape 1: Vérification préalable
    if (!selectedDao) {
      console.log('Pas de DAO sélectionné - retour données vides');
      return {
        progressData: { labels: [], data: [], backgroundColor: [] },
        statusData: { data: [0, 0, 0] }
      };
    }

    // Étape 2: Filtrage des tâches du DAO (toutes les tâches, pas seulement assignées)
    const daoTasks = tasks.filter(task => task.dao_id === selectedDao.id);
    console.log('Tâches du DAO sélectionné:', daoTasks.length);
    
    if (daoTasks.length === 0) {
      console.log('Aucune tâche pour ce DAO - retour données vides');
      return {
        progressData: { labels: [], data: [], backgroundColor: [] },
        statusData: { data: [0, 0, 0] }
      };
    }

    // Étape 3: Données pour le graphique de progression (toutes les tâches du DAO)
    const sortedTasks = [...daoTasks].sort((a, b) => a.id_task - b.id_task);
    const progressData = {
      // Labels (Axe X) : IDs des tâches triées
      labels: sortedTasks.map(t => t.id_task.toString()),
      // Données (Axe Y) : Progression de chaque tâche
      data: sortedTasks.map(t => t.progress || 0),
      // Couleurs (par barre) : Selon la progression
      backgroundColor: sortedTasks.map(t => {
        const progress = t.progress || 0;
        if (progress === 100) return 'rgba(34, 197, 94, 0.8)';      // Vert
        if (progress >= 75) return 'rgba(59, 130, 246, 0.8)';      // Bleu
        if (progress >= 50) return 'rgba(251, 146, 60, 0.8)';     // Orange
        if (progress >= 25) return 'rgba(250, 204, 21, 0.8)';     // Jaune
        return 'rgba(239, 68, 68, 0.8)';                           // Rouge
      })
    };

    // Étape 4: Données pour le graphique de distribution (toutes les tâches du DAO)
    const statusCounts = {
      completed: daoTasks.filter(t => (t.progress || 0) === 100).length,
      inProgress: daoTasks.filter(t => {
        const progress = t.progress || 0;
        return progress > 0 && progress < 100;
      }).length,
      notStarted: daoTasks.filter(t => (t.progress || 0) === 0).length,
    };
    
    const statusData = {
      // Données transmises : [terminées, en cours, non démarrées]
      data: [statusCounts.completed, statusCounts.inProgress, statusCounts.notStarted]
    };

    console.log('=== TRANSMISSION AU GRAPHIQUE PROGRESSION ===');
    console.log('Labels (Axe X):', progressData.labels);
    console.log('Données (Axe Y):', progressData.data);
    console.log('Couleurs (par barre):', progressData.backgroundColor);
    
    console.log('=== TRANSMISSION AU GRAPHIQUE DISTRIBUTION ===');
    console.log('Compteurs:', statusCounts);
    console.log('Données transmises:', statusData.data);

    return { progressData, statusData };
  }, [selectedDao, tasks]);

  // useEffect pour les graphiques Chart.js - Flux de transmission adapté
  useEffect(() => {
    console.log('=== DÉCLENCHEMENT FLUX TRANSMISSION ===');
    console.log('selectedDao:', selectedDao);
    console.log('chartData:', chartData);
    
    // Étape 1: Conditions préalables
    if (!selectedDao) {
      console.log('❌ Pas de DAO sélectionné - fin du flux');
      return;
    }
    
    // Étape 2: Timer pour DOM prêt
    const timer = setTimeout(() => {
      console.log('✅ DOM prêt - début transmission aux graphiques');
      
      // Étape 3: Récupération des canvas
      const progressCtx = document.getElementById('progressChart') as HTMLCanvasElement;
      const statusCtx = document.getElementById('statusChart') as HTMLCanvasElement;
      
      if (!progressCtx || !statusCtx) {
        console.log('❌ Canvas non trouvés - transmission interrompue');
        return;
      }
      
      // Étape 4: Détruire graphiques existants
      const existingProgressChart = Chart.getChart('progressChart');
      const existingStatusChart = Chart.getChart('statusChart');
      if (existingProgressChart) existingProgressChart.destroy();
      if (existingStatusChart) existingStatusChart.destroy();
      
      // Étape 5: Préparation des données pour transmission
      const hasData = chartData.progressData.labels.length > 0;
      
      const progressLabels = hasData ? chartData.progressData.labels : ['Aucune tâche'];
      const progressValues = hasData ? chartData.progressData.data : [0];
      const progressColors = hasData ? chartData.progressData.backgroundColor : ['rgba(200, 200, 200, 0.8)'];
      
      const statusValues = hasData ? chartData.statusData.data : [0, 0, 0];
      
      console.log('📊 TRANSMISSION GRAPHIQUE PROGRESSION:');
      console.log('  Labels (Axe X):', progressLabels);
      console.log('  Données (Axe Y):', progressValues);
      console.log('  Couleurs (par barre):', progressColors);
      
      console.log('🍩 TRANSMISSION GRAPHIQUE DISTRIBUTION:');
      console.log('  Données transmises:', statusValues);
      console.log('  Labels: ["Terminées", "En cours", "Non démarrées"]');
      
      // Étape 6: Transmission au graphique de progression
      console.log('🚀 Création graphique progression...');
      new Chart(progressCtx, {
        type: 'bar',
        data: {
          labels: progressLabels,
          datasets: [{
            label: 'Progression des tâches (%)',
            data: progressValues,
            backgroundColor: progressColors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
      
      // Étape 7: Transmission au graphique de distribution
      console.log('🚀 Création graphique distribution...');
      new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: ['Terminées', 'En cours', 'Non démarrées'],
          datasets: [{
            data: statusValues,
            backgroundColor: [
              'rgba(34, 197, 94, 0.8)',   // Vert
              'rgba(251, 146, 60, 0.8)',  // Orange
              'rgba(239, 68, 68, 0.8)'    // Rouge
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
      
      console.log('✅ Transmission terminée avec succès');
    }, 100); // Timer pour DOM prêt

    return () => {
      clearTimeout(timer);
    };
  }, [selectedDao, chartData]); // Déclenché par changement de DAO ou de données // Dépend sur selectedDao, selectedDaoTasks et chartData

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6" onClick={handleBackgroundClick}>
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher des projets ou documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Link
              to="/lecteur/all-daos"
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
            >
              <Grid className="h-4 w-4" />
              Tous les DAOs
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 -mt-4 mb-6">
          {/* Card 1 - Total DAOs */}
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

          {/* Card 2 - Terminées */}
          <div className="bg-green-500 p-6 rounded-xl border-b-4 border-green-600 flex justify-between items-start shadow-lg">
            <div>
              <p className="text-xs font-bold text-green-100 mb-1">Terminées</p>
              <h3 className="text-3xl font-headline font-bold text-white">{stats.completedDaos}</h3>
              <p className="text-[10px] text-green-200 mt-2 font-semibold">All targets met</p>
            </div>
            <div className="p-3 bg-white/20 text-white rounded-lg backdrop-blur-sm">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>

          {/* Card 3 - En cours */}
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

          {/* Card 4 - À risque */}
          <div className="bg-red-400 p-6 rounded-xl border-b-4 border-red-500 flex justify-between items-start shadow-lg">
            <div>
              <p className="text-xs font-bold text-red-100 mb-1">À risque</p>
              <h3 className="text-3xl font-headline font-bold text-white">{stats.atRiskDaos}</h3>
              <p className="text-[10px] text-red-200 mt-2 font-semibold">Critical alerts</p>
            </div>
            <div className="p-3 bg-white/20 text-white rounded-lg backdrop-blur-sm">
              <span className="material-symbols-outlined">warning</span>
            </div>
          </div>
        </div>

        {/* DAO Selection and Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* DAO Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h6 className="text-lg font-semibold text-gray-800 mb-4">Sélectionner un DAO</h6>
            <div className="space-y-2 max-h-64 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {filteredDaos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">Aucun DAO disponible</p>
                </div>
              ) : (
                filteredDaos.map((dao) => {
                  const status = getDAOStatus(dao);
                  return (
                    <div
                      key={dao.id}
                      onClick={() => handleDaoSelect(dao)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDao?.id === dao.id 
                          ? 'border-blue-500 bg-blue-50'        // DAO sélectionné
                          : 'border-gray-200 hover:border-gray-300'  // DAO normal
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">{dao.reference || `DAO-${dao.id}`}</p>
                          <p className="text-sm text-gray-600">{dao.objet || 'Sans objet'}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Progress Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h6 className="text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">analytics</span>
              Progression des tâches {selectedDao ? `- ${selectedDao.reference}` : ''}
            </h6>
            <div className="relative h-64">
              {selectedDao ? (
                <canvas id="progressChart"></canvas>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <span className="material-symbols-outlined text-2xl">analytics</span>
                    <p className="mt-2">Sélectionnez un DAO</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Chart and Task List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h6 className="text-sm font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">donut_large</span>
              Distribution des statuts {selectedDao ? `- ${selectedDao.reference}` : ''}
            </h6>
            <div className="relative h-64">
              {selectedDao ? (
                <canvas id="statusChart"></canvas>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <span className="material-symbols-outlined text-2xl">donut_large</span>
                    <p className="mt-2">Sélectionnez un DAO</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Task List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h6 className="text-lg font-semibold text-gray-800 mb-4">
              Liste des tâches {selectedDao ? `- ${selectedDao.reference}` : ''}
            </h6>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedDaoTasks.length > 0 ? (
                selectedDaoTasks.map(task => (
                  <div key={task.id} className="p-3 border border-gray-200 rounded-lg">
                    {/* En-tête avec titre et pourcentage */}
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium text-gray-800">{task.title || `Tâche ${task.id_task}`}</p>
                      <span className="text-sm text-gray-600">{task.progress || 0}%</span>
                    </div>
                    
                    {/* Barre de progression */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Chargement des tâches...</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48">
                  <p className="text-sm text-gray-500">Aucune tâche pour ce DAO</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
