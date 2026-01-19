// components/layout/Header.tsx
import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton,
  Box,
  Badge,
  Avatar,
  Paper,
  Tooltip
} from '@mui/material';
import { 
  Menu as MenuIcon,
  AccountCircle,
  DarkMode,
  LightMode,
  Notifications,
  Settings,
  Logout
} from '@mui/icons-material';

interface HeaderProps {
  onLogout: () => void;
  onMenuClick: () => void;
  onDarkModeToggle?: () => void;
  onSettingsClick?: () => void;
  notificationCount?: number;
  userName?: string;
  userInitials?: string;
  isDarkMode?: boolean; // Новый пропс для определения текущей темы
}

export const Header: React.FC<HeaderProps> = ({ 
  onLogout, 
  onMenuClick, 
  onDarkModeToggle,
  onSettingsClick,
  notificationCount = 3,
  userName = 'Администратор',
  userInitials = 'АО',
  isDarkMode = false // Значение по умолчанию - светлая тема
}) => {
  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#1976d2',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography 
          variant="h6" 
          noWrap 
          component="div" 
          sx={{ flexGrow: 1 }}
        >
          Система мониторинга инженерных систем
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 1, sm: 2 }
        }}>
          {/* Кнопка переключения темы */}
          {onDarkModeToggle && (
            <Tooltip title={isDarkMode ? "Светлая тема" : "Темная тема"}>
              <IconButton 
                color="inherit" 
                onClick={onDarkModeToggle}
                size="small"
                sx={{ 
                  display: 'flex',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                {isDarkMode ? (
                  <LightMode fontSize="small" />
                ) : (
                  <DarkMode fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
          
          {/* Уведомления */}
          <IconButton 
            color="inherit" 
            size="small"
            sx={{ position: 'relative' }}
          >
            <Badge 
              badgeContent={notificationCount} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.6rem',
                  height: '16px',
                  minWidth: '16px',
                }
              }}
            >
              <Notifications fontSize="small" />
            </Badge>
          </IconButton>
          
          {/* Аватар и имя пользователя */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            ml: 1 
          }}>
            <Avatar 
              sx={{ 
                bgcolor: 'primary.main', 
                width: 32, 
                height: 32,
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              {userInitials}
            </Avatar>
            
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {userName}
            </Typography>
          </Box>
          
          {/* Настройки */}
          {onSettingsClick && (
            <IconButton 
              color="inherit" 
              onClick={onSettingsClick}
              size="small"
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              <Settings fontSize="small" />
            </IconButton>
          )}
          
          {/* Выход */}
          <IconButton 
            color="inherit" 
            onClick={onLogout}
            size="small"
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            <Logout fontSize="small" />
          </IconButton>
          
          {/* Кнопка Выйти для мобильных */}
          <Button 
            color="primary" 
            onClick={onLogout}
            size="small"
            variant="outlined"
            sx={{ 
              display: { xs: 'flex', sm: 'none' },
              minWidth: 'auto',
              padding: '4px 8px'
            }}
          >
            Выйти
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};