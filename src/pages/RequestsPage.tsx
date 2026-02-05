// pages/RequestsPage.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Snackbar,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
  IconButton,
} from "@mui/material";
import {
  Add,
  Visibility,
  PlayArrow,
  Check,
  Refresh,
  Search,
  Assignment,
  Close,
  Build,
  Settings,
  LocalHospital,
  Handyman,
  CheckCircle,
  Warning,
} from "@mui/icons-material";
import { requestsApi, Order } from "../api/requests";
import { useFormattedId } from "../hooks/useFormattedId";
import { AssignOrderModal } from "../components/requests/AssignOrderModal";
import { apiClient } from "../api/client";
// Импортируем внешний компонент пагинации
import { ReportPagination } from "../components/reports/Pagination";

// Константы для WebSocket
const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:9443";
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

// Интерфейс для данных формы новой заявки
interface NewOrderFormData {
  id: string;
  type: "Замена" | "Ремонт" | "Настройка" | "Обслуживание";
  device: string;
  description: string;
  status: string;
  date: string;
  priority: string;
  user: string;
}

// Интерфейс для Snackbar
interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

const RequestsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<NewOrderFormData>({
    id: "",
    type: "Ремонт",
    device: "",
    description: "",
    status: "Создана",
    priority: "",
    date: new Date().toISOString().split("T")[0],
    user: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  // Используем хук для генерации следующего ID
  const nextOrderId = useFormattedId({ orders });
  // Обновление заявки
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);
  // Просмотр деталей заявки
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Состояния для пагинации
  const [page, setPage] = useState(1); // Внешний компонент использует 1-based индексацию
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // WebSocket состояния
  const [wsConnected, setWsConnected] = useState(false);
  // const wsRef = useRef<WebSocket | null>(null);

  // Функция загрузки заявок через API клиент (как в рабочей версии HVACSystemPage)
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("🔄 Загрузка заявок через apiClient...");

      // Используем apiClient как в работающей версии HVACSystemPage
      const response = await apiClient.get("tblOrders");

      console.log("✅ Ответ от сервера:", response);

      if (response && Array.isArray(response)) {
        // Преобразуем данные в формат Order
        const ordersData: Order[] = response.map(
          (item: any, index: number) => ({
            id: item.id || item.orderId || `order-${index + 1}`,
            type: item.type || "Ремонт",
            device: item.device || item.equipment || item.name || "",
            description: item.description || item.problem || "",
            priority: item.priority || "Средний",
            status: item.status || "Создана",
            user: item.user || item.responsible || item.engineer || "",
            date:
              item.date ||
              item.createdDate ||
              item.createdAt ||
              new Date().toISOString(),
            startDate: item.startDate || item.startedAt || null,
            endDate: item.endDate || item.completedAt || null,
            originalData: item, // Сохраняем оригинальные данные
          }),
        );

        setOrders(ordersData);
        console.log("✅ Заявки получены:", ordersData.length, "шт");

        if (ordersData.length > 0) {
          console.log("🔍 Пример заявки:");
          console.log("   Номер:", ordersData[0].id);
          console.log("   Тип:", ordersData[0].type);
          console.log("   Оборудование:", ordersData[0].device);
          console.log("   Описание:", ordersData[0].description);
          console.log("   Приоритет:", ordersData[0].priority);
          console.log("   Ответственный:", ordersData[0].user);
          console.log("   Статус:", ordersData[0].status);
        }
      } else {
        console.warn("⚠️ Ответ от сервера не является массивом:", response);
        throw new Error("Некорректный формат данных от сервера");
      }
    } catch (err: any) {
      console.error("❌ Ошибка загрузки заявок:", err);

      // Для отладки покажем детали ошибки
      if (err.response) {
        console.error("Детали ошибки:", {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
        });
      }

      setError("Не удалось загрузить заявки. Используются демо-данные.");

      // Показываем демо-данные для отладки
      const mockOrders: Order[] = [
        {
          id: "ORD-001",
          type: "Ремонт",
          device: "Насос циркуляционный",
          description: "Не включается насос в системе отопления",
          priority: "Высокий",
          status: "Создана",
          user: "",
          date: "2024-01-15T10:30:00",
          startDate: null,
          endDate: null,
        },
        {
          id: "ORD-002",
          type: "Обслуживание",
          device: "Вентиляционная установка",
          description: "Плановое техническое обслуживание",
          priority: "Средний",
          status: "В работе",
          user: "Иванов П.К.",
          date: "2024-01-14T09:15:00",
          startDate: "2024-01-15T08:00:00",
          endDate: null,
        },
        {
          id: "ORD-003",
          type: "Замена",
          device: "Датчик температуры",
          description: "Замена неисправного датчика в котельной",
          priority: "Низкий",
          status: "Закрыта",
          user: "Смирнов А.П.",
          date: "2024-01-13T14:20:00",
          startDate: "2024-01-14T10:00:00",
          endDate: "2024-01-14T16:30:00",
        },
        {
          id: "ORD-004",
          type: "Настройка",
          device: "Контроллер температуры",
          description: "Настройка температурных параметров",
          priority: "Средний",
          status: "В работе",
          user: "Васильев М.С.",
          date: "2024-01-16T09:00:00",
          startDate: "2024-01-16T10:00:00",
          endDate: null,
        },
        {
          id: "ORD-005",
          type: "Обслуживание",
          device: "Фильтр воздушный",
          description: "Замена фильтров в системе вентиляции",
          priority: "Низкий",
          status: "Создана",
          user: "",
          date: "2024-01-17T11:00:00",
          startDate: null,
          endDate: null,
        },
      ];

      setOrders(mockOrders);
      console.log("🔄 Используются демо-данные");
    } finally {
      setLoading(false);
    }
  };

  // Инициализация WebSocket подключения (исправленная версия)
  useEffect(() => {
    let socket: WebSocket | null = null;

    const connectWebSocket = () => {
      if (!WS_URL) {
        console.warn("WebSocket URL не настроен");
        return;
      }

      try {
        console.log("🔗 Подключение к WebSocket:", WS_URL);
        socket = new WebSocket(WS_URL);

        socket.onopen = () => {
          console.log("✅ WebSocket подключен");
          setWsConnected(true);

          // Получаем токен как в работающей версии
          const token = localStorage.getItem("access_token");
          console.log("🔑 Токен доступен:", !!token);

          // Формируем сообщение как в работающей версии HVACSystemPage
          const subscribeMsg = {
            type: "SUBSCRIBE",
            path: "tblOrders", // Подписываемся на таблицу заявок
            ...(token && { token }), // Добавляем токен если есть
          };

          socket?.send(JSON.stringify(subscribeMsg));
          console.log("📡 Подписка отправлена:", subscribeMsg);

          setSnackbar({
            open: true,
            message: "Реальное время подключено для заявок",
            severity: "success",
          });
        };

        socket.onmessage = (event: MessageEvent) => {
          try {
            const message = JSON.parse(event.data) as {
              type: string;
              value?: any;
              error?: string;
            };

            console.log("📨 WS сообщение:", message.type);

            if (message.type === "UPDATE") {
              console.log("🔄 Обновление данных через WS");
              handleWebSocketData(message.value);
            } else if (message.type === "ERROR") {
              console.error("❌ WebSocket ошибка:", message.error);
              if (
                message.error?.includes("401") ||
                message.error?.includes("auth")
              ) {
                setSnackbar({
                  open: true,
                  message: "Требуется авторизация для WebSocket",
                  severity: "warning",
                });
              }
            }
          } catch (error) {
            console.error("❌ Ошибка обработки WS сообщения:", error);
            console.log("📨 Сырое сообщение:", event.data);
          }
        };

        socket.onerror = (error: Event) => {
          console.error("❌ WebSocket ошибка:", error);
          setWsConnected(false);
        };

        socket.onclose = (event: CloseEvent) => {
          console.log(
            `🔌 WebSocket отключен. Код: ${event.code}, Причина: ${event.reason}`,
          );
          setWsConnected(false);

          // Пытаемся переподключиться только если не была нормальная причина закрытия
          if (event.code !== 1000) {
            setTimeout(() => {
              console.log("🔄 Попытка переподключения WebSocket...");
              connectWebSocket();
            }, 5000);
          }
        };
      } catch (error) {
        console.error("❌ Ошибка создания WebSocket:", error);
      }
    };

    const handleWebSocketData = (data: any) => {
      try {
        if (!data) return;

        console.log("🔄 Обработка данных WS:", data);

        // Проверяем формат данных
        if (Array.isArray(data)) {
          const updatedOrders: Order[] = data.map((item: any) => ({
            id: item.id || item.orderId || `order-${Date.now()}`,
            type: item.type || "Ремонт",
            device: item.device || item.equipment || "",
            description: item.description || item.problem || "",
            priority: item.priority || "Средний",
            status: item.status || "Создана",
            user: item.user || item.responsible || "",
            date: item.date || item.createdDate || new Date().toISOString(),
            startDate: item.startDate || null,
            endDate: item.endDate || null,
            originalData: item,
          }));

          setOrders(updatedOrders);
          console.log(
            "✅ Заявки обновлены через WebSocket:",
            updatedOrders.length,
            "шт",
          );

          setSnackbar({
            open: true,
            message: "Заявки обновлены в реальном времени",
            severity: "info",
          });
        } else if (typeof data === "object") {
          // Если данные пришли как объект, а не массив
          console.log("📊 Данные пришли как объект:", data);

          // Пробуем найти массив заявок внутри объекта
          const ordersArray = data.orders || data.data || Object.values(data);
          if (Array.isArray(ordersArray)) {
            const updatedOrders: Order[] = ordersArray.map((item: any) => ({
              id: item.id || item.orderId || `order-${Date.now()}`,
              type: item.type || "Ремонт",
              device: item.device || item.equipment || "",
              description: item.description || item.problem || "",
              priority: item.priority || "Средний",
              status: item.status || "Создана",
              user: item.user || item.responsible || "",
              date: item.date || item.createdDate || new Date().toISOString(),
              startDate: item.startDate || null,
              endDate: item.endDate || null,
              originalData: item,
            }));

            setOrders(updatedOrders);
            console.log(
              "✅ Заявки обновлены из объекта:",
              updatedOrders.length,
              "шт",
            );
          }
        }
      } catch (err) {
        console.error("❌ Ошибка обработки обновления заявок:", err);
        console.error("📊 Данные вызвавшие ошибку:", data);
      }
    };

    // Подключаем WebSocket
    connectWebSocket();

    // Очистка при размонтировании
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, "Компонент размонтирован");
      }
    };
  }, []);

  // Первоначальная загрузка данных
  useEffect(() => {
    fetchOrders();
  }, []);

  // Функции для определения цвета
  const getStatusColor = (status: string) => {
    const cleanStatus = status || "";
    switch (cleanStatus) {
      case "Создана":
        return "default";
      case "В работе":
        return "primary";
      case "Закрыта":
        return "success";
      default:
        return "default";
    }
  };

  const getTypeColor = (type: string) => {
    const cleanType = type || "";
    switch (cleanType?.toLowerCase()) {
      case "обслуживание":
        return "info";
      case "замена":
        return "warning";
      case "ремонт":
        return "error";
      case "настройка":
        return "secondary";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    if (!priority) return "default";

    const priorityLower = priority.toLowerCase();

    if (priorityLower.includes("низк")) return "success";
    if (priorityLower.includes("сред")) return "warning";
    if (priorityLower.includes("высок")) return "error";
    if (priorityLower.includes("крит")) return "error";

    return "default";
  };

  // Получение иконки для типа заявки
  const getTypeIcon = (type: string) => {
    const cleanType = type?.toLowerCase() || "";
    switch (cleanType) {
      case "ремонт":
        return <Handyman />;
      case "обслуживание":
        return <Build />;
      case "настройка":
        return <Settings />;
      case "замена":
        return <LocalHospital />;
      default:
        return <Build />;
    }
  };

  // Обработчики назначения заявки
  const handleOpenAssignModal = (order: Order) => {
    setOrderToAssign(order);
    setAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setAssignModalOpen(false);
    setOrderToAssign(null);
  };

  const handleAssignOrder = async (
    orderId: string | number,
    userName: string,
  ) => {
    try {
      console.log(
        "🔄 Назначение заявки:",
        orderId,
        "на исполнителя:",
        userName,
      );

      // Используем requestsApi.assignOrder
      await requestsApi.assignOrder(orderId, "", userName);

      // Обновляем локальный статус заявки
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: "В работе",
                user: userName,
                startDate: new Date().toISOString(),
              }
            : order,
        ),
      );

      // Показываем уведомление
      setSnackbar({
        open: true,
        message: `Заявка назначена на ${userName}`,
        severity: "success",
      });
    } catch (err) {
      console.error("Ошибка обновления статуса:", err);
      setSnackbar({
        open: true,
        message: "Ошибка назначения заявки",
        severity: "error",
      });
    }
  };

  // Обработчики просмотра деталей заявки
  const handleOpenViewModal = (order: Order) => {
    setSelectedOrder(order);
    setViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setSelectedOrder(null);
  };

  // Форматирование даты
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Форматирование даты с временем
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "—";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Фильтрация заявок
  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      order.id?.toString().toLowerCase().includes(searchLower) ||
      order.description?.toLowerCase().includes(searchLower) ||
      order.device?.toLowerCase().includes(searchLower) ||
      order.type?.toLowerCase().includes(searchLower) ||
      order.priority?.toLowerCase().includes(searchLower) ||
      order.user?.toLowerCase().includes(searchLower);

    const matchesStatus =
      statusFilter === "all" ||
      order.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Пагинация с использованием внешнего компонента
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Обработчики для внешнего компонента пагинации
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(1); // Сбрасываем на первую страницу при изменении количества строк
  };

  // Статистика
  const stats = {
    total: orders.length,
    created: orders.filter((o) => o.status === "Создана").length,
    inProgress: orders.filter((o) => o.status === "В работе").length,
    completed: orders.filter((o) => o.status === "Закрыта").length,
  };

  const handleStatusUpdate = async (
    orderId: string | number,
    newStatus: string,
  ) => {
    try {
      // Обновляем локальный статус заявки
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                ...(newStatus === "Закрыта" && {
                  endDate: new Date().toISOString(),
                }),
              }
            : order,
        ),
      );

      setSnackbar({
        open: true,
        message: "Статус обновлен",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Ошибка обновления статуса",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Обработчики модального окна создания заявки
  const handleOpenModal = () => {
    setFormData({
      id: nextOrderId,
      type: "Ремонт",
      device: "",
      description: "",
      priority: "",
      status: "Создана",
      date: new Date().toISOString().split("T")[0],
      user: "",
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setFormErrors({});
  };

  const handleFormChange =
    (field: keyof NewOrderFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
      const value = "target" in event ? event.target.value : event;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: "" }));
      }
    };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.type.trim()) errors.type = "Тип обязателен";
    if (!formData.device.trim()) errors.device = "Устройство обязательно";
    if (!formData.priority.trim()) errors.priority = "Приоритет обязателен";
    if (!formData.description.trim())
      errors.description = "Описание обязательно";
    if (!formData.user.trim()) errors.user = "Ответственный обязателен";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateOrder = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      console.log("🆕 Создание новой заявки:", formData);

      // Подготавливаем данные для отправки
      const orderData = {
        type: formData.type,
        device: formData.device,
        priority: formData.priority,
        description: formData.description,
        user: formData.user || "",
      };

      console.log("📤 Отправка данных на сервер:", orderData);

      // Вызываем API для создания заявки
      const response = await requestsApi.createOrder(orderData); // ОБЪЯВЛЕНО ПЕРВЫМ

      console.log("✅ Ответ от сервера при создании:", response); // ТЕПЕРЬ МОЖНО ИСПОЛЬЗОВАТЬ

      // Если сервер вернул созданную заявку
      let createdOrder: Order;
      if (Array.isArray(response) && response.length > 0) {
        createdOrder = {
          id: response[0].id || response[0].orderId || `temp-${Date.now()}`,
          type: response[0].type || formData.type,
          device: response[0].device || formData.device,
          priority: response[0].priority || formData.priority,
          description: response[0].description || formData.description,
          status: response[0].status || "Создана",
          user: response[0].user || response[0].nUser || formData.user || "",
          date: new Date().toISOString(),
          startDate: response[0].startDate || null,
          endDate: response[0].endDate || null,
          originalData: response[0],
        };
      } else if (response && typeof response === "object") {
        createdOrder = {
          id: response.id || response.orderId || `temp-${Date.now()}`,
          type: response.type || formData.type,
          device: response.device || formData.device,
          priority: response.priority || formData.priority,
          description: response.description || formData.description,
          status: response.status || "Создана",
          user: response.user || response.nUser || formData.user || "",
          date: new Date().toISOString(),
          startDate: response.startDate || null,
          endDate: response.endDate || null,
          originalData: response,
        };
      } else {
        // Если сервер не вернул данные, создаем временную запись
        createdOrder = {
          id: `temp-${Date.now()}`,
          type: formData.type,
          device: formData.device,
          priority: formData.priority,
          description: formData.description,
          status: "Создана",
          user: formData.user || "",
          date: new Date().toISOString(),
          startDate: null,
          endDate: null,
        };
      }

      // Добавляем заявку в локальное состояние
      setOrders((prev) => [createdOrder, ...prev]);

      setSnackbar({
        open: true,
        message: "Заявка успешно создана",
        severity: "success",
      });
      handleCloseModal();
    } catch (err: any) {
      console.error("❌ Ошибка создания заявки:", err);

      let errorMessage = "Ошибка создания заявки";
      if (err.response?.data) {
        errorMessage = `Ошибка сервера: ${JSON.stringify(err.response.data)}`;
      } else if (err.message) {
        errorMessage = err.message;
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

  if (loading && orders.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Заголовок и статистика */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              <Assignment sx={{ verticalAlign: "middle", mr: 1 }} />
              Заявки на обслуживание
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="body1" color="text.secondary">
                Всего заявок: {stats.total} | Создано: {stats.created} | В
                работе: {stats.inProgress} | Завершено: {stats.completed}
              </Typography>
              {wsConnected ? (
                <Chip
                  icon={<CheckCircle />}
                  label="Реальное время"
                  color="success"
                  size="small"
                  variant="outlined"
                />
              ) : (
                <Chip
                  icon={<Warning />}
                  label="WS отключен"
                  color="warning"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchOrders}
              disabled={loading}
            >
              Обновить
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenModal}
            >
              Новая заявка
            </Button>
          </Box>
        </Box>

        {/* Фильтры и поиск */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Поиск по ID, описанию, оборудованию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Статус"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Все статусы</MenuItem>
              <MenuItem value="Создана">Создана</MenuItem>
              <MenuItem value="В работе">В работе</MenuItem>
              <MenuItem value="Закрыта">Закрыта</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Карточки статистики */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Всего заявок
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="default">
                {stats.created}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Создано
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="primary">
                {stats.inProgress}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                В работе
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="success">
                {stats.completed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Завершено
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Таблица заявок */}
      <Paper sx={{ overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Номер</TableCell>
                <TableCell>Дата</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Оборудование</TableCell>
                <TableCell>Описание</TableCell>
                <TableCell>Приоритет</TableCell>
                <TableCell>Ответственный</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {searchTerm || statusFilter !== "all"
                        ? "Заявки не найдены по заданным фильтрам"
                        : "Нет заявок"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace" }}
                      >
                        {order.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {order.date ? formatDateTime(order.date) : "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.type || "—"}
                        size="small"
                        color={getTypeColor(order.type || "") as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{order.device || "—"}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {order.description || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.priority || "—"}
                        size="small"
                        color={getPriorityColor(order.priority || "") as any}
                        variant="outlined"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          ...(getPriorityColor(order.priority || "") ===
                            "success" && {
                            backgroundColor: "#e8f5e9",
                            color: "#2e7d32",
                            borderColor: "#2e7d32",
                          }),
                          ...(getPriorityColor(order.priority || "") ===
                            "warning" && {
                            backgroundColor: "#fff3e0",
                            color: "#ef6c00",
                            borderColor: "#ef6c00",
                          }),
                          ...(getPriorityColor(order.priority || "") ===
                            "error" && {
                            backgroundColor: "#ffebee",
                            color: "#d32f2f",
                            borderColor: "#d32f2f",
                          }),
                        }}
                      />
                    </TableCell>
                    <TableCell>{order.user || "—"}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status || "Создана"}
                        color={getStatusColor(order.status || "Создана") as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          variant="outlined"
                          onClick={() => handleOpenViewModal(order)}
                        >
                          Подробно
                        </Button>
                        {order.status === "Создана" && (
                          <Button
                            size="small"
                            startIcon={<PlayArrow />}
                            color="primary"
                            variant="contained"
                            onClick={() => handleOpenAssignModal(order)}
                          >
                            В работу
                          </Button>
                        )}
                        {order.status === "В работе" && (
                          <Button
                            size="small"
                            startIcon={<Check />}
                            color="success"
                            variant="contained"
                            onClick={() =>
                              handleStatusUpdate(order.id, "Закрыта")
                            }
                          >
                            Закрыть
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Внешний компонент пагинации */}
        {filteredOrders.length > 0 && (
          <ReportPagination
            page={page}
            rowsPerPage={rowsPerPage}
            totalRows={filteredOrders.length}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            disabled={loading}
          />
        )}
      </Paper>

      {/* Информация о последнем обновлении */}
      <Box
        sx={{
          mt: 2,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Последнее обновление: {new Date().toLocaleTimeString("ru-RU")}
        </Typography>
      </Box>

      {/* Модальное окно создания новой заявки */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Создание новой заявки
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              {/* ID - только для чтения */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="ID заявки"
                  value={formData.id}
                  margin="normal"
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText="Автоматически сгенерирован"
                />
              </Grid>

              {/* Тип заявки */}
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Тип заявки"
                  value={formData.type}
                  onChange={handleFormChange("type")}
                  margin="normal"
                  required
                  disabled={submitting}
                >
                  <MenuItem value="Замена">Замена</MenuItem>
                  <MenuItem value="Ремонт">Ремонт</MenuItem>
                  <MenuItem value="Настройка">Настройка</MenuItem>
                  <MenuItem value="Обслуживание">Обслуживание</MenuItem>
                </TextField>
              </Grid>

              {/* Оборудование */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Оборудование *"
                  value={formData.device}
                  onChange={handleFormChange("device")}
                  margin="normal"
                  required
                  error={!!formErrors.device}
                  helperText={formErrors.device || "Наименование оборудования"}
                  disabled={submitting}
                />
              </Grid>

              {/* Приоритет */}
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Приоритет *"
                  value={formData.priority}
                  onChange={handleFormChange("priority")}
                  margin="normal"
                  required
                  disabled={submitting}
                >
                  <MenuItem value="Низкий">Низкий</MenuItem>
                  <MenuItem value="Средний">Средний</MenuItem>
                  <MenuItem value="Высокий">Высокий</MenuItem>
                  <MenuItem value="Критический">Критический</MenuItem>
                </TextField>
              </Grid>

              {/* Описание */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Описание проблемы *"
                  value={formData.description}
                  onChange={handleFormChange("description")}
                  margin="normal"
                  multiline
                  rows={4}
                  required
                  error={!!formErrors.description}
                  helperText={
                    formErrors.description ||
                    "Подробное описание проблемы или задачи"
                  }
                  disabled={submitting}
                />
              </Grid>

              {/* Дата */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Дата"
                  type="date"
                  value={formData.date}
                  onChange={handleFormChange("date")}
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  disabled={submitting}
                />
              </Grid>

              {/* Статус - только для чтения */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Статус"
                  value={formData.status}
                  margin="normal"
                  InputProps={{
                    readOnly: true,
                  }}
                  disabled={submitting}
                  helperText="Устанавливается автоматически"
                />
              </Grid>

              {/* Ответственный */}
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Ответственный *"
                  value={formData.user}
                  onChange={handleFormChange("user")}
                  margin="normal"
                  required
                  disabled={submitting}
                >
                  <MenuItem value="Васильев М.С.">Васильев М.С.</MenuItem>
                  <MenuItem value="Смирнов А.П.">Смирнов А.П.</MenuItem>
                  <MenuItem value="Иванов П.К.">Иванов П.К.</MenuItem>
                  <MenuItem value="Попов Д.В.">Попов Д.В.</MenuItem>
                  <MenuItem value="Сидоров И.И.">Сидоров И.И.</MenuItem>
                  <MenuItem value="Махмудов И.К.">Махмудов И.К.</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleCloseModal}
            disabled={submitting}
            variant="outlined"
          >
            Отмена
          </Button>
          <Button
            onClick={handleCreateOrder}
            disabled={submitting}
            variant="contained"
            color="primary"
          >
            {submitting ? "Создание..." : "Создать заявку"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Модальное окно просмотра деталей заявки */}
      <Dialog
        open={viewModalOpen}
        onClose={handleCloseViewModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: "80vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "primary.main",
            color: "white",
            py: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            <Visibility sx={{ verticalAlign: "middle", mr: 1 }} />
            Просмотр заявки #{selectedOrder?.id}
          </Typography>
          <IconButton
            onClick={handleCloseViewModal}
            sx={{ color: "white" }}
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {selectedOrder && (
            <Stack spacing={3}>
              {/* Заголовок с типом */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 48,
                    height: 48,
                    borderRadius: 1,
                    backgroundColor: `${getTypeColor(
                      selectedOrder.type || "",
                    )}.light`,
                    color: `${getTypeColor(selectedOrder.type || "")}.main`,
                  }}
                >
                  {getTypeIcon(selectedOrder.type || "")}
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedOrder.type || "Не указан"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Тип заявки
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Основная информация */}
              <Grid container spacing={2}>
                {/* Оборудование */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Оборудование:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedOrder.device || "Не указано"}
                  </Typography>
                </Grid>

                {/* Описание */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Описание:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      p: 2,
                      backgroundColor: "grey.50",
                      borderRadius: 1,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedOrder.description || "Нет описания"}
                  </Typography>
                </Grid>

                {/* Статус и приоритет */}
                <Grid item xs={6}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Статус:
                  </Typography>
                  <Chip
                    label={selectedOrder.status || "Создана"}
                    color={getStatusColor(selectedOrder.status || "") as any}
                    size="medium"
                    sx={{ fontWeight: 600 }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Приоритет:
                  </Typography>
                  <Chip
                    label={selectedOrder.priority || "Средний"}
                    color={
                      getPriorityColor(selectedOrder.priority || "") as any
                    }
                    size="medium"
                    sx={{ fontWeight: 600 }}
                  />
                </Grid>

                {/* Даты */}
                <Grid item xs={6}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Дата создания:
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedOrder.date)}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Дата обновления:
                  </Typography>
                  <Typography variant="body1">
                    {selectedOrder.startDate
                      ? formatDate(selectedOrder.startDate)
                      : "—"}
                  </Typography>
                </Grid>

                {/* Ответственный */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Инженер:
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 2,
                      backgroundColor: "grey.50",
                      borderRadius: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        backgroundColor: "primary.main",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "bold",
                      }}
                    >
                      {selectedOrder.user?.[0] || "?"}
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {selectedOrder.user || "Не назначен"}
                    </Typography>
                  </Box>
                </Grid>

                {/* Дополнительные поля */}
                {selectedOrder.originalData && (
                  <Grid item xs={12}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Дополнительная информация:
                    </Typography>
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: "grey.50",
                        borderRadius: 1,
                        fontFamily: "monospace",
                        fontSize: "0.875rem",
                      }}
                    >
                      <pre style={{ margin: 0 }}>
                        {JSON.stringify(selectedOrder.originalData, null, 2)}
                      </pre>
                    </Box>
                  </Grid>
                )}
              </Grid>

              <Divider />

              {/* Действия */}
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button onClick={handleCloseViewModal} variant="outlined">
                  Закрыть
                </Button>
                {selectedOrder.status === "Создана" && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrow />}
                    onClick={() => {
                      handleCloseViewModal();
                      handleOpenAssignModal(selectedOrder);
                    }}
                  >
                    Взять в работу
                  </Button>
                )}
                {selectedOrder.status === "В работе" && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Check />}
                    onClick={() => {
                      handleCloseViewModal();
                      handleStatusUpdate(selectedOrder.id, "Закрыта");
                    }}
                  >
                    Закрыть
                  </Button>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <AssignOrderModal
        isOpen={assignModalOpen}
        onClose={handleCloseAssignModal}
        order={orderToAssign}
        onAssign={handleAssignOrder}
      />

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

export default RequestsPage;
