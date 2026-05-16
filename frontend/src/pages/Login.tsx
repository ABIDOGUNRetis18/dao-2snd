import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login, isAuthenticated, isLoading } = useAuth()

  // Rediriger si déjà authentifié
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Rediriger selon le rôle de l'utilisateur
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      switch (user.role_id) {
        case 1: // Directeur Général
          navigate('/directeur-general')
          break
        case 2: // Administrateur
          navigate('/admin')
          break
        case 3: // Chef de Projet
          navigate('/chef-projet')
          break
        case 4: // Membre d'Équipe
          navigate('/membre-equipe')
          break
        case 5: // Lecteur
          navigate('/lecteur')
          break
        case 6: // Organisation
          navigate('/organisation')
          break
        default:
          navigate('/admin')
      }
    }
  }, [isLoading, isAuthenticated, navigate])

  // Afficher un écran de chargement pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-slate-500">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(username, password)
      
      // Rediriger selon le rôle de l'utilisateur
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      switch (user.role_id) {
        case 1: // Directeur Général
          navigate('/directeur-general')
          break
        case 2: // Administrateur
          navigate('/admin')
          break
        case 3: // Chef de Projet
          navigate('/chef-projet')
          break
        case 4: // Membre d'Équipe
          navigate('/membre-equipe')
          break
        case 5: // Lecteur
          navigate('/lecteur')
          break
        case 6: // Organisation
          navigate('/organisation')
          break
        default:
          navigate('/admin')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image background with folders */}
      <div 
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200')`,
        }}
      >
        <div className="w-full h-full bg-gradient-to-r from-black/30 to-transparent" />
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">2</span>
            </div>
            <span className="text-2xl font-bold text-slate-800">SND</span>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Bienvenue sur DAO Project
            </h1>
            <p className="text-slate-500">
              Connectez-vous pour accéder à votre espace
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="sr-only">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                  placeholder="Nom d'utilisateur"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                  placeholder="Mot de passe"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  CONNEXION...
                </div>
              ) : (
                'SE CONNECTER'
              )}
            </button>
          </form>

          {/* Demo credentials info */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">Comptes de démonstration :</p>
            <div className="space-y-1 text-xs text-blue-700">
              <div><strong>admin</strong> / admin123</div>
              <div><strong>jdupont</strong> / directeur123</div>
              <div><strong>mmartin</strong> / chef123</div>
              <div><strong>pdurand</strong> / membre123</div>
              <div><strong>sbernard</strong> / lecteur123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
