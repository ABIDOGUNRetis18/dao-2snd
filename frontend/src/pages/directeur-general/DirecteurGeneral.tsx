import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, TrendingUp, BarChart3, FileText, AlertTriangle } from 'lucide-react'

interface DAO {
  id: number
  numero: string
  objet: string
  statut: string
  chef_projet_nom: string
  created_at: string
}

interface User {
  id: number
  username: string
  email: string
  role_id: number
  created_at: string
}

interface Stats {
  totalDaos: number
  totalUsers: number
  totalTasks: number
  completedTasks: number
  activeProjects: number
}

export default function DirecteurGeneral() {
  const navigate = useNavigate()
  const [daos, setDaos] = useState<DAO[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats>({
    totalDaos: 0,
    totalUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    activeProjects: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Charger les DAOs
      const daosResponse = await fetch('http://localhost:3001/api/dao', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      let daosData = { success: false, data: { daos: [] } }
      if (daosResponse.ok) {
        daosData = await daosResponse.json()
        if (daosData.success) setDaos(daosData.data.daos || [])
      }
      
      // Charger les utilisateurs
      const usersResponse = await fetch('http://localhost:3001/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      let usersData = { success: false, data: { users: [] } }
      if (usersResponse.ok) {
        usersData = await usersResponse.json()
        if (usersData.success) setUsers(usersData.data.users || [])
      }
      
      // Calculer les statistiques
      if (daosData.success && usersData.success) {
        const totalDaos = daosData.data.daos?.length || 0
        const totalUsers = usersData.data.users?.length || 0
        const completedDaos = daosData.data.daos?.filter((d: DAO) => d.statut === 'TERMINEE').length || 0
        const activeDaos = daosData.data.daos?.filter((d: DAO) => d.statut === 'EN_COURS').length || 0
        
        setStats({
          totalDaos,
          totalUsers,
          totalTasks: totalDaos * 15, // Approximation
          completedTasks: completedDaos * 15,
          activeProjects: activeDaos
        })
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE': return 'bg-yellow-100 text-yellow-700'
      case 'EN_COURS': return 'bg-blue-100 text-blue-700'
      case 'TERMINEE': return 'bg-green-100 text-green-700'
      case 'A_RISQUE': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE': return 'En attente'
      case 'EN_COURS': return 'En cours'
      case 'TERMINEE': return 'Terminé'
      case 'A_RISQUE': return 'À risque'
      default: return statut
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                DG
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Tableau de Bord - Directeur Général</h1>
                <p className="text-sm text-slate-500">Vue d'ensemble de tous les projets</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/login')}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border-b-4 border-blue-600 flex justify-between items-start shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">Total DAO</p>
              <h3 className="text-3xl font-bold text-blue-900">{stats.totalDaos}</h3>
              <p className="text-xs text-blue-600 mt-2 font-semibold">Projets totaux</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border-b-4 border-green-500 flex justify-between items-start shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">Utilisateurs</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.totalUsers}</h3>
              <p className="text-xs text-green-600 mt-2 font-semibold">Équipe active</p>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border-b-4 border-purple-500 flex justify-between items-start shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">Projets Actifs</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.activeProjects}</h3>
              <p className="text-xs text-purple-600 mt-2 font-semibold">En cours</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border-b-4 border-emerald-500 flex justify-between items-start shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">Taux de Réussite</p>
              <h3 className="text-3xl font-bold text-slate-900">
                {stats.totalDaos > 0 ? Math.round((stats.completedTasks / stats.totalDaos) * 100) : 0}%
              </h3>
              <p className="text-xs text-emerald-600 mt-2 font-semibold">Performance</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* DAOs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Projets DAO</h2>
            <button
              onClick={() => navigate('/admin/dao/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Nouveau DAO
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Numéro</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Objet</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Chef de Projet</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Créé le</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {daos.map((dao) => (
                  <tr key={dao.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-blue-600">{dao.numero}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-800">{dao.objet}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-600">{dao.chef_projet_nom}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(dao.statut)}`}>
                        {getStatutLabel(dao.statut)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-500">
                        {new Date(dao.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/dao/${dao.id}`)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Voir Détails
                        </button>
                        {dao.statut === 'A_RISQUE' && (
                          <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Alert
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">Utilisateurs</h2>
            <button
              onClick={() => navigate('/admin/users/create')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Nouvel Utilisateur
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Nom d'utilisateur</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Rôle</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Créé le</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{user.username}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-600">{user.email}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {user.role_id === 1 ? 'Directeur Général' : 
                         user.role_id === 2 ? 'Administrateur' :
                         user.role_id === 3 ? 'Chef de Projet' :
                         user.role_id === 4 ? 'Membre Équipe' :
                         user.role_id === 5 ? 'Lecteur' : 'Inconnu'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-500">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => navigate(`/admin/users/${user.id}/permissions`)}
                          className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        >
                          Permissions
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
