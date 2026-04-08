import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Menu, X, MessageSquare, Bell, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface AppHeaderProps {
  mobileMenuOpen: boolean
  onToggleMobileMenu: () => void
}

export default function AppHeader({ mobileMenuOpen, onToggleMobileMenu }: AppHeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const getInitial = (name: string) => name.charAt(0).toUpperCase()

  const getRoleName = (roleId: number) => {
    const roles = {
      1: 'directeur',
      2: 'admin',
      3: 'chef_projet',
      4: 'membre_equipe',
      5: 'lecteur'
    }
    return roles[roleId as keyof typeof roles] || 'lecteur'
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <button className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg" onClick={onToggleMobileMenu}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors relative">
            <MessageSquare className="h-5 w-5" />
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 pl-4 border-l border-slate-200 hover:bg-slate-50 rounded-lg transition-colors group"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-slate-100 ${
                user?.role_id === 2 ? 'bg-blue-100' :
                user?.role_id === 1 ? 'bg-purple-100' :
                user?.role_id === 3 ? 'bg-green-100' :
                user?.role_id === 4 ? 'bg-orange-100' :
                'bg-gray-100'
              }`}>
                <span className={`font-semibold text-sm ${
                  user?.role_id === 2 ? 'text-blue-600' :
                  user?.role_id === 1 ? 'text-purple-600' :
                  user?.role_id === 3 ? 'text-green-600' :
                  user?.role_id === 4 ? 'text-orange-600' :
                  'text-gray-600'
                }`}>
                  {user ? getInitial(user.username) : 'U'}
                </span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-slate-700">{user?.username}</div>
                <div className="text-xs text-slate-500">{getRoleName(user?.role_id || 5)}</div>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-50">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Deconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}