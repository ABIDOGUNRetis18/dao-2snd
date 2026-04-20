import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AppHeader from './header'
import AppFooter from './footer'

interface MenuItem {
  path: string
  label: string
  icon: string
}

const menuItemsByRole: Record<number, MenuItem[]> = {
  1: [
    { path: '/directeur-general', label: 'Tableau de bord', icon: 'dashboard' },
  ],
  2: [
    { path: '/admin', label: 'Tableau de bord', icon: 'dashboard' },
    { path: '/admin/create-user', label: 'Créer utilisateur', icon: 'person_add' },
    { path: '/admin/create-dao', label: 'Créer DAO', icon: 'add_circle' },
    { path: '/admin/my-daos', label: 'Mes DAO', icon: 'folder_shared' },
    { path: '/admin/all-daos', label: 'Tous les DAO', icon: 'list_alt' },
    { path: '/admin/my-tasks', label: 'Mes taches', icon: 'assignment' },
    { path: '/admin/history', label: 'Historique', icon: 'history' },
  ],
  3: [
    { path: '/chef-projet/dashboard', label: 'Tableau de bord', icon: 'dashboard' },
    { path: '/chef-projet/mes-daos', label: 'Mes DAO', icon: 'folder_shared' },
    { path: '/chef-projet/mes-equipes', label: 'Mes équipes', icon: 'groups' },
    { path: '/chef-projet/mes-taches', label: 'Mes tâches', icon: 'assignment' },
  ],
  4: [
    { path: '/membre-equipe', label: 'Tableau de bord', icon: 'dashboard' },
    { path: '/membre-equipe/tasks', label: 'Mes tâches', icon: 'assignment' },
  ],
  5: [
    { path: '/lecteur', label: 'Tableau de bord', icon: 'dashboard' },
    { path: '/lecteur/all-daos', label: 'Tous les DAO', icon: 'list_alt' },
    { path: '/lecteur/history', label: 'Historique', icon: 'history' },
  ]
}

export default function LayoutWrapper() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/')
    }
  }, [isLoading, isAuthenticated, navigate])

  const roleId = user?.role_id ?? 5
  const menuItems = menuItemsByRole[roleId] ?? []

  
  
  const getPageTitle = () => {
    const path = location.pathname

    if (roleId === 1) { // Directeur Général
      if (path === '/directeur-general') return { title: 'Tableau de bord Directeur', subtitle: 'Vue d\'ensemble stratégique' }
    }

    if (roleId === 2) { // Admin
      if (path === '/admin') return { title: 'Tableau de bord Administrateur', subtitle: 'Vue d\'ensemble de tous les DAOs et leur état d\'avancement' }
      if (path === '/admin/create-user') return { title: 'Créer Utilisateur', subtitle: 'Gestion des comptes' }
      if (path === '/admin/create-dao') return { title: 'Créer DAO', subtitle: 'Nouveau projet' }
      if (path === '/admin/my-daos') return { title: 'Mes DAO', subtitle: 'Projets assignés' }
      if (path === '/admin/all-daos') return { title: 'Tous les DAO', subtitle: 'Liste complète' }
      if (path === '/admin/my-tasks') return { title: 'Mes Tâches', subtitle: 'Activités en cours' }
      if (path === '/admin/history') return { title: 'Historique', subtitle: 'Journal des activités' }
    }

    if (roleId === 3) { // Chef de Projet
      if (path === '/chef-projet/dashboard') return { title: 'Tableau de bord Chef de Projet', subtitle: 'Gestion des projets' }
      if (path === '/chef-projet/mes-daos') return { title: 'Mes DAO', subtitle: 'Projets supervisés' }
      if (path === '/chef-projet/mes-equipes') return { title: 'Mes Équipes', subtitle: 'Collaborateurs' }
      if (path === '/chef-projet/mes-taches') return { title: 'Mes Tâches', subtitle: 'Activités' }
      if (path === '/chef-projet/history') return { title: 'Historique', subtitle: 'Journal' }
    }

    if (roleId === 4) { // Membre d'Équipe
      if (path === '/membre-equipe') return { title: 'Tableau de bord Membre', subtitle: 'Espace de travail' }
      if (path === '/membre-equipe/tasks') return { title: 'Mes Tâches', subtitle: 'Activités assignées' }
      if (path === '/membre-equipe/history') return { title: 'Historique', subtitle: 'Journal' }
    }

    if (roleId === 5) { // Lecteur
      if (path === '/lecteur') return { title: 'Centre de Documentation', subtitle: 'Accès aux documents' }
      if (path === '/lecteur/all-daos') return { title: 'Tous les DAO', subtitle: 'Consultation' }
      if (path === '/lecteur/history') return { title: 'Historique', subtitle: 'Consultations' }
    }

    return { title: 'Tableau de bord', subtitle: 'Vue d\'ensemble' }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-slate-500">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const { title, subtitle } = getPageTitle()

  return (
    <div className="bg-background text-on-surface flex min-h-screen">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-100 flex flex-col py-6 pr-4 gap-2 z-50 border-r-2 border-slate-300 shadow-md">
        <div className="px-6 mb-6 flex justify-center">
          <img 
            src="/image.png" 
            alt="2SND Logo" 
            className="w-32 h-32 rounded-lg object-contain"
          />
        </div>
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`flex items-center gap-3 px-6 py-3 transition-transform duration-200 ${
                location.pathname === item.path
                  ? 'text-blue-700 font-bold bg-white rounded-r-full shadow-sm hover:translate-x-1'
                  : 'text-slate-600 hover:text-blue-800 hover:translate-x-1'
              }`}
              onClick={() => handleNavigation(item.path)}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-body text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto px-4 space-y-4">
          <div className="pt-4 border-t border-slate-200 flex flex-col gap-1">
            <button
              className="flex items-center gap-3 px-6 py-2 text-slate-500 hover:text-red-600 text-sm"
              onClick={handleLogout}
            >
              <span className="material-symbols-outlined">logout</span> Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen pt-20">
        {/* TopAppBar */}
        <AppHeader 
          title={title}
          subtitle={subtitle}
        />

        {/* Canvas */}
        <div className="flex-1 p-6 border border-slate-100 rounded-lg m-4 bg-white">
          <Outlet />
        </div>

        {/* Footer */}
        <AppFooter />
      </main>
    </div>
  )
}
