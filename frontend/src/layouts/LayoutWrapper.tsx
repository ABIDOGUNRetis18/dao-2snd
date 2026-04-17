import { Link, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, FolderOpen, CheckSquare, Users, FileText, ClipboardList, History, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import AppHeader from './header'
import AppFooter from './footer'

type MenuItem = {
  path: string
  label: string
  icon: typeof LayoutDashboard
}

const menuByRole: Record<number, MenuItem[]> = {
  1: [{ path: '/directeur-general', label: 'Dashboard', icon: LayoutDashboard }],
  2: [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/create-user', label: 'Creer utilisateur', icon: Users },
    { path: '/admin/create-dao', label: 'Creer DAO', icon: FolderOpen },
    { path: '/admin/my-daos', label: 'Mes DAO', icon: FolderOpen },
    { path: '/admin/all-daos', label: 'Tous les DAO', icon: FileText },
    { path: '/admin/my-tasks', label: 'Mes taches', icon: ClipboardList },
    { path: '/admin/history', label: 'Historique', icon: History }
  ],
  3: [
    { path: '/chef-projet/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/chef-projet/mes-daos', label: 'Mes DAO', icon: FileText },
    { path: '/chef-projet/mes-equipes', label: 'Mes équipes', icon: Users },
    { path: '/chef-projet/mes-taches', label: 'Mes tâches', icon: CheckSquare }
  ],
  4: [
    { path: '/membre-equipe', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/membre-equipe/tasks', label: 'Mes taches', icon: CheckSquare }
  ],
  5: [{ path: '/lecteur', label: 'Dashboard', icon: LayoutDashboard }]
}

export default function LayoutWrapper() {
  const location = useLocation()
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const roleId = user?.role_id ?? 5
  const menuItems = menuByRole[roleId] ?? []
  const homePath =
    roleId === 1 ? '/directeur-general' :
    roleId === 2 ? '/admin' :
    roleId === 3 ? '/chef-projet/dashboard' :
    roleId === 4 ? '/membre-equipe' :
    '/lecteur'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col overflow-y-auto">
        <div className="p-4 border-b border-slate-200">
          <Link to={homePath} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">2</span>
            </div>
            <span className="text-xl font-bold text-slate-800">SND</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(`${item.path}/`))

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden bg-slate-100">
        <AppHeader mobileMenuOpen={mobileMenuOpen} onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <Link to={homePath} className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">2</span>
                  </div>
                  <span className="text-xl font-bold text-slate-800">SND</span>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
              <nav className="p-4 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(`${item.path}/`))

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-green-50 text-green-600'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 md:p-5 bg-slate-100">
          <div className="w-full max-w-full">
            <Outlet />
          </div>
        </main>

        <AppFooter />
      </div>
    </div>
  )
}
