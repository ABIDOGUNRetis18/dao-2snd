import { useAuth } from '../contexts/AuthContext'

interface AppHeaderProps {
  title?: string
  subtitle?: string
}

export default function AppHeader({ 
  title = "Tableau de bord", 
  subtitle = "Vue d'ensemble"
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
      <div className="flex items-center gap-4">
          <button className="p-2 text-slate-500 hover:bg-slate-200/50 rounded-full transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full"></span>
          </button>
          <div className="flex items-center gap-3 ml-2 border-l border-slate-200 pl-6">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
              <img 
                src={`https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=3B82F6&color=fff&size=128`}
                alt="Avatar utilisateur"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700">{user?.username || 'Utilisateur'}</p>
            </div>
          </div>
        </div>
    </header>
  )
}
