// components/layout/Layout.tsx
import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/authSlice';

interface LayoutProps {
  isDarkMode?: boolean;
  onDarkModeToggle?: () => void;
  onSettingsClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  isDarkMode = false,
  onDarkModeToggle,
  onSettingsClick
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCloseSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Данные пользователя из Redux store
  const userName = "Администратор"; // Здесь можно получить из store
  const userInitials = "АО"; // Здесь можно получить из store

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header 
        onLogout={handleLogout} 
        onMenuClick={handleToggleSidebar} 
        onDarkModeToggle={onDarkModeToggle}
        onSettingsClick={onSettingsClick}
        isDarkMode={isDarkMode}
        userName={userName}
        userInitials={userInitials}
        notificationCount={3}
      />
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} isDarkMode={isDarkMode} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginTop: '64px',
          width: { xs: '100%', md: sidebarOpen ? `calc(100% - 320px)` : '100%' },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(sidebarOpen && {
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};