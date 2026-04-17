export const API_BASE_URL = (import.meta.env.REACT_APP_API_URL || 'http://localhost:3001/api') as string;

export const getPublicHeaders = () => ({
  'Content-Type': 'application/json',
});

export const API_ENDPOINTS = {
  // Authentification
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  PROFILE: '/auth/me',
  CHANGE_PASSWORD: '/users/change-password',
  
  // DAO
  DAO: '/dao',
  DAO_NEXT_NUMBER: '/dao/next-number',
  DAO_TYPES: '/dao/types',
  DAO_MES_DAOS: '/dao/mes-daos',
  DAO_TASKS: (id: string | number) => `/dao/${id}/tasks`,
  DAO_MEMBERS: (id: string | number) => `/dao/${id}/members`,
  DAO_BY_ID: (id: string | number) => `/dao/${id}`,
  DAO_ARCHIVE: (id: string | number) => `/dao/${id}/archive`,
  
  // Tâches
  TASKS: '/tasks',
  TASK_CREATE_DAO: (id: string | number) => `/tasks/dao/${id}`,
  TASK_DELETE: (id: string | number) => `/tasks/${id}`,
  TASK_ASSIGN: (id: string | number) => `/tasks/${id}/assign`,
  TASK_STATUS: (id: string | number) => `/tasks/${id}/status`,
  TASK_PROGRESS: (id: string | number) => `/tasks/${id}/progress`,
  TASK_MY_TASKS: '/tasks/my-tasks',
  
  // Utilisateurs
  USERS: '/users',
  MY_TASKS: '/my-tasks',
  
  // Test
  TEST: '/test'
} as const;

/**
 * Construit l'URL complète pour un endpoint
 * @param endpoint - L'endpoint (string ou fonction qui retourne un string)
 * @returns L'URL complète
 */
export const getApiUrl = (endpoint: string | ((args?: any) => string)): string => {
  const path = typeof endpoint === 'function' ? endpoint() : endpoint;
  return `${API_BASE_URL}${path}`;
};

/**
 * Construit l'URL complète pour un endpoint avec paramètres
 * @param endpoint - L'endpoint (fonction qui retourne un string)
 * @param params - Les paramètres à passer à la fonction endpoint
 * @returns L'URL complète
 */
export const getApiUrlWithParams = (endpoint: (params: any) => string, params: any): string => {
  const path = endpoint(params);
  return `${API_BASE_URL}${path}`;
};

/**
 * Type pour les options de requête API
 */
interface ApiRequestOptions extends RequestInit {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  requiresAuth?: boolean;
}

/**
 * Type pour la réponse API
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Gestionnaire centralisé des requêtes API
 * Gère l'authentification, les erreurs, et les configurations
 */
export const apiRequest = async <T = any>(
  options: ApiRequestOptions
): Promise<ApiResponse<T>> => {
  const {
    endpoint,
    method = 'GET',
    body,
    requiresAuth = true,
    ...fetchOptions
  } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  };

  // Ajouter le token si l'authentification est requise
  if (requiresAuth) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ Token not found. Redirecting to login.');
      window.location.href = '/login';
      return {
        success: false,
        error: 'Authentication required',
      };
    }
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...fetchOptions,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ API Error [${response.status}]:`, data);
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
        data,
      };
    }

    return data as ApiResponse<T>;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Network Error:', errorMessage);
    return {
      success: false,
      error: `Network error: ${errorMessage}`,
    };
  }
};

/**
 * Requête GET
 */
export const apiGet = <T = any>(
  endpoint: string,
  options?: Omit<ApiRequestOptions, 'endpoint' | 'method' | 'body'>
) => apiRequest<T>({ ...options, endpoint, method: 'GET' });

/**
 * Requête POST
 */
export const apiPost = <T = any>(
  endpoint: string,
  body?: any,
  options?: Omit<ApiRequestOptions, 'endpoint' | 'method' | 'body'>
) => apiRequest<T>({ ...options, endpoint, method: 'POST', body });

/**
 * Requête PUT
 */
export const apiPut = <T = any>(
  endpoint: string,
  body?: any,
  options?: Omit<ApiRequestOptions, 'endpoint' | 'method' | 'body'>
) => apiRequest<T>({ ...options, endpoint, method: 'PUT', body });

/**
 * Requête DELETE
 */
export const apiDelete = <T = any>(
  endpoint: string,
  options?: Omit<ApiRequestOptions, 'endpoint' | 'method' | 'body'>
) => apiRequest<T>({ ...options, endpoint, method: 'DELETE' });
