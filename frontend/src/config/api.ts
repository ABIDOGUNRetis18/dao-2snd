export const API_BASE_URL = 'http://localhost:3001/api';

export const getPublicHeaders = () => ({
  'Content-Type': 'application/json',
});

export const API_ENDPOINTS = {
  // Authentification
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  PROFILE: '/auth/profile',
  
  // DAO
  DAO: '/dao',
  DAO_NEXT_NUMBER: '/dao/next-number',
  DAO_TYPES: '/dao/types',
  
  // Utilisateurs
  USERS: '/users',
  
  // Test
  TEST: '/test'
} as const;
