import { useAuth } from '../contexts/AuthContext'

interface AppHeaderProps {
  title?: string
  subtitle?: string
  searchTerm?: string
  onSearchChange?: (searchTerm: string) => void
  showSearch?: boolean
}

export default function AppHeader({ 
  title = "Tableau de bord", 
  subtitle = "Vue d'ensemble",
  searchTerm = "",
  onSearchChange,
  showSearch = true 
}: AppHeaderProps) {
  const { user } = useAuth()

  const getInitial = (name: string) => name.charAt(0).toUpperCase()

  const getRoleName = (roleId: number) => {
    const roles = {
      1: 'Directeur Général',
      2: 'Administrateur',
      3: 'Chef de Projet',
      4: 'Membre d\'Équipe',
      5: 'Lecteur'
    }
    return roles[roleId as keyof typeof roles] || 'Utilisateur'
  }

  return (
    <header className="w-full sticky top-0 z-40 bg-slate-50/80 backdrop-blur-xl flex items-center justify-between px-8 py-4">
      <div className="flex flex-col">
        <h2 className="font-headline font-bold tracking-tight text-blue-900 text-xl">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="flex items-center gap-6">
        {showSearch && (
          <div className="relative">
            <input
              className="bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:ring-2 focus:ring-primary"
              placeholder="Rechercher..."
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
            <span className="material-symbols-outlined absolute left-3 top-2 text-slate-400 text-sm">search</span>
          </div>
        )}
        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-500 hover:bg-slate-200/50 rounded-full transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full"></span>
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-200/50 rounded-full transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="flex items-center gap-3 ml-2 border-l border-slate-200 pl-6">
            <div className="text-right">
              <p className="text-sm font-bold text-blue-900">{user?.username || 'Admin User'}</p>
              <p className="text-[10px] text-slate-500 font-medium">{getRoleName(user?.role_id || 2)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center border-2 border-white shadow-sm">
              <span className="text-slate-600 font-bold text-sm">
                {user?.username ? getInitial(user.username) : 'A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
