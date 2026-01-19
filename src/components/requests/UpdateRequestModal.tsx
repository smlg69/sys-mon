// src/components/requests/UpdateRequestModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { requestsApi, Order, User } from '../../api/requests';

interface UpdateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onUpdate: (updatedOrder: Order) => void;
}

interface UpdateFormData {
  status: string;
  user: string;
  priority: string;
  description: string;
}

export const UpdateRequestModal: React.FC<UpdateRequestModalProps> = ({
  isOpen,
  onClose,
  order,
  onUpdate,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateFormData>({
    status: '',
    user: '',
    priority: '',
    description: '',
  });

  // Загружаем список исполнителей при открытии модального окна
  useEffect(() => {
    const loadUsers = async () => {
      if (isOpen) {
        setLoading(true);
        try {
          const usersList = await requestsApi.getUsers();
          setUsers(usersList);
        } catch (err) {
          console.error('Ошибка загрузки пользователей:', err);
          setError('Не удалось загрузить список исполнителей');
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadUsers();
  }, [isOpen]);

  // Инициализируем форму при открытии модального окна
  useEffect(() => {
    if (order) {
      setFormData({
        status: order.status || 'Создана',
        user: order.user || '',
        priority: order.priority || 'Средний',
        description: order.description || '',
      });
      setError(null);
    }
  }, [order]);

  const handleFormChange = (field: keyof UpdateFormData) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    const value = 'target' in event ? event.target.value : event;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!order) return;

    setSubmitting(true);
    try {
      // Подготавливаем данные для обновления
      const updateData: any = {};
      
      // Добавляем только изменившиеся поля
      if (formData.status !== order.status) updateData.status = formData.status;
      if (formData.user !== order.user) updateData.user = formData.user;
      if (formData.priority !== order.priority) updateData.priority = formData.priority;
      if (formData.description !== order.description) updateData.description = formData.description;

      // Если ничего не изменилось, просто закрываем окно
      if (Object.keys(updateData).length === 0) {
        onClose();
        return;
      }

      console.log('🔄 Отправка обновления заявки:', { orderId: order.id, updateData });

      // Обновляем заявку на сервере
      await requestsApi.updateOrder(order.id, updateData);
      
      // Создаем обновленный объект заявки
      const updatedOrder: Order = {
        ...order,
        ...updateData,
      };

      // Вызываем колбэк для обновления в родительском компоненте
      onUpdate(updatedOrder);
      
      // Закрываем модальное окно
      onClose();
      
    } catch (err: any) {
      console.error('❌ Ошибка обновления заявки:', err);
      
      // Более информативное сообщение об ошибке
      let errorMessage = 'Не удалось обновить заявку';
      if (err.response?.data) {
        errorMessage += `: ${JSON.stringify(err.response.data)}`;
      } else if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Опции для статусов
  const statusOptions = [
    { value: 'Создана', label: 'Создана' },
    { value: 'В работе', label: 'В работе' },
    { value: 'Завершена', label: 'Завершена' },
    { value: 'Закрыта', label: 'Закрыта' },
    { value: 'Отменена', label: 'Отменена' },
  ];

  // Опции для приоритетов
  const priorityOptions = [
    { value: 'Низкий', label: 'Низкий' },
    { value: 'Средний', label: 'Средний' },
    { value: 'Высокий', label: 'Высокий' },
    { value: 'Критичный', label: 'Критичный' },
  ];

  if (!order) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon />
          <Typography variant="h6" component="div">
            Обновление заявки #{typeof order.id === 'string' ? order.id : order.id.toString()}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              {/* Информация о заявке (только для чтения) */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Тип заявки"
                  value={order.type || 'Не указан'}
                  margin="normal"
                  InputProps={{
                    readOnly: true,
                  }}
                  variant="filled"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Оборудование"
                  value={order.device || 'Не указано'}
                  margin="normal"
                  InputProps={{
                    readOnly: true,
                  }}
                  variant="filled"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Статус *"
                  value={formData.status}
                  onChange={handleFormChange('status')}
                  margin="normal"
                  required
                  disabled={submitting}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Приоритет *"
                  value={formData.priority}
                  onChange={handleFormChange('priority')}
                  margin="normal"
                  required
                  disabled={submitting}
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              {/* Выбор исполнителя */}
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Исполнитель *"
                  value={formData.user}
                  onChange={handleFormChange('user')}
                  margin="normal"
                  required
                  disabled={submitting || loading}
                >
                  <MenuItem value="">Не назначен</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.name}>
                      {user.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              {/* Описание */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Описание *"
                  value={formData.description}
                  onChange={handleFormChange('description')}
                  margin="normal"
                  multiline
                  rows={3}
                  required
                  disabled={submitting}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          variant="outlined"
        >
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || loading}
          variant="contained"
          color="primary"
          startIcon={<EditIcon />}
        >
          {submitting ? 'Обновление...' : 'Сохранить изменения'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};