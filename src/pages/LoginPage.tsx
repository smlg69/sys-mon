import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Avatar,
  Alert,
  CircularProgress 
} from '@mui/material';
import { Lock } from '@mui/icons-material';
import { useAppDispatch } from '../store/hooks';
import { apiLogin } from '../store/authSlice';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (!username || !password) {
      setError('Введите имя пользователя и пароль');
      setIsLoading(false);
      return;
    }

    try {
      // Используем Redux thunk для логина через API
      const result = await dispatch(apiLogin({ username, password }));
      
      if (apiLogin.fulfilled.match(result)) {
        console.log('Login successful via Redux');
        // Если успешно, переходим на дашборд
        navigate('/dashboard', { replace: true });
      } else {
        // Ошибка из Redux thunk
        setError(result.payload as string || 'Ошибка авторизации');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  // ... остальной код без изменений
  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Avatar sx={{ m: 1, bgcolor: 'primary.main', mx: 'auto' }}>
            <Lock />
          </Avatar>
          <Typography component="h1" variant="h5" align="center" sx={{ mb: 3 }}>
            Система мониторинга
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Войти'
              )}
            </Button>
          </Box>
          
          <Typography variant="body2" color="text.secondary" align="center">
            Используйте учетные данные от системы
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};