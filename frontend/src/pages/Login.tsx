import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [, setError] = useState('')
  const [] = useState(false)
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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Section: Visual Narrative (Clean & Natural) */}
      <section className="hidden md:flex md:w-1/2 relative overflow-hidden bg-surface-container">
        {/* Replaced mix-blend-overlay and heavy blue opacity with clear, natural appearance */}
        <img 
          alt="Modern corporate office lobby" 
          className="absolute inset-0 w-full h-full object-cover" 
          data-alt="Professional engineering documents and architectural blueprints on a modern office desk with a laptop and a pen, clean background without any text overlays or watermarks, high-quality photography, corporate office setting, focus on paperwork and tender documents, blue and professional tones." 
          src="/auth-illustration.svg"
        />
        {/* Adjusted gradient to be more subtle (dark at bottom for text legibility) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-between p-16 w-full text-white">
          <div className="max-w-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-[2px] bg-secondary"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Section: Login Interface */}
      <section className="w-full md:w-1/2 flex items-center justify-center px-8 py-12 md:px-24" style={{backgroundColor: '#0867B5'}}>
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="p-5" style={{ 
            maxWidth: "400px", 
            margin: "0 auto",
            backgroundColor: "rgba(245, 247, 250, 0.15)",
            borderRadius: "12px",
            border: "1px solid rgba(230, 235, 240, 0.3)",
            boxShadow: "0 8px 32px rgba(220, 225, 235, 0.08)",
            backdropFilter: "blur(15px)"
          }}>
            {/* Brand Anchor */}
            <div className="text-center mb-4">
              <img 
                alt="2SND Logo" 
                className="mx-auto mb-4" 
                src="/logo-2snd-white.svg"
                style={{ maxWidth: "150px" }}
              />
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface tracking-wide uppercase opacity-80" htmlFor="email">Adresse Email</label>
              <input 
                className="w-full bg-surface-container-low border-none focus:ring-0 focus:border-b-2 focus:border-primary px-4 py-4 rounded-lg text-on-surface placeholder:text-outline/50 transition-all" 
                id="email" 
                placeholder="nom@2snd.com" 
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
                <label className="block text-sm font-semibold text-on-surface tracking-wide uppercase opacity-80" htmlFor="password">Mot de passe</label>
                <a className="text-sm font-bold text-primary hover:text-secondary transition-colors" href="#">Mot de passe oublié?</a>
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


            {/* CTA: Orange primary button preserved */}
            <button 
              className="w-full bg-secondary text-on-secondary font-bold py-5 rounded-lg tracking-widest text-sm hover:opacity-90 active:scale-[0.98] transition-all uppercase shadow-lg shadow-secondary/20" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin"></div>
                  SE CONNECTER
                </div>
              ) : (
                'SE CONNECTER'
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  </div>
  )
}
