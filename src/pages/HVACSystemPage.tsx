// pages/HVACSystemPage.tsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fab,
  Switch,
  FormControlLabel,
  Tab,
  Tabs,
  Snackbar,
  CardHeader,
  Tooltip,
  // Удален импорт Pagination, FirstPage, LastPage, ChevronLeft, ChevronRight
} from "@mui/material";
import {
  AcUnit,
  Schema,
  Build,
  Schedule,
  Refresh,
  ShowChart,
  Settings,
  TrendingUp,
  TrendingDown,
  ArrowUpward,
  ArrowDownward,
  CheckCircle,
  Warning as WarningIcon,
  Error as ErrorIcon,
  History,
  Whatshot,
  InvertColors,
  Toys,
  ElectricBolt,
  Sensors,
  Assignment,
  Visibility,
} from "@mui/icons-material";

import { apiClient } from "../api/client";
// Импортируем внешний компонент пагинации
import { ReportPagination } from "../components/reports/Pagination";

// Типы данных
interface TemperatureDataPoint {
  timestamp: string;
  temperature: number;
  node: string;
}

interface Device {
  id: string;
  name: string;
  type: string;
  status: "normal" | "warning" | "critical";
  value: string;
  temperature?: number;
  group?: string;
  deviceId?: string;
  deviceName?: string;
  location?: string;
  timestamp?: string;
  description?: string;
  param?: string;
  active?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface HTFResponseItem {
  vUpdateTime: string;
  vValue: Array<{
    [key: string]: string | number;
    volumeDate: string;
    id: string;
  }>;
}

interface TblValuesItem {
  param?: string;
  name?: string;
  id?: string;
  value?: string | number;
  data?: string | number;
  val?: string | number;
  timestamp?: string;
  time?: string;
  created_at?: string;
  unit?: string;
  [key: string]: any;
}

interface HTFDataPoint {
  timestamp: string;
  value: number;
  param: string;
}

interface MaintenanceTask {
  id: string;
  task: string;
  taskDate: string;
  action: string;
  type: string;
  device: string;
  user: string;
  realDate: string | null;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Константы
const TARGET_WS = process.env.REACT_APP_TARGET_WS;
const path = process.env.REACT_APP_CURRENTVALUES;
const FUNCTIONS = process.env.REACT_APP_FUNCTIONS;

// Оптимизированный компонент графика
const TemperatureChart: React.FC<{
  data: TemperatureDataPoint[];
  title: string;
  color?: string;
  unit?: string;
  isLoading?: boolean;
}> = React.memo(
  ({ data, title, color = "#1976d2", unit = "°C", isLoading = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stats, setStats] = useState({
      min: 0,
      max: 0,
      current: 0,
      avg: 0,
      trend: 0,
    });

    const drawChart = useCallback(() => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (data.length === 0) {
        ctx.fillStyle = "#999";
        ctx.font = "14px Inter";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "Нет данных для отображения",
          canvas.width / 2,
          canvas.height / 2
        );
        return;
      }

      const temps = data.map((d) => d.temperature);
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);
      const currentTemp = data[data.length - 1]?.temperature || 0;
      const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
      const trend = data.length > 1 ? currentTemp - data[0].temperature : 0;

      setStats({
        min: minTemp,
        max: maxTemp,
        current: currentTemp,
        avg: avgTemp,
        trend,
      });

      const padding = { top: 40, right: 30, bottom: 50, left: 60 };
      const chartWidth = canvas.width - padding.left - padding.right;
      const chartHeight = canvas.height - padding.top - padding.bottom;
      const tempRange = maxTemp - minTemp || 1;

      // Сетка
      ctx.strokeStyle = "#e0e0e0";
      ctx.lineWidth = 1;

      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (i * chartHeight) / 5;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
      }

      // График
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      data.forEach((point, index) => {
        const x =
          padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
        const y =
          padding.top +
          chartHeight -
          ((point.temperature - minTemp) / tempRange) * chartHeight;

        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();

      // Точки
      ctx.fillStyle = color;
      if (data.length <= 20) {
        data.forEach((point, index) => {
          const x =
            padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
          const y =
            padding.top +
            chartHeight -
            ((point.temperature - minTemp) / tempRange) * chartHeight;

          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Последняя точка
      if (data.length > 0) {
        const lastIndex = data.length - 1;
        const x = padding.left + chartWidth;
        const y =
          padding.top +
          chartHeight -
          ((data[lastIndex].temperature - minTemp) / tempRange) * chartHeight;

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ff4444";
        ctx.fill();

        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Подписи
      ctx.fillStyle = "#333";
      ctx.font = "bold 14px Inter";
      ctx.textAlign = "center";
      ctx.fillText(title, canvas.width / 2, padding.top - 15);

      ctx.font = "12px Inter";
      ctx.textAlign = "right";
      ctx.fillStyle = "#666";
      ctx.fillText(
        `${maxTemp.toFixed(1)}${unit}`,
        padding.left - 10,
        padding.top + 5
      );
      ctx.fillText(
        `${minTemp.toFixed(1)}${unit}`,
        padding.left - 10,
        padding.top + chartHeight
      );
    }, [data, title, color, unit]);

    useEffect(() => {
      drawChart();
      const handleResize = () => drawChart();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [drawChart]);

    return (
      <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#f9f9f9",
            borderRadius: "4px",
          }}
        />

        {isLoading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}

        <Box
          sx={{
            position: "absolute",
            bottom: 10,
            left: 10,
            display: "flex",
            gap: 1,
          }}
        >
          <Chip
            size="small"
            icon={<ArrowDownward />}
            label={`${stats.min.toFixed(1)}${unit}`}
            variant="outlined"
            sx={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          />
          <Chip
            size="small"
            icon={stats.trend > 0 ? <TrendingUp /> : <TrendingDown />}
            label={`${stats.current.toFixed(1)}${unit}`}
            color={
              stats.trend > 0
                ? "success"
                : stats.trend < 0
                ? "error"
                : "default"
            }
            sx={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          />
          <Chip
            size="small"
            icon={<ArrowUpward />}
            label={`${stats.max.toFixed(1)}${unit}`}
            variant="outlined"
            sx={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          />
        </Box>
      </Box>
    );
  }
);

export const HVACSystemPage: React.FC = () => {
  // ========== СОСТОЯНИЯ ==========
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState<boolean>(true);
  
  // ========== ПАГИНАЦИЯ ДЛЯ ВСЕХ ТАБОВ ==========
  // 1. Пагинация для схемы (3x3)
  const [schemePage, setSchemePage] = useState<number>(1);
  const [schemeRowsPerPage] = useState<number>(9); // 3x3 сетка
  
  // 2. Пагинация для оборудования
  const [equipmentPage, setEquipmentPage] = useState<number>(1);
  const [equipmentRowsPerPage, setEquipmentRowsPerPage] = useState<number>(10);
  
  // 3. Пагинация для расписания обслуживания
  const [tasksPage, setTasksPage] = useState<number>(1);
  const [tasksRowsPerPage, setTasksRowsPerPage] = useState<number>(10);

  const [temperatureData, setTemperatureData] = useState<TemperatureDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedNode, setSelectedNode] = useState<string>("");
  const [pollingActive, setPollingActive] = useState<boolean>(true);
  const [devices, setDevices] = useState<Device[]>([]);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [equipmentData, setEquipmentData] = useState<Device[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState<boolean>(true);
  const [equipmentTotalCount, setEquipmentTotalCount] = useState<number>(0);
  const [allTasks, setAllTasks] = useState<MaintenanceTask[]>([]);

  const lastFetchRef = useRef<Record<string, number>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "info" | "warning" | "error",
  });

  // ========== WEB SOCKET ==========
  useEffect(() => {
    if (!TARGET_WS) {
      console.warn("WebSocket URL не настроен");
      return;
    }

    const ws = new WebSocket(TARGET_WS);
    console.log("🔗 Подключение к WebSocket прокси:", TARGET_WS);

    ws.onopen = () => {
      console.log("✅ WebSocket подключен к прокси");
      setWsConnected(true);
      
      const subscribeMsg = {
        type: "SUBSCRIBE",
        path: path
      };
      
      ws.send(JSON.stringify(subscribeMsg));
      console.log("📡 Подписка отправлена на:", path);
      
      setSnackbar({
        open: true,
        message: "Реальное время подключено",
        severity: "success",
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📥 WS сообщение:", data.type);

        if (data.type === "UPDATE") {
          console.log("🔄 Обновление данных через WS прокси");
          handleWebSocketData(data.value);
        } else if (data.type === "ERROR") {
          console.error("❌ WebSocket ошибка:", data.error);
        }
      } catch (error) {
        console.error("❌ Ошибка обработки WS сообщения:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket ошибка:", error);
      setWsConnected(false);
      setSnackbar({
        open: true,
        message: "Ошибка подключения WebSocket",
        severity: "error",
      });
    };

    ws.onclose = () => {
      console.log("🔌 WebSocket отключен");
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
      case "Норма":
        return "success";
      case "warning":
      case "Внимание":
        return "warning";
      case "critical":
      case "Критично":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "normal":
      case "Норма":
        return <CheckCircle fontSize="small" />;
      case "warning":
      case "Внимание":
        return <WarningIcon fontSize="small" />;
      case "critical":
      case "Критично":
        return <ErrorIcon fontSize="small" />;
      default:
        return <CheckCircle fontSize="small" />;
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "boiler":
        return <Whatshot />;
      case "pump":
        return <InvertColors />;
      case "ventilation":
      case "vent":
        return <Toys />;
      case "shield":
        return <ElectricBolt />;
      case "sensor":
        return <Sensors />;
      default:
        return <Sensors />;
    }
  };
  
  const fetchMaintenanceTasks = useCallback(async () => {
    try {
      setTasksLoading(true);
      
      const response = await apiClient.get<MaintenanceTask[]>('tblTasks');
      
      if (response && Array.isArray(response)) {
        const hvacTasks = response.filter(task => {
          const taskType = (task.type || '').toLowerCase();
          const taskDevice = (task.device || '').toLowerCase();
          
          return taskType.includes('насос') || 
                 taskType.includes('теплов') ||
                 taskType.includes('вентиля') ||
                 taskType.includes('котел') ||
                 taskType.includes('бойлер') ||
                 taskDevice.includes('насос') ||
                 taskDevice.includes('теплов') ||
                 taskDevice.includes('вентиля');
        });
        
        setAllTasks(hvacTasks);
        setMaintenanceTasks(hvacTasks);
      } else {
        setAllTasks([]);
        setMaintenanceTasks([]);
      }
    } catch (err: any) {
      console.error("Ошибка загрузки задач обслуживания:", err);
      setSnackbar({
        open: true,
        message: "Ошибка загрузки данных обслуживания",
        severity: "error",
      });
      setAllTasks([]);
      setMaintenanceTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  const getTaskStatusInfo = (action: string) => {
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('выполнено') || actionLower.includes('завершено')) {
      return { label: 'Выполнено', color: 'success' as const };
    } else if (actionLower.includes('запланировано') || actionLower.includes('план')) {
      return { label: 'Запланировано', color: 'info' as const };
    } else if (actionLower.includes('задерж') || actionLower.includes('отложен')) {
      return { label: 'Задержка', color: 'warning' as const };
    } else if (actionLower.includes('отмен') || actionLower.includes('отклонен')) {
      return { label: 'Отменено', color: 'error' as const };
    } else if (actionLower.includes('в работе') || actionLower.includes('выполняется')) {
      return { label: 'В работе', color: 'primary' as const };
    } else {
      return { label: action, color: 'default' as const };
    }
  };

  const mapDeviceType = (deviceType: string): string => {
    if (!deviceType) return "sensor";

    const typeLower = deviceType.toLowerCase();

    if (
      typeLower.includes("бойлер") ||
      typeLower.includes("boiler") ||
      typeLower.includes("котел") ||
      typeLower.includes("теплов")
    ) {
      return "boiler";
    }
    if (
      typeLower.includes("насос") ||
      typeLower.includes("pump") ||
      typeLower.includes("клапан")
    ) {
      return "pump";
    }
    if (
      typeLower.includes("вентиля") ||
      typeLower.includes("vent") ||
      typeLower.includes("fan") ||
      typeLower.includes("air")
    ) {
      return "ventilation";
    }
    if (
      typeLower.includes("щит") ||
      typeLower.includes("shield") ||
      typeLower.includes("control") ||
      typeLower.includes("панель") ||
      typeLower.includes("сервер") ||
      typeLower.includes("контроллер")
    ) {
      return "shield";
    }
    if (
      typeLower.includes("датчик") ||
      typeLower.includes("sensor") ||
      typeLower.includes("сенсор") ||
      typeLower.includes("считыватель") ||
      typeLower.includes("камера") ||
      typeLower.includes("регистратор")
    ) {
      return "sensor";
    }
    if (typeLower.includes("тепловой узел") || typeLower.includes("тепловой")) {
      return "boiler";
    }

    return "sensor";
  };

  // ========== ОБРАБОТКА WEB SOCKET ==========
  const handleWebSocketData = (data: any) => {
    if (!data || !Array.isArray(data) || data.length === 0) return;

    console.log("📥 Данные от WS:", data);

    data.forEach((item: any) => {
      if (item.vValue && Array.isArray(item.vValue) && item.vValue.length > 0) {
        const values = item.vValue[0];
        
        Object.keys(values).forEach((paramKey: string) => {
          if (paramKey !== "volumeDate" && paramKey !== "id" && values[paramKey] !== null) {
            const device = devices.find(d => d.param === paramKey);
            if (device) {
              const valueStr = String(values[paramKey]).replace(',', '.');
              const numericValue = parseFloat(valueStr);
              
              let unit = 'ед.';
              if (paramKey.startsWith('t') || paramKey.startsWith('tu')) {
                unit = '°C';
              } else if (paramKey.startsWith('p')) {
                unit = 'bar';
              }
              
              const newValue = `${numericValue.toFixed(2)}${unit}`;
              
              setDevices(prev => prev.map(d => 
                d.param === paramKey ? { 
                  ...d, 
                  value: newValue, 
                  temperature: unit === '°C' ? numericValue : undefined 
                } : d
              ));
              
              setEquipmentData(prev => prev.map(d => 
                d.param === paramKey ? { 
                  ...d, 
                  value: newValue, 
                  temperature: unit === '°C' ? numericValue : undefined 
                } : d
              ));
              
              if (selectedNode === device.id) {
                const newDataPoint: TemperatureDataPoint = {
                  timestamp: item.vUpdateTime || new Date().toISOString(),
                  temperature: numericValue,
                  node: selectedNode,
                };

                setTemperatureData(prev => {
                  const newData = [...prev, newDataPoint];
                  return newData.slice(-50);
                });

                setLastUpdate(new Date().toLocaleTimeString("ru-RU"));
              }
            }
          }
        });
      }
    });
  };

  const getFunctionsBaseUrl = useCallback((): string => {
    if (!FUNCTIONS) {
      console.error('❌ FUNCTIONS не определен в env');
      return '';
    }
    
    let base = FUNCTIONS;
    if (!base.endsWith('/')) {
      base = base + '/';
    }
    
    return base;
  }, []);

  const fetchFromGetDevicesHTF = useCallback(async (deviceParam: string): Promise<HTFDataPoint[]> => {
    try {
      console.log('🧪 fetchFromGetDevicesHTF для параметра:', deviceParam);
      
      const functionsBase = getFunctionsBaseUrl();
      if (!functionsBase) {
        console.error('❌ FUNCTIONS base URL не настроен');
        return [];
      }
      
      const prefix = deviceParam.replace(/\d+/g, '');
      console.log(`🎯 Префикс параметра: ${prefix} (из ${deviceParam})`);
      
      const requestData = [{ param: prefix }];
      
      console.log('📤 Отправляем запрос с данными:', JSON.stringify(requestData));
      
      const response = await apiClient.post<any[]>(
        'getDevicesHTF',
        requestData,
        { 
          baseURL: functionsBase,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('📥 Ответ:', {
        тип: Array.isArray(response) ? 'массив' : typeof response,
        длина: Array.isArray(response) ? response.length : 'N/A',
        первые_2_элемента: Array.isArray(response) ? response.slice(0, 2) : 'не массив'
      });
      
      if (response && Array.isArray(response) && response.length > 0) {
        const historicalData: HTFDataPoint[] = [];
        
        response.forEach((item: any, index: number) => {
          if (item.vValue && Array.isArray(item.vValue) && item.vValue.length > 0) {
            const values = item.vValue[0];
            
            if (values[deviceParam] !== undefined && values[deviceParam] !== null) {
              const valueStr = String(values[deviceParam]).replace(',', '.');
              const value = parseFloat(valueStr);
              
              if (!isNaN(value)) {
                historicalData.push({
                  timestamp: item.vUpdateTime,
                  value: value,
                  param: deviceParam
                });
                
                if (historicalData.length <= 2) {
                  console.log(`📊 Точка ${historicalData.length}:`, {
                    время: item.vUpdateTime.substring(11, 19),
                    параметр: deviceParam,
                    значение: value,
                    исходное: values[deviceParam]
                  });
                }
              } else {
                console.warn(`⚠️ Некорректное значение для ${deviceParam}:`, values[deviceParam]);
              }
            } else if (index === 0) {
              const availableParams = Object.keys(values).filter(k => 
                !['volumeDate', 'id'].includes(k) && k.startsWith(prefix)
              );
              console.log(`🔍 ${deviceParam} не найден. Доступные параметры с префиксом ${prefix}:`, availableParams);
            }
          }
        });
        
        console.log(`📈 Итого найдено ${historicalData.length} точек для ${deviceParam}`);
        
        if (historicalData.length === 0) {
          const firstItem = response[0];
          if (firstItem.vValue && Array.isArray(firstItem.vValue) && firstItem.vValue[0]) {
            const allParams = Object.keys(firstItem.vValue[0]).filter(k => !['volumeDate', 'id'].includes(k));
            console.log(`📋 Все параметры в данных:`, allParams);
          }
        }
        
        return historicalData;
      }
      
      console.warn('⚠️ getDevicesHTF вернул пустой массив или некорректные данные');
      return [];
      
    } catch (error: any) {
      console.error('❌ Ошибка getDevicesHTF:', {
        message: error.message,
        status: error.response?.status
      });
      return [];
    }
  }, [getFunctionsBaseUrl]);

  const updateChartData = useCallback(async () => {
    if (!selectedNode) {
      console.log('⚠️ Не выбрано устройство для графика');
      return;
    }
    
    const device = devices.find((d) => d.id === selectedNode);
    if (!device || !device.param) {
      console.log('⚠️ Устройство не найдено или нет параметра');
      return;
    }
    
    const deviceParam = device.param;
    console.log(`🔄 Обновление графика для: ${device.name} (${deviceParam})`);
    
    try {
      setRefreshing(true);
      
      const historicalData = await fetchFromGetDevicesHTF(deviceParam);
      
      if (historicalData.length === 0) {
        console.error('❌ Нет исторических данных для отображения');
        setSnackbar({
          open: true,
          message: `Нет данных для ${device.name}`,
          severity: 'warning'
        });
        return;
      }
      
      const chartData: TemperatureDataPoint[] = historicalData.map(item => ({
        timestamp: item.timestamp,
        temperature: item.value,
        node: deviceParam
      }));
      
      chartData.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      setTemperatureData(chartData);
      console.log(`✅ График обновлен: ${chartData.length} точек`);
      
      const latestValue = chartData[chartData.length - 1].temperature;
      const latestTimestamp = chartData[chartData.length - 1].timestamp;
      
      let unit = 'ед.';
      if (deviceParam.startsWith('tu') || deviceParam.startsWith('t')) {
        unit = '°C';
      } else if (deviceParam.startsWith('p')) {
        unit = 'bar';
      } else if (deviceParam.startsWith('fw') || deviceParam.startsWith('fa')) {
        unit = 'м³/ч';
      }
      
      setDevices(prev => prev.map(d => 
        d.id === selectedNode ? { 
          ...d, 
          value: `${latestValue.toFixed(2)}${unit}`,
          temperature: unit === '°C' ? latestValue : undefined,
          timestamp: latestTimestamp
        } : d
      ));
      
      setLastUpdate(new Date().toLocaleTimeString("ru-RU"));
      
    } catch (error: any) {
      console.error('❌ Ошибка обновления графика:', error.message);
      setSnackbar({
        open: true,
        message: `Ошибка загрузки графика: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setRefreshing(false);
    }
  }, [selectedNode, devices, fetchFromGetDevicesHTF]);

  const fetchDevicesForScheme = useCallback(async () => {
    try {
      setLoading(true);

      const response = await apiClient.get("tblDevices");
      console.log("Устройства с бэка:", response);

      if (response && Array.isArray(response)) {
        const deviceMap = new Map<string, Device>();
        
        let hvacCount = 0;

        response.forEach((device: any, index: number) => {
          const group = (device.group || "").toLowerCase().trim();
          const param = device.param || "";
          
          if (group === "hvac") {
            hvacCount++;
            
            const deviceType = mapDeviceType(
              device.type || device.description || device.name ||
              "Насосное оборудование" || "Тепловой узел" || "Вентияция" || 
              "Датчик температуры" || "Клапан"
            );

            let status: "normal" | "warning" | "critical" = "normal";
            if (device.status === "warning" || device.status === "Внимание") {
              status = "warning";
            } else if (
              device.status === "critical" ||
              device.status === "Критично"
            ) {
              status = "critical";
            }

            const baseKey = param || `device-${index}`;
            let uniqueKey = baseKey;
            let counter = 1;

            while (deviceMap.has(uniqueKey)) {
              uniqueKey = `${baseKey}-${counter}`;
              counter++;
            }

            const deviceObj: Device = {
              id: uniqueKey,
              name: device.name || `Устройство ${uniqueKey}`,
              type: deviceType,
              status: status,
              value: "Н/Д",
              temperature: undefined,
              group: device.group,
              deviceId: param,
              deviceName: device.name,
              location: device.dislocation,
              description: device.description,
              param: param,
              active: device.active,
            };

            deviceMap.set(uniqueKey, deviceObj);
          }
        });

        console.log(`📊 HVAC устройств: ${hvacCount}`);

        const hvacDevices = Array.from(deviceMap.values());
        console.log("HVAC устройства:", hvacDevices);

        if (hvacDevices.length === 0) {
          console.warn("⚠️ Нет HVAC устройств!");
        }

        const deviceParams = hvacDevices.map(d => d.param).filter((p): p is string => !!p);
        
        if (deviceParams.length > 0) {
        const valuesResponse = await apiClient.get<TblValuesItem[]>('tblValues');
        console.log('📊 Загружено значений из tblValues:', valuesResponse?.length || 0);
        
        const updatedDevices = hvacDevices.map(device => {
          if (device.param) {
            const prefix = device.param.replace(/\d+/g, '');
            
            const deviceValue = valuesResponse.find((item: TblValuesItem) => 
              item.param === device.param ||
              (item.param && item.param.startsWith(prefix)) ||
              item.name === device.param ||
              item.id === device.param
            );
            
            if (deviceValue) {
              const valueStr = String(deviceValue.value || deviceValue.data || deviceValue.val || '0');
              const numericValue = parseFloat(valueStr.replace(',', '.'));
              
              if (!isNaN(numericValue)) {
                const getUnitByPrefix = (prefix: string): string => {
                  const unitMap: Record<string, string> = {
                    't': '°C',
                    'tu': '°C',
                    'p': 'bar',
                    'fw': 'м³/ч',
                    'fa': 'м³/ч',
                    'fh': '%',
                    'r': 'об/мин',
                    'sc': '%',
                    'sr': '%',
                    'pw': 'kW',
                    'la': 'дБ',
                  };
                  return unitMap[prefix] || 'ед.';
                };
                
                const unit = getUnitByPrefix(prefix);
                const temperature = ['t', 'tu'].includes(prefix) ? numericValue : undefined;
                
                return {
                  ...device,
                  value: `${numericValue.toFixed(2)}${unit}`,
                  temperature: temperature,
                  timestamp: deviceValue.timestamp || deviceValue.time || deviceValue.created_at || new Date().toISOString()
                };
              }
            }
          }
          return device;
        });
          
          setDevices(updatedDevices);
          
          const tempDevice = updatedDevices.find(
            (d) => d.param && (d.param.startsWith("t") || d.param.startsWith("tu"))
          );
          
          if (tempDevice && !selectedNode) {
            setSelectedNode(tempDevice.id);
            console.log("🎯 Автовыбор устройства с температурой:", tempDevice);
          }
        } else {
          setDevices(hvacDevices);
        }

        setError(null);
      }
    } catch (err: any) {
      console.error("Ошибка загрузки устройств:", err);
      setSnackbar({
        open: true,
        message: `Ошибка загрузки устройств: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedNode]);

  const fetchCurrentValues = useCallback(async () => {
    if (!selectedNode) {
      console.log('⚠️ Не выбрано устройство для графика');
      return;
    }
    
    const now = Date.now();
    const lastFetch = lastFetchRef.current[selectedNode] || 0;
    
    lastFetchRef.current[selectedNode] = now;
    
    try {
      if (refreshing) return;
      setRefreshing(true);
      
      const device = devices.find((d) => d.id === selectedNode);
      if (!device || !device.param) {
        console.log('⚠️ Устройство не найдено или нет параметра');
        return;
      }
      
      const deviceParam = device.param;
      console.log(`🔄 Загрузка данных для: ${device.name} (${deviceParam})`);
      
      let historicalHTFData: HTFDataPoint[] = [];
      
      try {
        historicalHTFData = await fetchFromGetDevicesHTF(deviceParam);
        console.log(`📊 Получено ${historicalHTFData.length} исторических записей из getDevicesHTF`);
        
        if (historicalHTFData.length > 0) {
          console.log('📈 Пример исторических данных:', {
            первая_точка: historicalHTFData[0],
            последняя_точка: historicalHTFData[historicalHTFData.length - 1],
            диапазон_данных: `${historicalHTFData.length} точек`
          });
        }
      } catch (htfError) {
        console.error('❌ Ошибка getDevicesHTF:', htfError);
      }
      
      let currentValue: number = 0;
      let currentTimestamp = '';
      let unit = 'ед.';
      
      try {
        console.log('📊 Загрузка текущих значений из tblValues...');
        const valuesResponse = await apiClient.get<TblValuesItem[]>('tblValues');
        
        console.log('✅ Ответ tblValues:', {
          тип: typeof valuesResponse,
          массив: Array.isArray(valuesResponse),
          длина: Array.isArray(valuesResponse) ? valuesResponse.length : 'не массив'
        });
        
        if (valuesResponse && Array.isArray(valuesResponse)) {
          const deviceValue = valuesResponse.find((item: TblValuesItem) => 
            item.param === deviceParam || item.name === deviceParam || item.id === deviceParam
          );
          
          console.log('🔍 Поиск значения для', deviceParam, 'найдено:', deviceValue);
          
          if (deviceValue) {
            const valueStr = String(deviceValue.value || deviceValue.data || deviceValue.val || '0');
            currentValue = parseFloat(valueStr.replace(',', '.'));
            currentTimestamp = deviceValue.timestamp || 
                              deviceValue.time || 
                              deviceValue.created_at || 
                              new Date().toISOString();
            
            if (deviceParam.startsWith('tu') || deviceParam.startsWith('t')) {
              unit = '°C';
            } else if (deviceParam.startsWith('p')) {
              unit = 'bar';
            } else if (deviceParam.startsWith('fw') || deviceParam.startsWith('fa')) {
              unit = 'м³/ч';
            } else if (deviceValue.unit) {
              unit = deviceValue.unit;
            }
            
            console.log(`✅ Текущее значение из tblValues: ${currentValue}${unit} в ${currentTimestamp}`);
          } else {
            console.warn(`⚠️ Для ${deviceParam} не найдено значение в tblValues`);
            
            if (historicalHTFData.length > 0) {
              currentValue = historicalHTFData[historicalHTFData.length - 1].value;
              currentTimestamp = historicalHTFData[historicalHTFData.length - 1].timestamp;
              console.log(`📊 Используем последнее историческое значение: ${currentValue}${unit}`);
            }
          }
        } else {
          console.warn('⚠️ tblValues не вернул массив данных');
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки tblValues:', error);
      }
      
      const historicalChartData: TemperatureDataPoint[] = historicalHTFData.map((htfPoint: HTFDataPoint) => ({
        timestamp: htfPoint.timestamp,
        temperature: htfPoint.value,
        node: deviceParam
      }));
      
      let finalChartData = [...historicalChartData];
      
      const currentDate = new Date(currentTimestamp);
      const existingIndex = finalChartData.findIndex(point => {
        const pointDate = new Date(point.timestamp);
        return Math.abs(pointDate.getTime() - currentDate.getTime()) < 60000;
      });
      
      if (existingIndex === -1) {
        finalChartData.push({
          timestamp: currentTimestamp,
          temperature: currentValue,
          node: deviceParam
        });
      } else {
        finalChartData[existingIndex] = {
          timestamp: currentTimestamp,
          temperature: currentValue,
          node: deviceParam
        };
      }
      
      finalChartData.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      finalChartData = finalChartData.slice(-50);
      
      console.log(`📊 Финальные данные графика: ${finalChartData.length} точек`);
      
      if (finalChartData.length > 0) {
        console.log('📈 Диапазон времени графика:', {
          первая: finalChartData[0]?.timestamp?.substring(11, 19),
          последняя: finalChartData[finalChartData.length - 1]?.timestamp?.substring(11, 19),
          первая_полная: finalChartData[0]?.timestamp,
          последняя_полная: finalChartData[finalChartData.length - 1]?.timestamp,
          разница_часов: finalChartData.length > 1 
            ? ((new Date(finalChartData[finalChartData.length - 1].timestamp).getTime() - 
               new Date(finalChartData[0].timestamp).getTime()) / 3600000).toFixed(2) + ' ч'
            : 'одна точка'
        });
        
        finalChartData.forEach((point, index) => {
          console.log(`📊 Точка ${index}: ${point.temperature}°C в ${point.timestamp.substring(11, 19)}`);
        });
      }
      
      setTemperatureData(finalChartData);
      console.log(`✅ График обновлен: ${finalChartData.length} точек`);
      
      setDevices(prev => prev.map(d => 
        d.id === selectedNode ? { 
          ...d, 
          value: `${currentValue.toFixed(2)}${unit}`,
          temperature: unit === '°C' ? currentValue : undefined,
          timestamp: currentTimestamp
        } : d
      ));
      
      setLastUpdate(new Date().toLocaleTimeString("ru-RU"));
      
    } catch (err) {
      console.error('❌ Ошибка в fetchCurrentValues:', err);
    } finally {
      setRefreshing(false);
    }
  }, [selectedNode, devices, refreshing, fetchFromGetDevicesHTF]);

  useEffect(() => {
    if (selectedNode) {
      console.log('🎯 Выбрано устройство, загружаем график...');
      updateChartData();
    }
  }, [selectedNode]);

  useEffect(() => {
    if (!selectedNode || !pollingActive) return;
    
    console.log('⏰ Интервальное обновление графика запущено');
    
    const intervalId = setInterval(() => {
      console.log('🔄 Автообновление графика');
      updateChartData();
    }, 30000);
    
    return () => {
      console.log('⏰ Интервальное обновление остановлено');
      clearInterval(intervalId);
    };
  }, [selectedNode, pollingActive, updateChartData]);

  const fetchEquipmentData = useCallback(async () => {
    try {
      setEquipmentLoading(true);

      const response = await apiClient.get("tblDevices");

      if (response && Array.isArray(response)) {
        const hvacEquipment: Device[] = response
          .filter((device: any) => {
            const group = device.group || "";
            return group.toLowerCase() === "hvac";
          })
          .map((device: any): Device => {
            const description = (device.description || "").toLowerCase();
            const name = (device.name || "").toLowerCase();
            const param = device.param || "";

            let deviceType = "sensor";
            if (description.includes("температур") || param.startsWith("t")) {
              deviceType = "sensor";
            } else if (description.includes("насос")) {
              deviceType = "pump";
            } else if (description.includes("вентиля")) {
              deviceType = "ventilation";
            } else if (description.includes("клапан")) {
              deviceType = "pump";
            } else if (description.includes("теплов")) {
              deviceType = "boiler";
            } else if (description.includes("щит")) {
              deviceType = "shield";
            }

            let status: "normal" | "warning" | "critical" = "normal";
            if (device.status === "warning" || device.status === "Внимание") {
              status = "warning";
            } else if (
              device.status === "critical" ||
              device.status === "Критично"
            ) {
              status = "critical";
            }

            const deviceId =
              device.param || device.id || `device-${Math.random()}`;

            return {
              id: deviceId,
              name: device.name || `Устройство ${deviceId}`,
              type: deviceType,
              status: status,
              value: "Н/Д",
              temperature: undefined,
              location: device.dislocation || "Не указано",
              timestamp: device.timestamp || new Date().toISOString(),
              group: device.group || "HVAC",
              deviceId: deviceId,
              deviceName: device.name,
              description: device.description,
              param: device.param,
              active: device.active,
            };
          });

        const startIndex = (equipmentPage - 1) * equipmentRowsPerPage;
        const endIndex = startIndex + equipmentRowsPerPage;
        setEquipmentData(hvacEquipment.slice(startIndex, endIndex));
        setEquipmentTotalCount(hvacEquipment.length);
      } else {
        setEquipmentData([]);
        setEquipmentTotalCount(0);
      }
    } catch (err: any) {
      console.error("Ошибка загрузки оборудования:", err);
      setSnackbar({
        open: true,
        message: "Ошибка загрузки данных оборудования",
        severity: "error",
      });
    } finally {
      setEquipmentLoading(false);
    }
  }, [equipmentPage, equipmentRowsPerPage]);

  // ========== ОБРАБОТЧИКИ ==========
  const handleManualRefresh = () => {
    fetchDevicesForScheme();
    if (selectedNode) fetchCurrentValues();
    fetchEquipmentData();
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  const handleAlarmClick = async () => {
    const device = devices.find((d) => d.id === selectedNode);
    if (!device) return;

    try {
      setSnackbar({
        open: true,
        message: `Сигнал тревоги отправлен для ${device.name}`,
        severity: "success",
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: `Ошибка отправки сигнала тревоги: ${err.message}`,
        severity: "error",
      });
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // ========== ОБРАБОТЧИКИ ПАГИНАЦИИ С ИСПОЛЬЗОВАНИЕМ ВНЕШНЕГО КОМПОНЕНТА ==========
  // 1. Пагинация схемы (3x3)
  const handleSchemePageChange = (newPage: number) => {
    setSchemePage(newPage);
  };

  // 2. Пагинация оборудования
  const handleEquipmentPageChange = (newPage: number) => {
    setEquipmentPage(newPage);
  };

  const handleEquipmentRowsPerPageChange = (newRowsPerPage: number) => {
    setEquipmentRowsPerPage(newRowsPerPage);
    setEquipmentPage(1);
  };

  // 3. Пагинация расписания обслуживания
  const handleTasksPageChange = (newPage: number) => {
    setTasksPage(newPage);
  };

  const handleTasksRowsPerPageChange = (newRowsPerPage: number) => {
    setTasksRowsPerPage(newRowsPerPage);
    setTasksPage(1);
  };

  // ========== ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ ==========
  // 1. Пагинация схемы
  const schemeTotalCount = devices.length;
  const schemeTotalPages = Math.ceil(schemeTotalCount / schemeRowsPerPage);
  const paginatedDevices = useMemo(() => {
    const startIndex = (schemePage - 1) * schemeRowsPerPage;
    const endIndex = startIndex + schemeRowsPerPage;
    return devices.slice(startIndex, endIndex);
  }, [devices, schemePage, schemeRowsPerPage]);

  // 2. Пагинация оборудования
  const paginatedEquipment = useMemo(() => {
    const startIndex = (equipmentPage - 1) * equipmentRowsPerPage;
    const endIndex = startIndex + equipmentRowsPerPage;
    return equipmentData.slice(startIndex, endIndex);
  }, [equipmentData, equipmentPage, equipmentRowsPerPage]);

  // 3. Пагинация расписания
  const paginatedTasks = useMemo(() => {
    const startIndex = (tasksPage - 1) * tasksRowsPerPage;
    const endIndex = startIndex + tasksRowsPerPage;
    return allTasks.slice(startIndex, endIndex);
  }, [allTasks, tasksPage, tasksRowsPerPage]);
  const tasksTotalCount = allTasks.length;

  const selectedDevice = useMemo(() => {
    return devices.find((d) => d.id === selectedNode) || paginatedDevices[0];
  }, [devices, selectedNode, paginatedDevices]);

  // ========== ЭФФЕКТЫ ==========
  useEffect(() => {
    fetchDevicesForScheme();
    fetchEquipmentData();
  }, []);

  useEffect(() => {
    if (!selectedNode) return;

    const fetchData = async () => {
      const now = Date.now();
      if (now - (lastFetchRef.current[selectedNode] || 0) > 5000) {
        lastFetchRef.current[selectedNode] = now;
        await fetchCurrentValues();
      }
    };

    fetchData();
    
    const intervalId = setInterval(fetchData, 10000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [selectedNode, fetchCurrentValues]);

  useEffect(() => {
    fetchMaintenanceTasks();
  }, [fetchMaintenanceTasks]);

  // ========== РЕНДЕР ==========
  return (
    <Box
      sx={{
        p: 3,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      {/* Шапка */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <AcUnit sx={{ fontSize: 40, color: "primary.main" }} />
            <Box>
              <Typography variant="h4">Система ЖКХ</Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                  mt: 1,
                }}
              >
                {wsConnected ? (
                  <Chip
                    icon={<CheckCircle fontSize="small" />}
                    label="WS подключен"
                    color="success"
                    size="small"
                    variant="outlined"
                  />
                ) : (
                  <Chip
                    icon={<WarningIcon fontSize="small" />}
                    label="WS отключен"
                    color="warning"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Режим работы: нормальный • Последнее обновление: {lastUpdate}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={pollingActive}
                  onChange={(e) => setPollingActive(e.target.checked)}
                  size="small"
                />
              }
              label="Автообновление"
              labelPlacement="start"
              sx={{ m: 0 }}
            />

            <Tooltip title="Обновить все данные">
              <IconButton
                onClick={handleManualRefresh}
                disabled={refreshing || loading}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Табы */}
      <Paper>
        <Tabs value={currentTab} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<Schema />} iconPosition="start" label="Мнемосхема" />
          <Tab icon={<Build />} iconPosition="start" label="Оборудование" />
          <Tab
            icon={<Schedule />}
            iconPosition="start"
            label="Расписание обслуживания"
          />
        </Tabs>
      </Paper>

      {/* Контент табов */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        {/* Вкладка Мнемосхема */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3} sx={{ height: "100%", minHeight: "600px" }}>
            {/* Левая колонка: Схема */}
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  height: "100%",
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Схема системы ЖКХ
                  </Typography>
                  {selectedNode && (
                    <Fab
                      color="error"
                      size="small"
                      onClick={handleAlarmClick}
                      sx={{ boxShadow: 2 }}
                    >
                      <WarningIcon />
                    </Fab>
                  )}
                </Box>

                {/* Схема 3x3 с пагинацией */}
                <Box
                  sx={{
                    flex: 1,
                    position: "relative",
                    bgcolor: "#f8f9fa",
                    borderRadius: 2,
                    overflow: "auto",
                    mb: 3,
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {loading ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                      }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : devices.length === 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                        gap: 2,
                      }}
                    >
                      <Typography variant="body1" color="text.secondary">
                        Нет устройств для отображения
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={handleManualRefresh}
                      >
                        Обновить
                      </Button>
                    </Box>
                  ) : (
                    <>
                      {/* Сетка 3x3 */}
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: 2,
                          flex: 1,
                          mb: 2,
                        }}
                      >
                        {paginatedDevices.map((device) => (
                          <Card
                            key={device.id}
                            onClick={() => handleNodeClick(device.id)}
                            sx={{
                              cursor: "pointer",
                              transition: "all 0.3s",
                              border:
                                selectedNode === device.id
                                  ? "2px solid #1976d2"
                                  : "1px solid #e0e0e0",
                              backgroundColor:
                                selectedNode === device.id
                                  ? "primary.50"
                                  : "white",
                              position: "relative",
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: 4,
                              },
                              minHeight: "120px",
                            }}
                          >
                            <CardContent
                              sx={{
                                p: 2,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                              }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: `${getStatusColor(
                                    device.status
                                  )}.light`,
                                  color: `${getStatusColor(
                                    device.status
                                  )}.dark`,
                                  mb: 1,
                                  width: 40,
                                  height: 40,
                                }}
                              >
                                {getNodeIcon(device.type)}
                              </Avatar>
                              <Typography
                                variant="caption"
                                fontWeight="bold"
                                align="center"
                                noWrap
                              >
                                {device.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                align="center"
                              >
                                {device.param || device.id}
                              </Typography>
                              <Chip
                                size="small"
                                label={
                                  device.status === "normal"
                                    ? "Норма"
                                    : device.status === "warning"
                                    ? "Внимание"
                                    : "Критично"
                                }
                                color={getStatusColor(device.status)}
                                sx={{ mt: 1 }}
                              />
                            </CardContent>
                          </Card>
                        ))}
                      </Box>

                      {/* Пагинация схемы */}
                      {schemeTotalCount > schemeRowsPerPage && (
                        <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #e0e0e0' }}>
                          <ReportPagination
                            page={schemePage}
                            rowsPerPage={schemeRowsPerPage}
                            totalRows={schemeTotalCount}
                            onPageChange={handleSchemePageChange}
                            onRowsPerPageChange={() => {}} // Для схемы фиксированное количество строк
                            disabled={loading}
                          />
                        </Box>
                      )}
                    </>
                  )}
                </Box>

                {/* Информация о выбранном устройстве */}
                {selectedDevice && (
                  <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Выбранное устройство:
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: `${getStatusColor(selectedDevice.status)}.light`,
                          color: `${getStatusColor(selectedDevice.status)}.dark`,
                        }}
                      >
                        {getNodeIcon(selectedDevice.type)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedDevice.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {selectedDevice.param || selectedDevice.id}
                        </Typography>
                        {selectedDevice.value && (
                          <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                            Текущее значение: {selectedDevice.value}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                )}
              </Paper>
            </Grid>

            {/* Правая колонка: График и информация */}
            <Grid item xs={12} md={6}>
              <Grid container spacing={3} sx={{ height: "100%" }}>
                {/* График */}
                <Grid item xs={12}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <CardHeader
                      title={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <ShowChart color="primary" />
                          <Typography variant="h6">
                            {selectedDevice?.name || "Температура"} - Мониторинг
                          </Typography>
                          {refreshing && <CircularProgress size={20} />}
                        </Box>
                      }
                      subheader={
                        <Box>
                          <Typography variant="caption">
                            Обновлено: {lastUpdate}
                          </Typography>
                          {temperatureData.length > 0 && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                              Точек: {temperatureData.length} • 
                              От {temperatureData[0]?.timestamp?.substring(11, 19)} до {temperatureData[temperatureData.length - 1]?.timestamp?.substring(11, 19)}
                            </Typography>
                          )}
                        </Box>
                      }
                      action={
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Проверить данные устройства">
                            <IconButton
                              onClick={async () => {
                                const device = devices.find(d => d.id === selectedNode);
                                if (device?.param) {
                                  console.log(`🧪 Тест устройства: ${device.name} (${device.param})`);
                                  
                                  const prefix = device.param.replace(/\d+/g, '');
                                  console.log(`🎯 Префикс: ${prefix}`);
                                  
                                  const data = await fetchFromGetDevicesHTF(device.param);
                                  
                                  if (data.length > 0) {
                                    console.log(`✅ Найдено ${data.length} точек`);
                                    console.log('📊 Первые 3 точки:', data.slice(0, 3));
                                  } else {
                                    console.log(`❌ Нет данных для ${device.param}`);
                                    
                                    setSnackbar({
                                      open: true,
                                      message: `Нет исторических данных для ${device.name}`,
                                      severity: 'warning'
                                    });
                                  }
                                }
                              }}
                              size="small"
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Отладка данных">
                            <IconButton
                              onClick={async () => {
                                const device = devices.find((d) => d.id === selectedNode);
                                if (device?.param) {
                                  console.log('🔍 Отладка данных для:', device.param);
                                  await fetchFromGetDevicesHTF(device.param);
                                }
                              }}
                              size="small"
                            >
                              <Build />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Обновить данные">
                            <IconButton
                              onClick={updateChartData}
                              disabled={refreshing || !selectedNode}
                              size="small"
                            >
                              <Refresh />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    />
                    <CardContent sx={{ flex: 1, p: 2 }}>
                      <Box sx={{ height: "250px", width: "100%" }}>
                        <TemperatureChart
                          data={temperatureData}
                          title={`Оборудование - ${
                            selectedDevice?.name || "Устройство"
                          }`}
                          color="#1976d2"
                          unit="°C"
                          isLoading={refreshing}
                        />
                      </Box>

                      <Box
                        sx={{
                          mt: 2,
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Точек: {temperatureData.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {temperatureData.length > 0 &&
                            `Диапазон: ${Math.min(
                              ...temperatureData.map((d) => d.temperature)
                            ).toFixed(1)}°C - ${Math.max(
                              ...temperatureData.map((d) => d.temperature)
                            ).toFixed(1)}°C`}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Детальная информация */}
                <Grid item xs={12}>
                  <Card sx={{ height: "100%" }}>
                    <CardHeader
                      title={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Settings color="primary" />
                          <Typography variant="h6">
                            Информация об устройстве
                          </Typography>
                        </Box>
                      }
                    />
                    <CardContent>
                      {selectedDevice ? (
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              mb: 3,
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: `${getStatusColor(
                                  selectedDevice.status
                                )}.light`,
                                color: `${getStatusColor(
                                  selectedDevice.status
                                )}.main`,
                                width: 60,
                                height: 60,
                              }}
                            >
                              {getNodeIcon(selectedDevice.type)}
                            </Avatar>
                            <Box>
                              <Typography variant="h6">
                                {selectedDevice.name}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  mt: 1,
                                }}
                              >
                                <Chip
                                  label={
                                    selectedDevice.status === "normal"
                                      ? "Норма"
                                      : selectedDevice.status === "warning"
                                      ? "Внимание"
                                      : "Критично"
                                  }
                                  color={getStatusColor(selectedDevice.status)}
                                  size="small"
                                />
                                <Chip
                                  label={selectedDevice.type}
                                  variant="outlined"
                                  size="small"
                                />
                              </Box>
                            </Box>
                          </Box>

                          {/* Текущее значение */}
                          {temperatureData.length > 0 && (
                            <Paper
                              sx={{
                                p: 2,
                                mb: 2,
                                bgcolor: "primary.light",
                                color: "primary.contrastText",
                              }}
                            >
                              <Typography variant="subtitle2">
                                Текущее значение параметра
                              </Typography>
                              <Typography
                                variant="h4"
                                sx={{ fontWeight: "bold" }}
                              >
                                {temperatureData[
                                  temperatureData.length - 1
                                ]?.temperature.toFixed(1)}
                                °C
                              </Typography>
                            </Paper>
                          )}

                          {/* Дополнительная информация */}
                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                ID устройства
                              </Typography>
                              <Typography variant="body2">
                                {selectedDevice.id}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Группа
                              </Typography>
                              <Typography variant="body2">
                                {selectedDevice.group || "Не указано"}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Местоположение
                              </Typography>
                              <Typography variant="body2">
                                {selectedDevice.location || "Не указано"}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Последнее обновление
                              </Typography>
                              <Typography variant="body2">
                                {selectedDevice.timestamp
                                  ? new Date(
                                      selectedDevice.timestamp
                                    ).toLocaleString("ru-RU")
                                  : "Нет данных"}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              justifyContent: "center",
                            }}
                          >
                            <Button
                              size="small"
                              startIcon={<History />}
                              variant="outlined"
                              onClick={() => {
                                setSnackbar({
                                  open: true,
                                  message: `Открыта история для ${selectedDevice.name}`,
                                  severity: "info",
                                });
                              }}
                            >
                              История
                            </Button>
                            <Button
                              size="small"
                              startIcon={<Assignment />}
                              variant="outlined"
                              onClick={() => {
                                setSnackbar({
                                  open: true,
                                  message: `Создана заявка для ${selectedDevice.name}`,
                                  severity: "info",
                                });
                              }}
                            >
                              Заявка
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            p: 3,
                          }}
                        >
                          <Typography
                            variant="h6"
                            color="text.secondary"
                            gutterBottom
                          >
                            Выберите устройство на схеме
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            align="center"
                          >
                            Нажмите на любой элемент схеме для просмотра
                            подробной информации
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Вкладка Оборудование */}
        <TabPanel value={currentTab} index={1}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h5">
                Оборудование системы ЖКХ
                {equipmentLoading && (
                  <CircularProgress size={20} sx={{ ml: 2 }} />
                )}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={fetchEquipmentData}
                  disabled={equipmentLoading}
                >
                  Обновить
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Номер</TableCell>
                    <TableCell>Наименование</TableCell>
                    <TableCell>Тип</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Параметр</TableCell>
                    <TableCell>Группа</TableCell>
                    <TableCell>Местоположение</TableCell>
                    <TableCell>Последнее обновление</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedEquipment.length > 0 ? (
                    paginatedEquipment.map((device) => (
                      <TableRow
                        key={device.id}
                        hover
                        sx={{
                          cursor: "pointer",
                          "&:hover": { backgroundColor: "action.hover" },
                        }}
                        onClick={() => {
                          setSelectedNode(device.id);
                          setCurrentTab(0);
                        }}
                      >
                        <TableCell>
                          <Chip
                            label={device.id}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={device.name}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {device.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(device.status)}
                            label={
                              device.status === "normal"
                                ? "Норма"
                                : device.status === "warning"
                                ? "Внимание"
                                : "Критично"
                            }
                            color={getStatusColor(device.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={device.id}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{device.group || "Не указана"}</TableCell>
                        <TableCell>{device.location || "Не указано"}</TableCell>
                        <TableCell>
                          {device.timestamp ? (
                            <Typography variant="caption">
                              {new Date(device.timestamp).toLocaleString(
                                "ru-RU"
                              )}
                            </Typography>
                          ) : (
                            "Н/Д"
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        {equipmentLoading ? (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 2,
                            }}
                          >
                            <CircularProgress size={24} />
                            <Typography>
                              Загрузка данных оборудования...
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body1" color="text.secondary">
                            Нет данных оборудования
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Пагинация оборудования */}
            {equipmentTotalCount > 0 && (
              <ReportPagination
                page={equipmentPage}
                rowsPerPage={equipmentRowsPerPage}
                totalRows={equipmentTotalCount}
                onPageChange={handleEquipmentPageChange}
                onRowsPerPageChange={handleEquipmentRowsPerPageChange}
                disabled={equipmentLoading}
              />
            )}
          </Paper>
        </TabPanel>

        {/* Вкладка Расписание обслуживания */}
        <TabPanel value={currentTab} index={2}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h5">
                Расписание обслуживания
                {tasksLoading && (
                  <CircularProgress size={20} sx={{ ml: 2 }} />
                )}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={fetchMaintenanceTasks}
                  disabled={tasksLoading}
                >
                  Обновить
                </Button>
              </Box>
            </Box>

            {allTasks.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  py: 6,
                  textAlign: "center",
                }}
              >
                {tasksLoading ? (
                  <>
                    <CircularProgress size={40} sx={{ mb: 2 }} />
                    <Typography>Загрузка данных обслуживания...</Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Нет задач обслуживания
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Задачи обслуживания для HVAC оборудования не найдены
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={fetchMaintenanceTasks}
                      sx={{ mt: 2 }}
                    >
                      Попробовать снова
                    </Button>
                  </>
                )}
              </Box>
            ) : (
              <>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Оборудование</TableCell>
                        <TableCell>Тип оборудования</TableCell>
                        <TableCell>Тип работы</TableCell>
                        <TableCell>Планируемая дата</TableCell>
                        <TableCell>Статус</TableCell>
                        <TableCell>Ответственный</TableCell>
                        <TableCell>Факт. дата</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedTasks.map((task) => {
                        const statusInfo = getTaskStatusInfo(task.action);
                        const plannedDate = new Date(task.taskDate);
                        const isOverdue = task.realDate === null && plannedDate < new Date();
                        
                        const relatedDevice = devices.find(d => 
                          d.name?.toLowerCase().includes(task.device.toLowerCase()) ||
                          task.device.toLowerCase().includes(d.name?.toLowerCase() || '')
                        );
                        
                        return (
                          <TableRow 
                            key={task.id} 
                            hover
                            sx={{
                              cursor: "pointer",
                              backgroundColor: isOverdue ? '#fff8e1' : 'inherit',
                              '&:hover': { backgroundColor: isOverdue ? '#fff5d6' : 'action.hover' },
                            }}
                          >
                            <TableCell>
                              <Chip
                                label={`#${task.id}`}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                {relatedDevice && (
                                  <Avatar
                                    sx={{
                                      width: 32,
                                      height: 32,
                                      bgcolor: `${getStatusColor(relatedDevice.status)}.light`,
                                    }}
                                  >
                                    {getNodeIcon(relatedDevice.type)}
                                  </Avatar>
                                )}
                                <Typography variant="body1">
                                  {task.device}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={task.type}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>{task.task}</TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2">
                                  {plannedDate.toLocaleDateString("ru-RU")}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {plannedDate.toLocaleTimeString("ru-RU", {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Typography>
                                {isOverdue && (
                                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                                    Просрочено
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={statusInfo.label}
                                color={statusInfo.color}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{task.user}</TableCell>
                            <TableCell>
                              {task.realDate ? (
                                <Typography variant="body2">
                                  {new Date(task.realDate).toLocaleDateString("ru-RU")}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                  Не выполнено
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Пагинация расписания обслуживания */}
                <ReportPagination
                  page={tasksPage}
                  rowsPerPage={tasksRowsPerPage}
                  totalRows={tasksTotalCount}
                  onPageChange={handleTasksPageChange}
                  onRowsPerPageChange={handleTasksRowsPerPageChange}
                  disabled={tasksLoading}
                />

                {/* Статистика */}
                <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {tasksTotalCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Всего задач
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main">
                          {allTasks.filter(t => t.action.toLowerCase().includes('выполнено')).length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Выполнено
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="info.main">
                          {allTasks.filter(t => t.action.toLowerCase().includes('запланировано')).length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Запланировано
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="warning.main">
                          {allTasks.filter(t => 
                            t.realDate === null && new Date(t.taskDate) < new Date()
                          ).length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Просрочено
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </>
            )}
          </Paper>
        </TabPanel>
      </Box>

      {/* Снекбар */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};