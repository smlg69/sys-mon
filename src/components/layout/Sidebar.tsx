// components/layout/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Box,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Chip,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Engineering as EngineeringIcon,
  AcUnit as AcUnitIcon,
  Lock as LockIcon,
  Videocam as VideocamIcon,
  Assignment as AssignmentIcon,
  AdminPanelSettings as AdminIcon,
  Assessment as AssessmentIcon,
  ExpandMore,
  ExpandLess,
  ChevronLeft,
  Security,
  Timer,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { authApi } from '../../api/auth';

const drawerWidth = 320;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

interface MenuItem {
  id: string;
  text: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

const mainMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    text: 'Сводный экран',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    id: 'engineering',
    text: 'Инженерные системы',
    icon: <EngineeringIcon />,
    children: [
      { id: 'hvac', text: 'Система ЖКХ', icon: <AcUnitIcon />, path: '/hvac' },
      { id: 'access', text: 'Система СКУД', icon: <LockIcon />, path: '/access' },
      { id: 'cctv', text: 'Видеонаблюдение', icon: <VideocamIcon />, path: '/cctv' },
    ],
  },
  {
    id: 'requests',
    text: 'Заявки на обслуживание',
    icon: <AssignmentIcon />,
    path: '/requests',
  },
  {
    id: 'admin',
    text: 'Администрирование',
    icon: <AdminIcon />,
    path: '/admin',
  },
  {
    id: 'reports',
    text: 'Отчеты',
    icon: <AssessmentIcon />,
    path: '/reports',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isDarkMode = false }) => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedItems, setExpandedItems] = useState<string[]>(['engineering']);
  
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateTokenInfo = () => {
      const info = authApi.getTokenInfo();
      setTokenInfo(info);
      
      if (info) {
        const now = Date.now();
        const expiresIn = info.expiresInMs;
        
        if (expiresIn > 0) {
          const hours = Math.floor(expiresIn / (1000 * 60 * 60));
          const minutes = Math.floor((expiresIn % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((expiresIn % (1000 * 60)) / 1000);
          
          if (hours > 0) {
            setTimeLeft(`${hours}ч ${minutes}м`);
          } else if (minutes > 0) {
            setTimeLeft(`${minutes}м ${seconds}с`);
          } else {
            setTimeLeft(`${seconds}с`);
          }
        } else {
          setTimeLeft('Истек');
        }
      }
    };
    
    updateTokenInfo();
    const interval = setInterval(updateTokenInfo, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleToggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const isActive = item.path === location.pathname;

    // Цвета для темной темы
    const activeBgColor = isDarkMode 
      ? 'rgba(25, 118, 210, 0.16)' 
      : theme.palette.action.selected;
    
    const hoverBgColor = isDarkMode 
      ? 'rgba(255, 255, 255, 0.08)' 
      : theme.palette.action.hover;

    if (item.children) {
      return (
        <React.Fragment key={item.id}>
          <ListItem
            button
            onClick={() => handleToggleExpand(item.id)}
            sx={{
              pl: 2 + depth * 2,
              backgroundColor: isActive ? activeBgColor : 'transparent',
              '&:hover': {
                backgroundColor: hoverBgColor,
              },
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: isDarkMode ? '#e0e0e0' : 'inherit'
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{
                color: isDarkMode ? '#e0e0e0' : 'inherit'
              }}
            />
            {isExpanded ? (
              <ExpandLess sx={{ color: isDarkMode ? '#e0e0e0' : 'inherit' }} />
            ) : (
              <ExpandMore sx={{ color: isDarkMode ? '#e0e0e0' : 'inherit' }} />
            )}
          </ListItem>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child) => renderMenuItem(child, depth + 1))}
            </List>
          </Collapse>
        </React.Fragment>
      );
    }

    return (
      <ListItem
        key={item.id}
        button
        component={Link}
        to={item.path || '#'}
        onClick={isMobile ? onClose : undefined}
        sx={{
          pl: 2 + depth * 2,
          backgroundColor: isActive ? activeBgColor : 'transparent',
          '&:hover': {
            backgroundColor: hoverBgColor,
          },
        }}
      >
        <ListItemIcon sx={{ 
          minWidth: 40,
          color: isActive ? theme.palette.primary.main : (isDarkMode ? '#e0e0e0' : 'inherit')
        }}>
          {item.icon}
        </ListItemIcon>
        <ListItemText 
          primary={item.text} 
          primaryTypographyProps={{
            color: isActive ? theme.palette.primary.main : (isDarkMode ? '#e0e0e0' : 'inherit'),
            fontWeight: isActive ? 600 : 400
          }}
        />
      </ListItem>
    );
  };

  const drawerContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
      color: isDarkMode ? '#e0e0e0' : 'inherit',
    }}>
      {/* Заголовок */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${isDarkMode ? '#333' : theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Мониторинг систем
        </Typography>
        {!isMobile && (
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{ color: isDarkMode ? '#e0e0e0' : 'inherit' }}
          >
            <ChevronLeft />
          </IconButton>
        )}
      </Box>
      
      {/* Информация о токене */}
      {tokenInfo && (
        <Box sx={{ 
          p: 2, 
          borderBottom: `1px solid ${isDarkMode ? '#333' : theme.palette.divider}`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Security fontSize="small" sx={{ 
              mr: 1, 
              color: tokenInfo.isExpired 
                ? theme.palette.error.main 
                : theme.palette.success.main 
            }} />
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              Токен: <Chip 
                label={tokenInfo.isExpired ? 'Истек' : 'Активен'} 
                size="small" 
                color={tokenInfo.isExpired ? 'error' : 'success'}
                variant="outlined"
                sx={{ ml: 1 }}
              />
            </Typography>
          </Box>
          
          {!tokenInfo.isExpired && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Timer fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Истекает через: {timeLeft}
                </Typography>
              </Box>
              
              <LinearProgress 
                variant="determinate" 
                value={Math.max(0, Math.min(100, (tokenInfo.expiresInMs / (3600 * 1000)) * 100))}
                color={tokenInfo.expiresInHours < 1 ? 'error' : tokenInfo.expiresInHours < 4 ? 'warning' : 'success'}
                sx={{ 
                  height: 4, 
                  borderRadius: 2, 
                  mt: 1,
                  backgroundColor: isDarkMode ? '#333' : '#e0e0e0'
                }}
              />
              
              <Typography 
                variant="caption" 
                color={isDarkMode ? 'text.secondary' : 'text.secondary'}
                display="block" 
                sx={{ mt: 0.5 }}
              >
                До: {tokenInfo.expiresAt.toLocaleTimeString('ru-RU', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </Typography>
            </>
          )}
          
          {tokenInfo.isExpired && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 1, 
                py: 0.5,
                backgroundColor: isDarkMode ? '#331c1c' : '#fdeded',
                color: isDarkMode ? '#f5b5b5' : '#5f2120'
              }}
            >
              Требуется повторная авторизация
            </Alert>
          )}
        </Box>
      )}

      {/* Меню */}
      <List sx={{ flexGrow: 1, py: 0 }}>
        {mainMenuItems.map((item) => renderMenuItem(item))}
      </List>

      {/* Футер */}
      <Box sx={{ 
        p: 2, 
        borderTop: `1px solid ${isDarkMode ? '#333' : theme.palette.divider}`,
      }}>
        <Typography variant="caption" color={isDarkMode ? 'text.secondary' : 'text.secondary'}>
          Версия 1.0.0
        </Typography>
        <Typography variant="caption" color={isDarkMode ? 'text.secondary' : 'text.secondary'} display="block">
          © 2024 Access System
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={isOpen}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: `1px solid ${isDarkMode ? '#333' : theme.palette.divider}`,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};