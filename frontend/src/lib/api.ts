import axios from 'axios';

// Create axios instance
export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem('auth_tokens');
    if (tokens) {
      try {
        const { accessToken } = JSON.parse(tokens);
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      } catch (error) {
        console.error('Error parsing auth tokens:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = localStorage.getItem('auth_tokens');
        if (tokens) {
          const { refreshToken } = JSON.parse(tokens);
          
          const response = await axios.post('/api/auth/refresh', {
            refreshToken
          });

          if (response.data.success) {
            const newTokens = {
              ...JSON.parse(tokens),
              accessToken: response.data.data.accessToken,
              expiresIn: response.data.data.expiresIn
            };

            localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
            api.defaults.headers.common['Authorization'] = `Bearer ${newTokens.accessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;

            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('auth_tokens');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
  },
  doctors: {
    list: '/doctors',
    detail: (id: string) => `/doctors/${id}`,
    slots: (id: string) => `/doctors/${id}/slots`,
    schedule: (id: string) => `/doctors/${id}/schedule`,
  },
  appointments: {
    list: '/appointments',
    detail: (id: string) => `/appointments/${id}`,
    lockSlot: (slotId: string) => `/appointments/slots/${slotId}/lock`,
    confirmSlot: (slotId: string) => `/appointments/slots/${slotId}/confirm`,
    cancel: (id: string) => `/appointments/${id}/cancel`,
    complete: (id: string) => `/appointments/${id}/complete`,
  },
  users: {
    profile: '/users/profile',
    password: '/users/password',
    list: '/users',
    delete: (id: string) => `/users/${id}`,
  },
  specializations: {
    list: '/specializations',
    create: '/specializations',
    update: (id: string) => `/specializations/${id}`,
    delete: (id: string) => `/specializations/${id}`,
  },
};

export default api;
