// pages/DashboardPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  //IconButton,
  //Avatar,
  //Divider,
  //List,
  //ListItem,
  //ListItemIcon,
  //ListItemText,
  //TextField,
  //InputAdornment,
  //MenuItem,
  //LinearProgress,
  Tooltip,
  CardHeader,
  //TablePagination,
  //Select,
  //FormControl,
  //InputLabel,
} from "@mui/material";
import {
  AcUnit,
  Lock,
  Videocam,
  //Assignment,
  //AdminPanelSettings,
  //Assessment,
  //Menu,
  //DarkMode,
  //Notifications,
  //Settings,
  //Logout,
  //ExpandMore,
  TrendingUp,
  Build,
  CalendarToday,
  //ChevronLeft,
  //ChevronRight,
  Add,
  //Close,
  //ArrowBack,
  //Search,
  //FilterList,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Schedule,
  //Group,
  //Event,
  //Description,
  Download,
  //Visibility,
  //Dashboard as DashboardIcon,
  //Handyman,
  //SensorDoor,
  //MoreVert,
  PlayArrow,
  //Pause,
  //Stop,
  //AccessTime,
  PriorityHigh,
  //FireExtinguisher,
} from "@mui/icons-material";

import { ReportPagination } from "../components/reports/Pagination";

// Компонент строки Ганта для лучшей читаемости
const GanttRow: React.FC<{
  task: any;
  days: Array<{ day: number; date: Date; isToday: boolean; label?: string }>;
  viewMode: "week" | "month" | "quarter";
  getTaskStatusLabel: (status: string) => string;
  getTaskStatusColor: (status: string) => string;
}> = ({ task, days, viewMode, getTaskStatusLabel, getTaskStatusColor }) => {
  const getTaskPosition = (taskDate: number, viewDate: Date) => {
    if (viewMode === "quarter") {
      // Для квартала: распределяем по месяцам
      const quarterMonth = Math.floor((taskDate - 1) / 10); // 0, 1 или 2
      const monthIndex = viewDate.getMonth();
      const quarterStartMonth = Math.floor(monthIndex / 3) * 3;
      return quarterMonth === monthIndex - quarterStartMonth;
    } else {
      // Для недели и месяца: проверяем день
      return taskDate === viewDate.getDate();
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        borderBottom: "1px solid #f0f0f0",
        minWidth: "1200px",
        "&:hover": { backgroundColor: "#fafafa" },
      }}
    >
      {/* Левая часть с информацией о задаче */}
      <Box sx={{ width: 300, borderRight: "1px solid #e0e0e0", p: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {task.task}
            </Typography>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}
            >
              <Chip
                label={task.system}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: "0.7rem" }}
                color={
                  task.system === "ЖКХ"
                    ? "primary"
                    : task.system === "СКУД"
                    ? "secondary"
                    : "default"
                }
              />
              <Typography variant="caption" color="text.secondary">
                {task.responsible}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={getTaskStatusLabel(task.status)}
            size="small"
            color={getTaskStatusColor(task.status) as any}
            sx={{ height: 20, fontSize: "0.7rem" }}
          />
        </Box>
      </Box>

      {/* Правая часть с диаграммой */}
      <Box sx={{ display: "flex", flex: 1, position: "relative" }}>
        {days.map((dayInfo, index) => {
          const isInRange = getTaskPosition(task.startDay, dayInfo.date);
          const isStart =
            index === 0 ||
            !getTaskPosition(task.startDay, days[index - 1].date);
          const isEnd =
            index === days.length - 1 ||
            !getTaskPosition(task.startDay, days[index + 1].date);

          return (
            <Box
              key={index}
              sx={{
                width:
                  viewMode === "week" ? 40 : viewMode === "month" ? 30 : 100,
                height: 50,
                borderRight: "1px solid #f0f0f0",
                position: "relative",
              }}
            >
              {/* Фон задачи */}
              {isInRange && (
                <Tooltip
                  title={`${task.task}: ${task.startDay}-${task.endDay}`}
                  arrow
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: isStart ? 0 : -1,
                      right: isEnd ? 0 : -1,
                      height: 24,
                      transform: "translateY(-50%)",
                      backgroundColor: task.color,
                      opacity: 0.8,
                      borderRadius:
                        isStart && isEnd
                          ? "4px"
                          : isStart
                          ? "4px 0 0 4px"
                          : isEnd
                          ? "0 4px 4px 0"
                          : 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* Индикатор прогресса */}
                    {task.status === "inProgress" && task.progress > 0 && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          height: "100%",
                          width: `${task.progress}%`,
                          backgroundColor: "rgba(255, 255, 255, 0.3)",
                        }}
                      />
                    )}

                    {/* Иконка статуса */}
                    {task.status === "inProgress" && (
                      <PlayArrow sx={{ fontSize: 16, color: "white" }} />
                    )}
                    {task.status === "completed" && (
                      <CheckCircle sx={{ fontSize: 16, color: "white" }} />
                    )}
                    {task.status === "delayed" && (
                      <PriorityHigh sx={{ fontSize: 16, color: "white" }} />
                    )}
                  </Box>
                </Tooltip>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [tblTasks, setTblTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Состояния для пагинации
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  /*const [rowsPerPageOptions] = useState([10, 25, 50, 100]);*/

  // Состояние для режима просмотра диаграммы Ганта
  const [viewMode, setViewMode] = useState<"week" | "month" | "quarter">(
    "month"
  );

  useEffect(() => {
    fetchTblTasks();
  }, []);

  const fetchTblTasks = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        "/rest/v1/contexts/users.admin.models.workerMS/variables/tblTasks",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        throw error;
      }

      const data = await response.json();
      setTblTasks(data || []);
    } catch (error) {
      console.error("Ошибка при загрузке задач:", error);
      setTblTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация задач по системам
  const getTasksBySystem = (systemType: string) => {
  return tblTasks.filter((task) => {
    if (!task.type) return false;
    
    const taskSystem = normalizeSystemName(getSystemName(task.type));

    if (systemType === "hvac") {
      return taskSystem === "ЖКХ" || taskSystem === "hvac";
    } else if (systemType === "access") {
      return taskSystem === "СКУД" || taskSystem === "access";
    } else if (systemType === "cctv") {
      return taskSystem === "Видеонаблюдение" || taskSystem === "video" || taskSystem === "cctv";
    }
    return false;
  });
};

  // Вспомогательные функции (вынесены до использования)
  const calculateSystemHealth = (systemId: string): number => {
    const systemTasks = getTasksBySystem(systemId);
    if (systemTasks.length === 0) return 95;

    const completedTasks = systemTasks.filter(
      (t: any) => t.action === "Выполнено"
    ).length;
    const totalTasks = systemTasks.length;

    return Math.round((completedTasks / totalTasks) * 100);
  };

  const calculateAvgResponseTime = (systemId: string): string => {
    const systemTasks = getTasksBySystem(systemId);
    if (systemTasks.length === 0) return "2.1ч";

    // Здесь можно добавить логику расчета реального времени
    return systemTasks.length < 5 ? "1.8ч" : "2.4ч";
  };

  const calculateCompletedOnTime = (systemId: string): string => {
    const systemTasks = getTasksBySystem(systemId);
    if (systemTasks.length === 0) return "96%";

    const completedTasks = systemTasks.filter(
      (t: any) => t.action === "Выполнено"
    ).length;
    const totalTasks = systemTasks.length;

    return `${Math.round((completedTasks / totalTasks) * 100)}%`;
  };

  const calculateOverallAvgResponseTime = (): string => {
    if (tblTasks.length === 0) return "2.1ч";
    return "2.1ч";
  };

  const calculateOverallCompletedOnTime = (): string => {
    if (tblTasks.length === 0) return "96%";

    const completedTasks = tblTasks.filter(
      (t: any) => t.action === "Выполнено"
    ).length;
    const totalTasks = tblTasks.length;

    return `${Math.round((completedTasks / totalTasks) * 100)}%`;
  };

  const getSystemName = (type: string): string => {
  if (!type) return "Общее";

  // Приводим к нижнему регистру для сравнения
  const typeLower = type.toLowerCase();
  
  if (
    typeLower.includes("насос") || typeLower.includes("температур") || typeLower.includes("вентиляц") ||
    typeLower.includes("отопление") || typeLower.includes("кондиц") || typeLower.includes("теплов") ||
    typeLower.includes("клапан") || typeLower.includes("hvac")
  ) {
    return "hvac";
  } else if (
    typeLower.includes("скуд") || typeLower.includes("считыватель") || typeLower.includes("контроллер") ||
    typeLower.includes("замок") || typeLower.includes("access")
  ) {
    return "access";
  } else if (
    typeLower.includes("сервер") || typeLower.includes("видео") || typeLower.includes("камера") ||
    typeLower.includes("регистратор") || typeLower.includes("video")
  ) {
    return "video";
  } else if (
    typeLower.includes("GSM") || typeLower.includes("сигнализац") || typeLower.includes("дыма")
  ) {
    return "fire";
  }

  // Если система не определена, возвращаем "Общее"
  return "fire";  //"Общее"
};

// Добавьте функцию для нормализации системных имен к стандартным значениям
const normalizeSystemName = (system: string): string => {
  const systemLower = system.toLowerCase();
  
  if (systemLower === "hvac" || systemLower === "жкх") {
    return "ЖКХ";
  } else if (systemLower === "скуд" || systemLower === "access") {
    return "СКУД";
  } else if (systemLower === "video" || systemLower === "cctv") {
    return "Видеонаблюдение";
  } else if (systemLower === "пб" || systemLower === "fire") {
    return "Пожарная";
  }
  // Возвращаем оригинальное значение, если оно соответствует одному из допустимых
  //if (["hvac", "СКУД", "Видеонаблюдение", "ЖКХ", "access", "video"].includes(system)) {
    return system;
  //}
  
  // По умолчанию возвращаем "Общее"
  //return "Общее";
};

  const formatDate = (dateString: string): string => {
    if (!dateString) return "Не указано";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU");
    } catch {
      return dateString;
    }
  };

  const getStatusLabel = (action: string): string => {
    switch (action) {
      case "В работе":
        return "В работе";
      case "Выполнено":
        return "В норме";
      case "Запланировано":
        return "Плановый осмотр";
      case "Задержка":
        return "Требует обслуживания";
      default:
        return "Плановый осмотр";
    }
  };

  const getTaskStatus = (action: string): string => {
    switch (action) {
      case "В работе":
        return "inProgress";
      case "Выполнено":
        return "completed";
      case "Запланировано":
        return "planned";
      case "Задержка":
        return "delayed";
      default:
        return "planned";
    }
  };

  const getSystemColor = (system: string): string => {
  const normalizedSystem = normalizeSystemName(system);
  
  switch (normalizedSystem) {
    case "ЖКХ":
      return "#2196f3";
    case "СКУД":
      return "#9c27b0";
    case "Видеонаблюдение":
      return "#ff9800";
    case "Пожарная":
      return "#f44336"; // Красный для пожарной системы
    default:
      return "#757575";
  }
};

  // Функции для управления режимами просмотра диаграммы Ганта
  const handleViewModeChange = (mode: "week" | "month" | "quarter") => {
    setViewMode(mode);
  };

  const getGanttTitle = () => {
    const now = new Date();
    switch (viewMode) {
      case "week":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `Диаграмма Ганта на неделю ${startOfWeek.toLocaleDateString(
          "ru-RU"
        )} - ${endOfWeek.toLocaleDateString("ru-RU")}`;
      case "month":
        const monthName = now.toLocaleDateString("ru-RU", { month: "long" });
        return `Диаграмма Ганта на ${monthName} ${now.getFullYear()}`;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        return `Диаграмма Ганта на ${quarter} квартал ${now.getFullYear()}`;
      default:
        return "Диаграмма Ганта плановых работ";
    }
  };

  const getDaysForView = () => {
    const now = new Date();
    const days: Array<{
      day: number;
      date: Date;
      isToday: boolean;
      label?: string;
    }> = [];

    switch (viewMode) {
      case "week":
        // 7 дней текущей недели
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        for (let i = 0; i < 7; i++) {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          days.push({
            day: date.getDate(),
            date,
            isToday: date.toDateString() === now.toDateString(),
          });
        }
        break;

      case "month":
        // 31 день месяца (как было)
        for (let i = 1; i <= 31; i++) {
          const date = new Date(now.getFullYear(), now.getMonth(), i);
          days.push({
            day: i,
            date,
            isToday: i === now.getDate(),
          });
        }
        break;

      case "quarter":
        // 3 месяца квартала
        const quarter = Math.floor(now.getMonth() / 3);
        const monthNames = [
          "Янв",
          "Фев",
          "Мар",
          "Апр",
          "Май",
          "Июн",
          "Июл",
          "Авг",
          "Сен",
          "Окт",
          "Ноя",
          "Дек",
        ];
        for (let i = 0; i < 3; i++) {
          const monthIndex = quarter * 3 + i;
          days.push({
            day: 1,
            date: new Date(now.getFullYear(), monthIndex, 1),
            isToday: false,
            label: monthNames[monthIndex],
          });
        }
        break;
    }

    return days;
  };

  const getDayOfWeek = (date: Date) => {
    const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    return days[date.getDay()];
  };

  // Статистика по системам на основе данных из tblTasks
  const systems = [
    {
      id: "hvac",
      name: "Система ЖКХ",
      icon: <AcUnit sx={{ fontSize: 40 }} />,
      status: "Норма",
      value: `${calculateSystemHealth("hvac")}%`,
      color: "success" as const,
      activeRequests: getTasksBySystem("hvac").filter(
        (t: any) => t.action === "В работе"
      ).length,
      avgResponse: calculateAvgResponseTime("hvac"),
      completedOnTime: calculateCompletedOnTime("hvac"),
    },
    {
      id: "access",
      name: "Система СКУД",
      icon: <Lock sx={{ fontSize: 40 }} />,
      status: "Норма",
      value: `${calculateSystemHealth("access")}%`,
      color: "success" as const,
      activeRequests: getTasksBySystem("access").filter(
        (t: any) => t.action === "В работе"
      ).length,
      avgResponse: calculateAvgResponseTime("access"),
      completedOnTime: calculateCompletedOnTime("access"),
    },
    {
      id: "cctv",
      name: "Видеонаблюдение",
      icon: <Videocam sx={{ fontSize: 40 }} />,
      status: "Внимание",
      value: `${calculateSystemHealth("cctv")}%`,
      color: "warning" as const,
      activeRequests: getTasksBySystem("cctv").filter(
        (t: any) => t.action === "В работе"
      ).length,
      avgResponse: calculateAvgResponseTime("cctv"),
      completedOnTime: calculateCompletedOnTime("cctv"),
    },
    /*// Пожарная система
    {
    id: "fire",
    name: "Пожарная система",
    icon: <FireExtinguisher sx={{ fontSize: 40 }} />, 
    status: "Норма",
    value: `${calculateSystemHealth("fire")}%`,
    color: "success" as const,
    activeRequests: getTasksBySystem("fire").filter(
      (t: any) => t.action === "В работе"
    ).length,
    avgResponse: calculateAvgResponseTime("fire"),
    completedOnTime: calculateCompletedOnTime("fire"),
    },*/
  ];

  // Оборудование к обслуживанию (с пагинацией)
  const maintenanceEquipment = tblTasks
  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  .map((task: any) => ({
    equipment: task.device || task.type || "Не указано",
    system: normalizeSystemName(getSystemName(task.type)), // Нормализуем систему
    lastService: formatDate(task.taskDate),
    status: getStatusLabel(task.action),
    id: task.id || Math.random().toString(),
  }));

  // KPI статистика на основе всех задач
  const kpiStats = {
    totalActiveRequests: tblTasks.filter((t: any) => t.action === "В работе")
      .length,
    avgResponseTime: calculateOverallAvgResponseTime(),
    completedOnTime: calculateOverallCompletedOnTime(),
    criticalIncidents: tblTasks.filter((t: any) => t.action === "Задержка")
      .length,
  };

  // Генерация диаграммы Ганта из данных tblTasks
  const ganttTasks = tblTasks.slice(0, 7).map((task: any, index: number) => {
    const startDay = ((index * 3) % 28) + 2; // Распределяем задачи по дням
    const endDay = startDay + Math.floor(Math.random() * 3) + 1;
    // Нормализуем название системы
    const normalizedSystem = normalizeSystemName(getSystemName(task.type));

    return {
      id: task.id || index,
      task: task.task || "Обслуживание оборудования",
      system: normalizedSystem,
      responsible: task.user || "Не назначен",
      startDay,
      endDay,
      duration: endDay - startDay + 1,
      status: getTaskStatus(task.action),
      progress:
        task.action === "В работе" ? 60 : task.action === "Выполнено" ? 100 : 0,
      color: getSystemColor(normalizedSystem),
    };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Требует обслуживания":
        return "error";
      case "В работе":
        return "warning";
      case "Плановый осмотр":
        return "info";
      case "В норме":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Требует обслуживания":
        return <ErrorIcon fontSize="small" />;
      case "В работе":
        return <Warning fontSize="small" />;
      case "Плановый осмотр":
        return <Schedule fontSize="small" />;
      case "В норме":
        return <CheckCircle fontSize="small" />;
      default:
        return <Warning fontSize="small" />;
    }
  };

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case "inProgress":
        return "В работе";
      case "planned":
        return "Запланировано";
      case "completed":
        return "Выполнено";
      case "delayed":
        return "Задержка";
      default:
        return "Запланировано";
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "inProgress":
        return "warning";
      case "planned":
        return "info";
      case "completed":
        return "success";
      case "delayed":
        return "error";
      default:
        return "default";
    }
  };

  // Обработчики для пагинации
  /*const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };*/

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ p: 0 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <Typography>Загрузка данных...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ p: 0 }}>
      <Box sx={{ p: 0 }}>
        <Grid container spacing={0}>
          <Grid item xs={12}>
            {/* Карточки систем */}
            <Grid container spacing={2} sx={{ mb: 3, px: 2 }}>
              {systems.map((system) => (
                <Grid item xs={12} md={4} key={system.id}>
                  <Card>
                    <CardContent>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                        <Box sx={{ mr: 2, color: `${system.color}.main` }}>
                          {system.icon}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6">{system.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {system.id.toUpperCase()} System
                          </Typography>
                        </Box>
                        <Chip
                          label={system.status}
                          color={system.color}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="h4" color={`${system.color}.main`}>
                        {system.value}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Работоспособность
                      </Typography>

                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                          <Typography variant="h6">
                            {system.activeRequests}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Активные заявки
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="h6">
                            {system.avgResponse}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Ср. время реакции
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="h6">
                            {system.completedOnTime}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Выполнено в срок
                          </Typography>
                        </Grid>
                      </Grid>

                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={() => navigate(`/${system.id}`)}
                      >
                        Перейти к системе
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* KPI по заявкам */}
            <Paper sx={{ p: 3, mb: 3, mx: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: "primary.main" }} />
                <Typography variant="h6">
                  KPI по заявкам на обслуживание
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h3" color="primary">
                      {kpiStats.totalActiveRequests}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Всего активных заявок
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h3" color="warning.main">
                      {kpiStats.avgResponseTime}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Среднее время реакции
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h3" color="success.main">
                      {kpiStats.completedOnTime}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Выполнено в срок
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h3" color="error.main">
                      {kpiStats.criticalIncidents}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Критических инцидентов
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Оборудование к обслуживанию с пагинацией */}
            <Paper sx={{ p: 3, mb: 3, mx: 2 }}>
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      mb: 2,
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Build sx={{ mr: 1, color: "primary.main" }} />
      <Typography variant="h6">
        Оборудование к обслуживанию
      </Typography>
    </Box>
  </Box>
  
  <TableContainer>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Оборудование</TableCell>
          <TableCell>Система</TableCell>
          <TableCell>Дата последнего обслуживания</TableCell>
          <TableCell>Статус</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {maintenanceEquipment.map((item) => {
          // Нормализуем название системы перед отображением
          const normalizedSystem = normalizeSystemName(item.system);
          
          return (
            <TableRow key={item.id}>
              <TableCell>{item.equipment}</TableCell>
              <TableCell>
                <Chip
                  label={normalizedSystem}
                  size="small"
                  variant="outlined"
                  color={
                    normalizedSystem === "ЖКХ"
                      ? "primary"
                      : normalizedSystem === "СКУД"
                      ? "secondary"
                      : normalizedSystem === "Видеонаблюдение"
                      ? "warning"
                      : normalizedSystem === "Пожарная"
                      ? "error"
                      : "default"
                  }
                />
              </TableCell>
              <TableCell>{item.lastService}</TableCell>
              <TableCell>
                <Chip
                  icon={getStatusIcon(item.status)}
                  label={item.status}
                  color={getStatusColor(item.status) as any}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
  
  {/* Используем ReportPagination вместо TablePagination */}
  {tblTasks.length > 0 && (
    <ReportPagination
      page={page + 1} // +1 потому что ReportPagination использует 1-based индексацию
      rowsPerPage={rowsPerPage}
      totalRows={tblTasks.length}
      onPageChange={(newPage) => setPage(newPage - 1)} // -1 потому что ReportPagination использует 1-based индексацию
      onRowsPerPageChange={(newRowsPerPage) => {
        setRowsPerPage(newRowsPerPage);
        setPage(0);
      }}
      disabled={loading}
    />
  )}
</Paper>

            {/* Диаграмма Ганта - Регламент обслуживания */}
            <Paper sx={{ p: 3, mx: 2, mb: 3 }}>
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CalendarToday sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="h6">
                      Регламент обслуживания оборудования
                    </Typography>
                  </Box>
                }
                action={
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="outlined" startIcon={<Add />}>
                      Новая задача
                    </Button>
                    <Button variant="outlined" size="small">
                      <Download />
                    </Button>
                  </Box>
                }
              />

              <Box
                sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}
              >
                <Typography variant="body2" color="text.secondary">
                  {getGanttTitle()}
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                  variant={viewMode === "week" ? "contained" : "outlined"}
                  size="small"
                  onClick={() => handleViewModeChange("week")}
                >
                  Неделя
                </Button>
                <Button
                  variant={viewMode === "month" ? "contained" : "outlined"}
                  size="small"
                  onClick={() => handleViewModeChange("month")}
                >
                  Месяц
                </Button>
                <Button
                  variant={viewMode === "quarter" ? "contained" : "outlined"}
                  size="small"
                  onClick={() => handleViewModeChange("quarter")}
                >
                  Квартал
                </Button>
              </Box>

              {/* Легенда диаграммы Ганта */}
              <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: "#4caf50",
                      borderRadius: "2px",
                    }}
                  />
                  <Typography variant="caption">Выполнено</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: "#ff9800",
                      borderRadius: "2px",
                    }}
                  />
                  <Typography variant="caption">В работе</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: "#2196f3",
                      borderRadius: "2px",
                    }}
                  />
                  <Typography variant="caption">Запланировано</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: "#f44336",
                      borderRadius: "2px",
                    }}
                  />
                  <Typography variant="caption">Задержка</Typography>
                </Box>
              </Box>

              {/* Контейнер диаграммы Ганта */}
              <Paper variant="outlined" sx={{ overflow: "auto" }}>
                {/* Шапка с днями */}
                <Box
                  sx={{
                    display: "flex",
                    borderBottom: "1px solid #e0e0e0",
                    minWidth: "1200px",
                  }}
                >
                  <Box
                    sx={{ width: 300, borderRight: "1px solid #e0e0e0", p: 1 }}
                  >
                    <Typography variant="subtitle2">
                      Задача / Ответственный
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flex: 1 }}>
                    {getDaysForView().map((dayInfo, index) => (
                      <Box
                        key={index}
                        sx={{
                          width:
                            viewMode === "week"
                              ? 40
                              : viewMode === "month"
                              ? 30
                              : 100,
                          borderRight: "1px solid #f0f0f0",
                          p: 1,
                          textAlign: "center",
                          backgroundColor: dayInfo.isToday
                            ? "rgba(33, 150, 243, 0.1)"
                            : "transparent",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: dayInfo.isToday ? "bold" : "normal",
                            color: dayInfo.isToday
                              ? "primary.main"
                              : "text.secondary",
                          }}
                        >
                          {viewMode === "quarter" ? dayInfo.label : dayInfo.day}
                        </Typography>
                        {viewMode === "week" && (
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            {getDayOfWeek(dayInfo.date)}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Строки задач */}
                {ganttTasks.map((task: any) => (
                  <GanttRow
                    key={task.id}
                    task={task}
                    days={getDaysForView()}
                    viewMode={viewMode}
                    getTaskStatusLabel={getTaskStatusLabel}
                    getTaskStatusColor={getTaskStatusColor}
                  />
                ))}
              </Paper>

              {/* Статистика по задачам */}
              <Grid container spacing={2} sx={{ mt: 3 }}>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: "center", p: 2 }}>
                      <Typography variant="h4" color="primary">
                        {tblTasks.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Всего задач
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: "center", p: 2 }}>
                      <Typography variant="h4" color="warning.main">
                        {
                          tblTasks.filter((t: any) => t.action === "В работе")
                            .length
                        }
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        В работе
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: "center", p: 2 }}>
                      <Typography variant="h4" color="success.main">
                        {
                          tblTasks.filter((t: any) => t.action === "Выполнено")
                            .length
                        }
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Выполнено
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: "center", p: 2 }}>
                      <Typography variant="h4" color="error.main">
                        {
                          tblTasks.filter((t: any) => t.action === "Задержка")
                            .length
                        }
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        С задержкой
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};
