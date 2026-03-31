// Configuration de l'API
export const API_BASE_URL = 'http://localhost:3001/api'

// Configuration des endpoints
export const API_ENDPOINTS = {
  // Authentification
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  PROFILE: '/auth/profile',
  
  // DAO
  DAO: '/dao',
  DAO_NEXT_NUMBER: '/dao/next-number',
  DAO_TYPES: '/dao-types',
  
  // Utilisateurs
  USERS: '/users',
  
  // Test
  TEST: '/test'
} as const

// Headers par défaut pour les requêtes API
export const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
})

export const getPublicHeaders = () => ({
  'Content-Type': 'application/json'
})
