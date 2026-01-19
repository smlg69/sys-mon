// pages/AdminPage.tsx
import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Avatar,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  AdminPanelSettings,
  People,
  Groups,
  Settings,
  Security,
  Timer,
  Engineering,
  Tune,
  Password,
  Lock,
  Analytics,
  Memory,
  Person,
  AdminPanelSettings as AdminPanelIcon,
  ManageAccounts,
  Save,
  Engineering as EngineeringIcon,
  AccessTime,
  Language,
  DateRange,
  Dashboard,
  Assignment,
  Assessment,
  Visibility,
  Close,
  Email,
  Phone,
  Badge,
  Group,
  Edit,
  Add,
} from "@mui/icons-material";

const FUNCTIONS = process.env.REACT_APP_FUNCTIONS;

interface User {
  id?: string;
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  role: "Администратор" | "Менеджер" | "Оператор" | "Гость"; // <-- Обновленные роли
  department?: string;
  isActive: boolean;
  avatarColor?: string;
  notes?: string;
  hireDate?: Date;
  position?: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

export const AdminPage: React.FC = () => {
  const [language, setLanguage] = useState("russian");
  const [timezone, setTimezone] = useState("moscow");
  const [dateFormat, setDateFormat] = useState("ddmmyyyy");
  const [passwordLength, setPasswordLength] = useState("8");
  const [passwordExpiry, setPasswordExpiry] = useState("90");
  const [sessionTime, setSessionTime] = useState("30");

  // Состояния для пользователей
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<User>({
    username: "",
    email: "",
    fullName: "",
    phone: "",
    role: "Гость",
    department: "",
    isActive: true,
    avatarColor: "#1976d2",
  });
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  // Обработчики настроек (оставляем как было)
  const handleLanguageChange = (event: SelectChangeEvent) => {
    setLanguage(event.target.value);
  };
  const handleTimezoneChange = (event: SelectChangeEvent) => {
    setTimezone(event.target.value);
  };
  const handleDateFormatChange = (event: SelectChangeEvent) => {
    setDateFormat(event.target.value);
  };
  const handlePasswordLengthChange = (event: SelectChangeEvent) => {
    setPasswordLength(event.target.value);
  };
  const handlePasswordExpiryChange = (event: SelectChangeEvent) => {
    setPasswordExpiry(event.target.value);
  };
  const handleSessionTimeChange = (event: SelectChangeEvent) => {
    setSessionTime(event.target.value);
  };

  // Обработчики пользователей
  const handleOpenUserModal = (user?: User) => {
  if (user) {
    setEditingUser(user);
    setUserForm(user);
    setPassword("");
  } else {
    setEditingUser(null);
    setUserForm({
      username: "",
      email: "",
      fullName: "",
      phone: "",
      role: "Оператор", // <-- И здесь тоже
      department: "",
      isActive: true,
      avatarColor: "#1976d2",
    });
    setPassword("");
  }
  setUserModalOpen(true);
};

  const handleCloseUserModal = () => {
    setUserModalOpen(false);
    setEditingUser(null);
    setPassword("");
  };

  const handleUserFormChange = (field: keyof User, value: any) => {
    setUserForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveUser = async () => {
    // Базовая валидация
    if (!userForm.fullName?.trim() || !userForm.role?.trim()) {
      setSnackbar({
        open: true,
        message: "Заполните обязательные поля (ФИО и роль)",
        severity: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Проверяем, что роль из поддерживаемого списка
    const validRoles = ["Администратор", "Менеджер", "Оператор", "Гость"];
    const userRole = validRoles.includes(userForm.role) ? userForm.role : "guest";
      // Подготавливаем данные как массив
      const userData = [{
        userName: userForm.fullName.trim(),
        password: password.trim() || "123",
        role: userForm.role,
        //email: userForm.email?.trim() || "",
        //phone: userForm.phone?.trim() || "",
        //isActive: userForm.isActive,
        //...(userForm.department && { department: userForm.department.trim() }),
        //...(userForm.position && { position: userForm.position.trim() }),
      }];

      console.log("Отправка данных в createUserF:", userData);

      // Создаем временный клиент для прямого вызова функции
      const response = await fetch(
        FUNCTIONS+'/createUserF',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify(userData)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("Ответ от createUserF:", result);

      setSnackbar({
        open: true,
        message: "Пользователь успешно создан",
        severity: "success",
      });
      handleCloseUserModal();

    } catch (error: any) {
      console.error("Ошибка создания пользователя:", error);
      
      let errorMessage = "Ошибка создания пользователя";
      if (error.message) {
        errorMessage = error.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const generateAvatarColor = () => {
    const colors = [
      "#1976d2",
      "#2e7d32",
      "#d32f2f",
      "#ed6c02",
      "#9c27b0",
      "#0288d1",
      "#388e3c",
      "#7b1fa2",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Заголовок */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          <AdminPanelSettings sx={{ verticalAlign: "middle", mr: 2 }} />
          Панель администратора
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Управление системой и настройки безопасности
        </Typography>
      </Paper>

      {/* Основные блоки управления - 3 колонки */}
      <Grid container spacing={3}>
        {/* Управление пользователями */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mb: 3 }}
              >
                <People sx={{ fontSize: 40, color: "primary.main" }} />
                <Box>
                  <Typography variant="h6">
                    Управление пользователями
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Управление учетными записями
                  </Typography>
                </Box>
              </Stack>
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <Chip
                  icon={<Person />}
                  label="Создание пользователей"
                  variant="outlined"
                  sx={{ width: "100%", justifyContent: "flex-start" }}
                  onClick={() => handleOpenUserModal()}
                  clickable
                />
                <Chip
                  icon={<ManageAccounts />}
                  label="Редактирование профилей"
                  variant="outlined"
                  sx={{ width: "100%", justifyContent: "flex-start" }}
                  onClick={() => handleOpenUserModal({
                    id: "1",
                    username: "ivanov",
                    email: "ivanov@example.com",
                    fullName: "Иванов Иван Иванович",
                    phone: "+7 (999) 123-45-67",
                    role: "Гость",
                    department: "IT отдел",
                    isActive: true,
                  })}
                  clickable
                />
              </Stack>
              <Button
                variant="contained"
                fullWidth
                startIcon={<People />}
                onClick={() => handleOpenUserModal()}
              >
                Управление пользователями
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Остальные блоки без изменений */}
        {/* Управление ролями */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mb: 3 }}
              >
                <Groups sx={{ fontSize: 40, color: "primary.main" }} />
                <Box>
                  <Typography variant="h6">Управление ролями</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Настройка прав доступа
                  </Typography>
                </Box>
              </Stack>
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <Chip
                  label="Администратор"
                  color="primary"
                  sx={{ width: "100%" }}
                />
                <Chip
                  label="Оператор"
                  color="secondary"
                  sx={{ width: "100%" }}
                />
                <Chip label="Пользователь" color="info" sx={{ width: "100%" }} />
                <Chip label="Гость" color="default" sx={{ width: "100%" }} />
              </Stack>
              <Button
                variant="contained"
                fullWidth
                startIcon={<Groups />}
                sx={{ mt: 3 }}
              >
                Настройки ролей
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Общие настройки */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mb: 3 }}
              >
                <Settings sx={{ fontSize: 40, color: "primary.main" }} />
                <Box>
                  <Typography variant="h6">Общие настройки</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Основные параметры системы
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={2} sx={{ mb: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>
                    <Language sx={{ fontSize: 16, mr: 1 }} />
                    Язык
                  </InputLabel>
                  <Select
                    value={language}
                    label="Язык"
                    onChange={handleLanguageChange}
                  >
                    <MenuItem value="russian">Русский</MenuItem>
                    <MenuItem value="english">English</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>
                    <AccessTime sx={{ fontSize: 16, mr: 1 }} />
                    Часовой пояс
                  </InputLabel>
                  <Select
                    value={timezone}
                    label="Часовой пояс"
                    onChange={handleTimezoneChange}
                  >
                    <MenuItem value="moscow">Москва (UTC+3)</MenuItem>
                    <MenuItem value="kaliningrad">Калининград (UTC+2)</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>
                    <DateRange sx={{ fontSize: 16, mr: 1 }} />
                    Формат даты
                  </InputLabel>
                  <Select
                    value={dateFormat}
                    label="Формат даты"
                    onChange={handleDateFormatChange}
                  >
                    <MenuItem value="ddmmyyyy">DD.MM.YYYY</MenuItem>
                    <MenuItem value="yyyymmdd">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Button variant="contained" fullWidth startIcon={<Save />}>
                Сохранить настройки
              </Button>
            </CardContent>
          </Card>
        </Grid>

                {/* Настройки инженерных систем */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mb: 3 }}
              >
                <Engineering sx={{ fontSize: 40, color: "primary.main" }} />
                <Box>
                  <Typography variant="h6">Инженерные системы</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Настройка подсистем
                  </Typography>
                </Box>
              </Stack>
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <Chip
                  icon={<EngineeringIcon />}
                  label="Система ЖКХ"
                  variant="outlined"
                  sx={{ width: "100%" }}
                />
                <Chip
                  icon={<EngineeringIcon />}
                  label="Система СКУД"
                  variant="outlined"
                  sx={{ width: "100%" }}
                />
                <Chip
                  icon={<EngineeringIcon />}
                  label="Видеонаблюдение"
                  variant="outlined"
                  sx={{ width: "100%" }}
                />
                <Chip
                  icon={<EngineeringIcon />}
                  label="Пожарная сигнализация"
                  variant="outlined"
                  sx={{ width: "100%" }}
                />
              </Stack>
              <Button variant="contained" fullWidth startIcon={<Tune />}>
                Настройки систем
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Доступность разделов */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mb: 3 }}
              >
                <Security sx={{ fontSize: 40, color: "primary.main" }} />
                <Box>
                  <Typography variant="h6">Доступность разделов</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Управление видимостью
                  </Typography>
                </Box>
              </Stack>
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <FormControlLabel
                  control={<Switch defaultChecked color="primary" />}
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Dashboard sx={{ fontSize: 18 }} />
                      <span>Сводный экран</span>
                    </Stack>
                  }
                />
                <FormControlLabel
                  control={<Switch defaultChecked color="primary" />}
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <EngineeringIcon sx={{ fontSize: 18 }} />
                      <span>Инженерные системы</span>
                    </Stack>
                  }
                />
                <FormControlLabel
                  control={<Switch defaultChecked color="primary" />}
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Assignment sx={{ fontSize: 18 }} />
                      <span>Заявки на обслуживание</span>
                    </Stack>
                  }
                />
                <FormControlLabel
                  control={<Switch defaultChecked color="primary" />}
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Assessment sx={{ fontSize: 18 }} />
                      <span>Отчеты</span>
                    </Stack>
                  }
                />
              </Stack>
              <Button
                variant="contained"
                fullWidth
                startIcon={<AdminPanelSettings />}
              >
                Настройки доступа
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Политика паролей */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mb: 3 }}
              >
                <Password sx={{ fontSize: 40, color: "primary.main" }} />
                <Box>
                  <Typography variant="h6">Политика паролей</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Настройки безопасности
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={2} sx={{ mb: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Минимальная длина</InputLabel>
                  <Select
                    value={passwordLength}
                    label="Минимальная длина"
                    onChange={handlePasswordLengthChange}
                  >
                    <MenuItem value="6">6 символов</MenuItem>
                    <MenuItem value="8">8 символов</MenuItem>
                    <MenuItem value="10">10 символов</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Срок действия</InputLabel>
                  <Select
                    value={passwordExpiry}
                    label="Срок действия"
                    onChange={handlePasswordExpiryChange}
                  >
                    <MenuItem value="30">30 дней</MenuItem>
                    <MenuItem value="90">90 дней</MenuItem>
                    <MenuItem value="180">180 дней</MenuItem>
                  </Select>
                </FormControl>

                <Stack spacing={1}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Сложность пароля"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="История паролей"
                  />
                </Stack>
              </Stack>
              <Button variant="contained" fullWidth startIcon={<Lock />}>
                Сохранить политику
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Настройки сессии */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mb: 3 }}
              >
                <Timer sx={{ fontSize: 40, color: "primary.main" }} />
                <Box>
                  <Typography variant="h6">Настройки сессии</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Параметры авторизации
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={2} sx={{ mb: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Время сессии</InputLabel>
                  <Select
                    value={sessionTime}
                    label="Время сессии"
                    onChange={handleSessionTimeChange}
                  >
                    <MenuItem value="15">15 минут</MenuItem>
                    <MenuItem value="30">30 минут</MenuItem>
                    <MenuItem value="60">1 час</MenuItem>
                    <MenuItem value="240">4 часа</MenuItem>
                  </Select>
                </FormControl>

                <Stack spacing={1}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Автоматический выход"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Ограничение попыток входа"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Многофакторная аутентификация"
                  />
                </Stack>
              </Stack>
              <Button variant="contained" fullWidth startIcon={<Security />}>
                Сохранить настройки
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Дополнительные настройки */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mb: 3 }}
              >
                <Tune sx={{ fontSize: 40, color: "primary.main" }} />
                <Box>
                  <Typography variant="h6">Дополнительно</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Дополнительные параметры
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={2}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Автоматическое обновление"
                />
                <FormControlLabel
                  control={<Switch />}
                  label="Резервное копирование"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Логирование событий"
                />
                <FormControlLabel
                  control={<Switch />}
                  label="Уведомления по email"
                />
              </Stack>

              <Button
                variant="outlined"
                fullWidth
                startIcon={<Settings />}
                sx={{ mt: 3 }}
              >
                Расширенные настройки
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Мониторинг системы */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ mb: 3 }}
              >
                <Visibility sx={{ fontSize: 40, color: "primary.main" }} />
                <Box>
                  <Typography variant="h6">Мониторинг</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Статус системы
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <Chip
                  label="Система работает"
                  color="success"
                  variant="outlined"
                  sx={{ width: "100%" }}
                />
                <Chip
                  label="База данных: Online"
                  color="success"
                  variant="outlined"
                  sx={{ width: "100%" }}
                />
                <Chip
                  label="API: Стабильно"
                  color="info"
                  variant="outlined"
                  sx={{ width: "100%" }}
                />
                <Chip
                  label="Нагрузка: 45%"
                  color="warning"
                  variant="outlined"
                  sx={{ width: "100%" }}
                />
              </Stack>

              <Button variant="outlined" fullWidth>
                Подробный мониторинг
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>


      {/* Модальное окно для создания пользователя */}
      <Dialog
        open={userModalOpen}
        onClose={handleCloseUserModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              {editingUser ? "Редактирование пользователя" : "Создание пользователя"}
            </Typography>
            <IconButton onClick={handleCloseUserModal}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ФИО *"
                  value={userForm.fullName}
                  onChange={(e) =>
                    handleUserFormChange("fullName", e.target.value)
                  }
                  margin="normal"
                  required
                  disabled={submitting}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Пароль *"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  required={!editingUser}
                  disabled={submitting}
                  helperText={editingUser ? "Оставьте пустым, если не нужно менять" : "Минимум 6 символов"}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) =>
                    handleUserFormChange("email", e.target.value)
                  }
                  margin="normal"
                  disabled={submitting}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Роль *</InputLabel>
                  <Select
  value={userForm.role}
  label="Роль *"
  onChange={(e) =>
    handleUserFormChange("role", e.target.value as "Админситратор" | "Менеджер" | "Оператор" | "Гость")
  }
  required
  disabled={submitting}
>
  <MenuItem value="Гость">Гость</MenuItem>
  <MenuItem value="Оператор">Оператор</MenuItem>
  <MenuItem value="Менеджер">Менеджер</MenuItem>
  <MenuItem value="Администратор">Администратор</MenuItem>
</Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userForm.isActive}
                      onChange={(e) =>
                        handleUserFormChange("isActive", e.target.checked)
                      }
                      disabled={submitting}
                    />
                  }
                  label={userForm.isActive ? "Активный пользователь" : "Пользователь неактивен"}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseUserModal}
            disabled={submitting}
            variant="outlined"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSaveUser}
            disabled={submitting}
            variant="contained"
            color="primary"
          >
            {submitting ? "Сохранение..." : editingUser ? "Сохранить" : "Создать"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};