import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface User {
  id: number
  username: string
  email: string
  role_id: number
}

interface RoleBasedRedirectProps {
  children: React.ReactNode
}

export default function RoleBasedRedirect({ children }: RoleBasedRedirectProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const checkUserRoleAndRedirect = async () => {
      try {
        const token = localStorage.getItem('token')
        
        if (!token) {
          navigate('/admin/login')
          return
        }

        // Ne pas rediriger si on est déjà sur une page spécifique (comme create-user, profile, etc.)
        const specificRoutes = ['/admin/create-user', '/admin/create-dao', '/admin/edit-dao', '/admin/profile', '/admin/history']
        if (specificRoutes.some(route => location.pathname.startsWith(route))) {
          setLoading(false)
          return
        }

        // Récupérer les informations de l'utilisateur connecté
        const response = await fetch('http://localhost:3001/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data.user) {
            const user: User = data.data.user
            
            // Rediriger selon le rôle
            switch (user.role_id) {
              case 1: // Directeur Général
                navigate('/admin/directeur-general')
                break
              case 2: // Administrateur
                navigate('/admin/directeur-general')
                break
              case 3: // Chef de Projet
                navigate('/admin/chef-projet')
                break
              case 4: // Membre d'Équipe
                navigate('/admin/membre-equipe')
                break
              case 5: // Lecteur
                navigate('/admin/lecteur')
                break
              default:
                // Si le rôle n'est pas reconnu, rester sur le dashboard par défaut
                navigate('/admin')
                break
            }
          }
        } else {
          // En cas d'erreur, rediriger vers le login
          navigate('/admin/login')
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du rôle:', error)
        navigate('/admin/login')
      } finally {
        setLoading(false)
        setChecked(true)
      }
    }

    if (!checked) {
      checkUserRoleAndRedirect()
    }
  }, [navigate, location.pathname, checked])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Chargement...</div>
      </div>
    )
  }

  return <>{children}</>
}
