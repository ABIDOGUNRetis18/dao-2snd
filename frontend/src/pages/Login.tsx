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
    <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface selection:bg-secondary-fixed-dim overflow-hidden">
      <main className="min-h-screen flex flex-col md:flex-row">
        {/* Left Section: Visual Narrative (Clean & Natural) */}
        <section className="hidden md:flex md:w-1/2 relative overflow-hidden bg-surface-container">
          {/* Replaced mix-blend-overlay and heavy blue opacity with clear, natural appearance */}
          <img 
            alt="Modern corporate office lobby" 
            className="absolute inset-0 w-full h-full object-cover" 
            data-alt="Professional engineering documents and architectural blueprints on a modern office desk with a laptop and a pen, clean background without any text overlays or watermarks, high-quality photography, corporate office setting, focus on paperwork and tender documents, blue and professional tones." 
            src="/image.png"
          />
          {/* Adjusted gradient to be more subtle (dark at bottom for text legibility) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          <div className="relative z-10 flex flex-col justify-between p-16 w-full text-white">
            <div>
              <span className="text-xs font-bold tracking-[0.3em] uppercase opacity-90 mb-4 block drop-shadow-md">Precision Engineering</span>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tighter drop-shadow-lg">
                Innovating for <br/>
                <span className="text-secondary-fixed">Future.</span>
              </h1>
            </div>
            <div className="max-w-md">
              <p className="text-lg opacity-95 font-light leading-relaxed mb-8 drop-shadow-md">
                2SND Technologies provides industrial-grade solutions for complex engineering challenges. Access your dashboard to manage precision instruments and real-time data.
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-[2px] bg-secondary"></div>
                <span className="text-sm font-semibold tracking-widest uppercase drop-shadow-sm">Member Portal</span>
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
              <h2 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Welcome Back</h2>
              <p className="text-on-surface-variant font-medium opacity-70">Enter your credentials to access your secure workspace.</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface tracking-wide uppercase opacity-80" htmlFor="email">Email Address</label>
                <input 
                  className="w-full bg-surface-container-low border-none focus:ring-0 focus:border-b-2 focus:border-primary px-4 py-4 rounded-lg text-on-surface placeholder:text-outline/50 transition-all" 
                  id="email" 
                  placeholder="name@2snd.com" 
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-semibold text-on-surface tracking-wide uppercase opacity-80" htmlFor="password">Password</label>
                  <a className="text-sm font-bold text-primary hover:text-secondary transition-colors" href="#">Forgot password?</a>
                </div>
                <div className="relative">
                  <input 
                    className="w-full bg-surface-container-low border-none focus:ring-0 focus:border-b-2 focus:border-primary px-4 py-4 rounded-lg text-on-surface placeholder:text-outline/50 transition-all" 
                    id="password" 
                    placeholder="•••••" 
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
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
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
                <label className="text-sm font-medium text-on-surface-variant cursor-pointer group-hover:text-on-surface transition-colors" htmlFor="remember">Remember me for 30 days</label>
              </div>

              {/* CTA: Orange primary button preserved */}
              <button 
                className="w-full bg-secondary text-on-secondary font-bold py-5 rounded-lg tracking-widest text-sm hover:opacity-90 active:scale-[0.98] transition-all uppercase shadow-lg shadow-secondary/20" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin"></div>
                    SIGN IN
                  </div>
                ) : (
                  'SIGN IN'
                )}
              </button>
            </form>

            {/* Demo Access */}
            <div className="mt-12 pt-10 border-t border-outline-variant/30">
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-outline uppercase mb-6">Demo Environments</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="flex flex-col items-start p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors text-left group">
                  <span className="text-xs font-bold text-on-surface mb-1">Lead Engineer</span>
                  <span className="text-[10px] text-on-surface-variant opacity-60">engineer_demo@2snd.com</span>
                </button>
                <button className="flex flex-col items-start p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors text-left group">
                  <span className="text-xs font-bold text-on-surface mb-1">Systems Admin</span>
                  <span className="text-[10px] text-on-surface-variant opacity-60">admin_demo@2snd.com</span>
                </button>
              </div>
            </div>

            {/* Footer Links (Subtle) */}
            <footer className="mt-12 flex justify-between items-center text-[11px] text-on-surface-variant opacity-50 font-medium">
              <p>© 2024 2SND Technologies</p>
              <div className="flex gap-4">
                <a className="hover:text-primary transition-colors" href="#">Privacy</a>
                <a className="hover:text-primary transition-colors" href="#">Terms</a>
                <a className="hover:text-primary transition-colors" href="#">Security</a>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </div>
  )
}
