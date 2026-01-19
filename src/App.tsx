// App.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState } from './store/store';
import { checkAuth } from './store/authSlice';
import { Layout } from './components/layout/Layout';
import { PrivateRoute } from './components/common/PrivateRoute';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { AccessSystemPage } from './pages/AccessSystemPage';
import { CCTVSystemPage } from './pages/CCTVSystemPage';
import { HVACSystemPage } from './pages/HVACSystemPage';
import { AdminPage } from './pages/AdminPage';
import { ReportsPage } from './pages/ReportsPage';
import RequestsPage from './pages/RequestsPage';

// Компонент для инициализации
const AppInit = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Проверяем авторизацию при загрузке приложения
    dispatch(checkAuth());
  }, [dispatch]);

  return null;
};

// Основной контент приложения, который будет внутри Router
const AppContent = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const userName = useSelector((state: RootState) => state.auth.user?.name) || 'Администратор';
  const userInitials = useSelector((state: RootState) => state.auth.user?.initials) || 'АО';
  
  // Состояние для темы
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Проверяем сохраненную тему в localStorage
    const savedTheme = localStorage.getItem('themeMode');
    return savedTheme === 'dark';
  });

  // Создаем тему в зависимости от режима
  const theme = useMemo(() => createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#9c27b0',
      },
      background: {
        default: isDarkMode ? '#121212' : '#f5f5f5',
        paper: isDarkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#1e1e1e' : '#1976d2',
            color: isDarkMode ? '#fff' : '#fff',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
            color: isDarkMode ? '#e0e0e0' : 'inherit',
          },
        },
      },
    },
  }), [isDarkMode]);

  // Сохраняем тему в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('themeMode', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleSettingsClick = () => {
    // Навигация на страницу настроек
    console.log('Settings clicked');
    // Здесь можно добавить навигацию или модальное окно
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppInit />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout 
                isDarkMode={isDarkMode}
                onDarkModeToggle={handleDarkModeToggle}
                onSettingsClick={handleSettingsClick}
              />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="access" element={<AccessSystemPage />} />
          <Route path="cctv" element={<CCTVSystemPage />} />
          <Route path="hvac" element={<HVACSystemPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
};

export default App;