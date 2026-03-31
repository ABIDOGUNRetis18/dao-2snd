import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { API_BASE_URL, API_ENDPOINTS, getPublicHeaders } from '../config/api'

interface User {
  id: number
  username: string
  email: string
  url_photo?: string
  role_id: number
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (savedToken && savedUser) {
        try {
          // Vérifier si le token est encore valide
          const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE}`, {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          })

          if (response.ok) {
            const parsedUser = JSON.parse(savedUser)
            setToken(savedToken)
            setUser(parsedUser)
          } else {
            // Token invalide, nettoyer le localStorage
            console.warn('Token invalide, déconnexion...')
            logout()
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du token:', error)
          // En cas d'erreur réseau, on peut quand même utiliser les données sauvegardées
          try {
            const parsedUser = JSON.parse(savedUser)
            setToken(savedToken)
            setUser(parsedUser)
          } catch (parseError) {
            console.error('Erreur lors de la lecture des données utilisateur:', parseError)
            logout()
          }
        }
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: getPublicHeaders(),
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erreur de connexion')
      }

      if (data.success) {
        setToken(data.data.token)
        setUser(data.data.user)
        
        // Sauvegarder dans localStorage
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('user', JSON.stringify(data.data.user))
      } else {
        throw new Error(data.message || 'Erreur de connexion')
      }
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const isAuthenticated = !!user && !!token

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}
