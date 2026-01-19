// api/auth.ts
import { jwtDecode } from 'jwt-decode';
import { apiClient } from './client';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface DecodedToken {
  exp: number;
  iat: number;
  sub: string;
  username?: string;
  roles?: string[];
  [key: string]: any;
}

export const authApi = {
  // Вход в систему - ИСПРАВЛЕННЫЙ МЕТОД
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    console.log('🔐 Отправка запроса на авторизацию:', credentials);
    
    // Используем apiClient с указанием правильного baseURL
    try {
      const response = await apiClient.post<AuthResponse>(
        'auth',
        credentials,
        { 
          baseURL: '/rest/' // Указываем правильный baseURL для авторизации
        }
      );
      
      console.log('✅ Ответ сервера:', response);
      
      const data = response;
      
      if (data.token) {
        console.log('🔑 Токен получен, сохраняем...');
        
        // Сохраняем токен
        localStorage.setItem('access_token', data.token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
        
        // Декодируем токен для получения информации
        try {
          const decoded: DecodedToken = jwtDecode(data.token);
          const expiryTime = decoded.exp * 1000;
          localStorage.setItem('token_expiry', expiryTime.toString());
          console.log('⏰ Токен истекает:', new Date(expiryTime).toLocaleString());
        } catch (error) {
          console.warn('⚠️ Не удалось декодировать токен:', error);
        }
        
        // Сохраняем информацию о пользователе
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          const user = {
            id: '1',
            username: credentials.username,
            firstName: credentials.username === 'admin' ? 'Администратор' : 'Пользователь',
            lastName: 'Системы',
            role: credentials.username === 'admin' ? 'admin' : 'user'
          };
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        console.log('✅ Токен сохранен, редирект...');
        
        // Явный редирект
        window.location.href = '/dashboard';
        
      } else {
        console.error('❌ Токен не получен от сервера!');
        throw new Error('Токен не получен от сервера');
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Ошибка авторизации:', error);
      
      if (error.response) {
        console.error('📄 Детали ошибки:', {
          status: error.response.status,
          data: error.response.data,
          url: error.config?.url,
        });
      }
      
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout', {}, { baseURL: '/rest' });
    } catch (error) {
      console.warn('⚠️ Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('token_expiry');
      window.location.href = '/login';
    }
  },

  validateToken: async (): Promise<boolean> => {
    const token = localStorage.getItem('access_token');
    return !!token;
  },
  
  // Получение информации о токене
  getTokenInfo: () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    
    try {
      const decoded: DecodedToken = jwtDecode(token);
      const expiryTime = decoded.exp * 1000;
      const currentTime = Date.now();
      const expiresInMs = expiryTime - currentTime;
      
      return {
        token,
        decoded,
        expiresAt: new Date(expiryTime),
        isExpired: currentTime > expiryTime,
        expiresInMs,
        expiresInMinutes: Math.floor(expiresInMs / (1000 * 60)),
        expiresInHours: Math.floor(expiresInMs / (1000 * 60 * 60)),
      };
    } catch (error) {
      console.error('❌ Ошибка декодирования токена:', error);
      return null;
    }
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        return null;
      }
    }
    return null;
  },
  
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },
  
  getToken: (): string | null => {
    return localStorage.getItem('access_token');
  }
};