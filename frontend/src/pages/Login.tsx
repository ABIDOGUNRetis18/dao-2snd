import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
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
        default:
          navigate('/admin')
      }
    }
  }, [isLoading, isAuthenticated, navigate])

  // Afficher un écran de chargement pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-on-surface-variant">Vérification de l'authentification...</p>
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
    <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface">
      
      {/* Login Interface */}
      <section className="w-full max-w-md px-8 py-12">
        <div className="w-full max-w-[440px]">
          {/* Brand Anchor */}
          <div className="mb-12">
            <img 
              alt="2SND Logo" 
              className="h-10 mb-8" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCD9u9eksxnhsui0mQ7c-L_Dcx-pj9DFBtbum_BI5tBakeq9RyvjoiqAp4Jh8nkurMs320e6_jOStGpUa0crZGlpN9kvfXg-MBFYZUTcBCp85QPFvQqb-UMXt_eSAXu8Dx0XO7OaAFghtLEaDMIcFnWEck6jwEuBN1m7QwPyZuqpARxCMAOoAOncM_p_6sKhiqadCfue0WsZ1IyIZQa_nXNylJIINWEWJPoYCG4khbHFygkwcRpLauKYmSFKQIHaeP9wlrAHI0RLSs"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-error-container border border-error rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-on-error flex-shrink-0" />
              <span className="text-on-error text-sm">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface tracking-wide uppercase opacity-80" htmlFor="username">
                Adresse Email
              </label>
              <input 
                className="w-full bg-surface-container-low border-none focus:ring-0 focus:border-b-2 focus:border-primary px-4 py-4 rounded-lg text-on-surface placeholder:text-outline/50 transition-all" 
                id="username" 
                placeholder="nom@2snd.com" 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-on-surface tracking-wide uppercase opacity-80" htmlFor="password">
                  Mot de Passe
                </label>
                <a className="text-sm font-bold text-primary hover:text-secondary transition-colors" href="#">
                  Mot de passe oublié?
                </a>
              </div>
              <div className="relative">
                <input 
                  className="w-full bg-surface-container-low border-none focus:ring-0 focus:border-b-2 focus:border-primary px-4 py-4 rounded-lg text-on-surface placeholder:text-outline/50 transition-all" 
                  id="password" 
                  placeholder="Entrez le mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative flex items-center">
                <input 
                  className="w-5 h-5 rounded border-outline-variant bg-surface text-primary focus:ring-primary transition-all cursor-pointer" 
                  id="remember" 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
              </div>
              <label className="text-sm font-medium text-on-surface-variant cursor-pointer group-hover:text-on-surface transition-colors" htmlFor="remember">
                Se souvenir de moi pour 30 jours
              </label>
            </div>

            {/* CTA Button */}
            <button 
              className="w-full bg-secondary text-on-secondary font-bold py-5 rounded-lg tracking-widest text-sm hover:opacity-90 active:scale-[0.98] transition-all uppercase shadow-lg shadow-secondary/20 disabled:opacity-50" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin"></div>
                  CONNEXION...
                </div>
              ) : (
                'SE CONNECTER'
              )}
            </button>
          </form>

          
          {/* Footer Links */}
          <footer className="mt-12 flex justify-between items-center text-[11px] text-on-surface-variant opacity-50 font-medium">
            <p>© 2024 2SND Technologies</p>
            <div className="flex gap-4">
              <a className="hover:text-primary transition-colors" href="#">Confidentialité</a>
              <a className="hover:text-primary transition-colors" href="#">Conditions</a>
              <a className="hover:text-primary transition-colors" href="#">Sécurité</a>
            </div>
          </footer>
        </div>
      </section>
    </div>
  )
}
