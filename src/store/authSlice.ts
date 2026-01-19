import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi, LoginCredentials } from '../api/auth';

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokenInfo?: {
    expiresAt: Date;
    isExpired: boolean;
    expiresInHours: number;
  } | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'), // Проверяем localStorage при инициализации
  isLoading: false,
  error: null,
};

// Старый локальный логин (оставим на всякий случай)
export const localLogin = createAsyncThunk(
  'auth/localLogin',
  async (credentials: { username: string; password: string }) => {
    if (credentials.username === 'admin' && credentials.password === 'admin') {
      return {
        id: '1',
        username: 'admin',
        firstName: 'Администратор',
        lastName: 'Системы',
        role: 'admin'
      };
    }
    throw new Error('Неверные учетные данные');
  }
);

// НОВЫЙ: API логин
export const apiLogin = createAsyncThunk(
  'auth/apiLogin',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      
      // Возвращаем данные пользователя для сохранения в Redux
      const userData = response.user || {
        id: '1',
        username: credentials.username,
        firstName: credentials.username === 'admin' ? 'Администратор' : 'Пользователь',
        lastName: 'Системы',
        role: credentials.username === 'admin' ? 'admin' : 'user'
      };
      
      return userData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка авторизации');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      // Очищаем localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
    // Добавляем action для установки авторизации из localStorage
    checkAuth: (state) => {
      const token = localStorage.getItem('access_token');
      const userStr = localStorage.getItem('user');
      
      state.isAuthenticated = !!token;
      if (userStr) {
        try {
          state.user = JSON.parse(userStr);
        } catch {
          state.user = null;
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Для локального логина
    builder
      .addCase(localLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(localLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        // Также сохраняем в localStorage для совместимости
        localStorage.setItem('user', JSON.stringify(action.payload));
        localStorage.setItem('access_token', 'demo-token');
      })
      .addCase(localLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Ошибка авторизации';
      });
    
    // Для API логина
    builder
      .addCase(apiLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(apiLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        // Токен уже сохранен в localStorage в authApi.login
      })
      .addCase(apiLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Ошибка авторизации';
      });
  },
});

export const { logout, clearError, checkAuth } = authSlice.actions;
export default authSlice.reducer;