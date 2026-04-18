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

  const handleDemoLogin = (demoUsername: string, demoPassword: string) => {
    setUsername(demoUsername)
    setPassword(demoPassword)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface text-on-surface">
      {/* Left Section: Visual Narrative */}
      <section className="hidden md:flex md:w-1/2 relative overflow-hidden bg-surface-container">
        <img 
          alt="Modern corporate office lobby" 
          className="absolute inset-0 w-full h-full object-cover" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUpkILUw87ZsXWKuYveDkAnNSpd10ApZabn_zQ1JFBa47iACJIltR3B5FDxAH_zYMD0V_F0daWEYzp_Rc8jIbplcZF4ALiG6Fomn2c_6Lv8GjwPFZ55y65M1R5w9U1O7XCXHdTH3TPB2YhZdxOgCTYpLdTIAlHU-0PjOK9rckKvHk02bFyIAoww1CXxT8fmbIXW3zduo3aq172sXEEVkBbC_DCgFyPzgv9eVL4AFSSziac3wgBL-qzIxUmY2hsSI6uQgo1JOz2BDk"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-between p-16 w-full text-white">
          <div>
            <span className="text-xs font-bold tracking-[0.3em] uppercase opacity-90 mb-4 block drop-shadow-md">Ingénierie de Précision</span>
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tighter drop-shadow-lg">
              Innovant le <br/>
              <span className="text-secondary-fixed">Futur.</span>
            </h1>
          </div>
          <div className="max-w-md">
            <p className="text-lg opacity-95 font-light leading-relaxed mb-8 drop-shadow-md">
              2SND Technologies fournit des solutions de qualité industrielle pour les défis d'ingénierie complexes. Accédez à votre tableau de bord pour gérer les instruments de précision et les données en temps réel.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-[2px] bg-secondary"></div>
              <span className="text-sm font-semibold tracking-widest uppercase drop-shadow-sm">Portail Membre</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right Section: Login Interface */}
      <section className="w-full md:w-1/2 flex items-center justify-center bg-surface px-8 py-12 md:px-24">
        <div className="w-full max-w-[440px]">
          {/* Brand Anchor */}
          <div className="mb-12">
            <img 
              alt="2SND Logo" 
              className="h-10 mb-8" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCD9u9eksxnhsui0mQ7c-L_Dcx-pj9DFBtbum_BI5tBakeq9RyvjoiqAp4Jh8nkurMs320e6_jOStGpUa0crZGlpN9kvfXg-MBFYZUTcBCp85QPFvQqb-UMXt_eSAXu8Dx0XO7OaAFghtLEaDMIcFnWEck6jwEuBN1m7QwPyZuqpARxCMAOoAOncM_p_6sKhiqadCfue0WsZ1IyIZQa_nXNylJIINWEWJPoYCG4khbHFygkwcRpLauKYmSFKQIHaeP9wlrAHI0RLSs"
            />
            <h2 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Bon Retour</h2>
            <p className="text-on-surface-variant font-medium opacity-70">Entrez vos identifiants pour accéder à votre espace de travail sécurisé.</p>
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

          {/* Demo Access */}
          <div className="mt-12 pt-10 border-t border-outline-variant/30">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-outline uppercase mb-6">Environnements de Démonstration</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => handleDemoLogin('jdupont', 'directeur123')}
                className="flex flex-col items-start p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors text-left group"
              >
                <span className="text-xs font-bold text-on-surface mb-1">Ingénieur Principal</span>
                <span className="text-[10px] text-on-surface-variant opacity-60">jdupont@2snd.com</span>
              </button>
              <button 
                type="button"
                onClick={() => handleDemoLogin('admin', 'admin123')}
                className="flex flex-col items-start p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors text-left group"
              >
                <span className="text-xs font-bold text-on-surface mb-1">Administrateur Système</span>
                <span className="text-[10px] text-on-surface-variant opacity-60">admin@2snd.com</span>
              </button>
            </div>
          </div>

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
