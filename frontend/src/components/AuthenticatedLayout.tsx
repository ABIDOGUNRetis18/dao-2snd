import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface User {
  id: number
  username: string
  email: string
  role_id: number
}

interface AuthenticatedLayoutProps {
  children?: React.ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const checkUserRoleAndRedirect = async () => {
      try {
        const token = localStorage.getItem('token')
        
        if (!token) {
          navigate('/')
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
            
            // Ne pas rediriger si l'utilisateur est déjà sur la bonne page
            const isOnCorrectPage = 
              (user.role_id === 1 && location.pathname === '/directeur-general') ||
              (user.role_id === 2 && (location.pathname === '/admin' || location.pathname.startsWith('/admin/'))) ||
              (user.role_id === 3 && (location.pathname === '/chef-projet' || location.pathname.startsWith('/chef-projet/'))) ||
              (user.role_id === 4 && location.pathname === '/membre-equipe') ||
              (user.role_id === 5 && location.pathname === '/lecteur') ||
              (user.role_id === 6 && (location.pathname === '/organisation' || location.pathname.startsWith('/organisation/')))

            if (!isOnCorrectPage) {
              // Rediriger selon le rôle exact
              switch (user.role_id) {
                case 1: // Directeur Général
                  navigate('/directeur-general')
                  return
                case 2: // Administrateur
                  navigate('/admin')
                  return
                case 3: // Chef de Projet
                  navigate('/chef-projet/dashboard')
                  return
                case 4: // Membre d'Équipe
                  navigate('/membre-equipe')
                  return
                case 5: // Lecteur
                  navigate('/lecteur')
                  return
                case 6: // Organisation
                  navigate('/organisation')
                  return
                default:
                  navigate('/admin')
                  return
              }
            }
          }
        } else {
          // En cas d'erreur, rediriger vers le login
          navigate('/')
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du rôle:', error)
        navigate('/')
      } finally {
        setLoading(false)
        setChecked(true)
      }
    }

    checkUserRoleAndRedirect()
  }, [navigate, location.pathname])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">Chargement...</div>
      </div>
    )
  }

  // Vérifier si c'est une route admin ou chef-projet (qui utilisent Outlet)
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isChefProjetRoute = location.pathname.startsWith('/chef-projet')
  const isOrganisationRoute = location.pathname.startsWith('/organisation')
  
  if (isAdminRoute || isChefProjetRoute || isOrganisationRoute) {
    // Ces routes utilisent leur propre layout avec Outlet, pas besoin de wrapping supplémentaire
    return <>{children}</>
  }

  // Pour les autres rôles, rendre directement les enfants
  return <>{children}</>
}
