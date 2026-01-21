// pages/CCTVSystemPage.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  Pagination,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import {
  Videocam,
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
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Warning as WarningIcon,
  Error as ErrorIcon,
  History,
  Camera,
  Storage,
  Computer,
  Lan,
  Router,
  Build as BuildIcon,
} from "@mui/icons-material";
import { apiClient } from "../api/client";
import { ReportPagination } from "../components/reports/Pagination";

// Интерфейсы данных
interface CCTVDevice {
  id: string;
  name: string;
  type: string;
  status: "normal" | "warning" | "critical";
  value: string;
  group?: string;
  deviceId?: string;
  deviceName?: string;
  location?: string;
  timestamp?: string;
  description?: string;
  param?: string;
  active?: boolean;
  ipAddress?: string;
  resolution?: string;
  fps?: number;
  storageUsage?: number;
  isOnline?: boolean;
}

interface ActivityDataPoint {
  timestamp: string;
  value: number;
  type: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Интерфейс для задач обслуживания CCTV
interface CCTVMaintenanceTask {
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

// Компонент графика активности
const ActivityChart: React.FC<{
  data: ActivityDataPoint[];
  title: string;
  color?: string;
  unit?: string;
  isLoading?: boolean;
}> = React.memo(({
  data,
  title,
  color = "#1976d2",
  unit = "",
  isLoading = false,
}) => {
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
      ctx.fillText("Нет данных для отображения", canvas.width / 2, canvas.height / 2);
      return;
    }

    const values = data.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const currentVal = data[data.length - 1]?.value || 0;
    const avgVal = values.reduce((a, b) => a + b, 0) / values.length;
    const trend = data.length > 1 ? currentVal - data[0].value : 0;
    
    setStats({ min: minVal, max: maxVal, current: currentVal, avg: avgVal, trend });

    const padding = { top: 40, right: 30, bottom: 50, left: 60 };
    const chartWidth = canvas.width - padding.left - padding.right;
    const chartHeight = canvas.height - padding.top - padding.bottom;
    const valueRange = maxVal - minVal || 1;

    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i * chartHeight) / 5;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    data.forEach((point, index) => {
      const x = padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.value - minVal) / valueRange) * chartHeight;

      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    ctx.fillStyle = color;
    if (data.length <= 20) {
      data.forEach((point, index) => {
        const x = padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
        const y = padding.top + chartHeight - ((point.value - minVal) / valueRange) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (data.length > 0) {
      const lastIndex = data.length - 1;
      const x = padding.left + chartWidth;
      const y = padding.top + chartHeight - ((data[lastIndex].value - minVal) / valueRange) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#ff4444";
      ctx.fill();
      
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = "#333";
    ctx.font = "bold 14px Inter";
    ctx.textAlign = "center";
    ctx.fillText(title, canvas.width / 2, padding.top - 15);
    
    ctx.font = "12px Inter";
    ctx.textAlign = "right";
    ctx.fillStyle = "#666";
    ctx.fillText(`${maxVal.toFixed(0)}${unit}`, padding.left - 10, padding.top + 5);
    ctx.fillText(`${minVal.toFixed(0)}${unit}`, padding.left - 10, padding.top + chartHeight);

  }, [data, title, color, unit]);

  useEffect(() => {
    drawChart();
    const handleResize = () => drawChart();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
        <Box sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
        }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      <Box sx={{ 
        position: "absolute", 
        bottom: 10, 
        left: 10, 
        display: "flex", 
        gap: 1 
      }}>
        <Chip 
          size="small"
          icon={<ArrowDownward />}
          label={`${stats.min.toFixed(0)}${unit}`}
          variant="outlined"
          sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
        />
        <Chip 
          size="small"
          icon={stats.trend > 0 ? <TrendingUp /> : <TrendingDown />}
          label={`${stats.current.toFixed(0)}${unit}`}
          color={stats.trend > 0 ? "success" : stats.trend < 0 ? "error" : "default"}
          sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
        />
        <Chip 
          size="small"
          icon={<ArrowUpward />}
          label={`${stats.max.toFixed(0)}${unit}`}
          variant="outlined"
          sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
        />
      </Box>
    </Box>
  );
});

export const CCTVSystemPage: React.FC = () => {
  // ========== СОСТОЯНИЯ ==========
  const [activityData, setActivityData] = useState<ActivityDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedNode, setSelectedNode] = useState<string>("");
  const [pollingActive, setPollingActive] = useState<boolean>(true);
  const [selectedEquipmentType, setSelectedEquipmentType] = useState("all");

  const [devices, setDevices] = useState<CCTVDevice[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<CCTVDevice[]>([]);
  const [schemePage, setSchemePage] = useState<number>(1);
  const [schemeItemsPerPage] = useState<number>(9);
  const [equipmentPage, setEquipmentPage] = useState<number>(1);
  const [equipmentRowsPerPage, setEquipmentRowsPerPage] = useState<number>(10);
  const [equipmentTotalCount, setEquipmentTotalCount] = useState<number>(0);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // Состояния для задач обслуживания CCTV
  const [maintenanceTasks, setMaintenanceTasks] = useState<CCTVMaintenanceTask[]>([]);
  const [allTasks, setAllTasks] = useState<CCTVMaintenanceTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState<boolean>(true);
  const [tasksPage, setTasksPage] = useState<number>(1);
  const [tasksRowsPerPage, setTasksRowsPerPage] = useState<number>(10);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "info" | "warning" | "error",
  });

  // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "normal": case "норма": case "активен": return "success";
      case "warning": case "внимание": case "предупреждение": return "warning";
      case "critical": case "критично": case "ошибка": return "error";
      default: return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "normal": case "норма": case "активен": return <CheckCircle fontSize="small" />;
      case "warning": case "внимание": case "предупреждение": return <WarningIcon fontSize="small" />;
      case "critical": case "критично": case "ошибка": return <ErrorIcon fontSize="small" />;
      default: return <CheckCircle fontSize="small" />;
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "camera": case "камера": return <Camera />;
      case "recorder": case "регистратор": return <Storage />;
      case "server": case "сервер": return <Computer />;
      case "switch": case "коммутатор": return <Lan />;
      case "nvr": case "nvr-регистратор": return <Router />;
      default: return <Videocam />;
    }
  };

  const formatDeviceValue = (device: CCTVDevice): string => {
    if (device.type === "camera") {
      return `${device.resolution || "?"} @ ${device.fps || "?"}fps`;
    }
    if (device.storageUsage !== undefined) {
      return `${device.storageUsage}% использовано`;
    }
    return device.value || "Нет данных";
  };

  const mapDeviceType = (deviceType: string): string => {
    if (!deviceType) return "camera";

    const typeLower = deviceType.toLowerCase();

    if (typeLower.includes("камера") || typeLower.includes("camera") || typeLower.includes("cam")) {
      return "camera";
    }
    if (typeLower.includes("регистратор") || typeLower.includes("recorder") || typeLower.includes("nvr") || typeLower.includes("dvr")) {
      return "recorder";
    }
    if (typeLower.includes("сервер") || typeLower.includes("server") || typeLower.includes("sr")) {
      return "server";
    }
    if (typeLower.includes("коммутатор") || typeLower.includes("switch") || typeLower.includes("sw")) {
      return "switch";
    }
    return "camera";
  };

  // ========== ФУНКЦИИ ДЛЯ ОБСЛУЖИВАНИЯ ==========
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

  const fetchMaintenanceTasks = useCallback(async () => {
    try {
      setTasksLoading(true);
      
      // Загружаем задачи с бэка
      const response = await apiClient.get<CCTVMaintenanceTask[]>('tblTasks');
      
      if (response && Array.isArray(response)) {
        // Фильтруем задачи, связанные с CCTV оборудованием
        const cctvTasks = response.filter(task => {
          // Проверяем по типу оборудования
          const taskType = (task.type || '').toLowerCase();
          const taskDevice = (task.device || '').toLowerCase();
          
          return taskType.includes('камера') || 
                 taskType.includes('видео') ||
                 taskType.includes('регистратор') ||
                 taskType.includes('сервер') ||
                 taskType.includes('nvr') ||
                 taskType.includes('dvr') ||
                 taskDevice.includes('камера') ||
                 taskDevice.includes('видео') ||
                 taskDevice.includes('cctv') ||
                 taskDevice.includes('регистратор') ||
                 taskDevice.includes('nvr') ||
                 taskDevice.includes('dvr');
        });
        
        setAllTasks(cctvTasks);
        setMaintenanceTasks(cctvTasks);
      } else {
        setAllTasks([]);
        setMaintenanceTasks([]);
      }
    } catch (err: any) {
      console.error("Ошибка загрузки задач обслуживания CCTV:", err);
      setSnackbar({
        open: true,
        message: "Ошибка загрузки данных обслуживания CCTV",
        severity: "error",
      });
      setAllTasks([]);
      setMaintenanceTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  // ========== ЗАГРУЗКА ДАННЫХ ==========
  const filterCCTVDevices = useCallback((deviceData: any[]): CCTVDevice[] => {
    return deviceData
      .filter((device: any) => {
        const group = (device.group || "").toLowerCase().trim();
        const description = (device.description || "").toLowerCase();
        const name = (device.name || "").toLowerCase();
        const param = device.param || "";
        
        return group === "video" || 
               group === "cctv" ||
               description.includes("камера") ||
               description.includes("видео") ||
               name.includes("камера") ||
               name.includes("cctv") ||
               param.startsWith("cam") ||
               param.startsWith("nvr") ||
               param.startsWith("dvr");
      })
      .map((device: any, index: number): CCTVDevice => {
        const deviceType = mapDeviceType(device.type || device.description || device.name || "camera");

        let status: "normal" | "warning" | "critical" = "normal";
        if (device.status === "warning" || device.status === "Внимание") {
          status = "warning";
        } else if (device.status === "critical" || device.status === "Критично") {
          status = "critical";
        }

        const deviceId = device.param || device.id || `cctv-device-${index}`;

        return {
          id: deviceId,
          name: device.name || `Устройство ${deviceId}`,
          type: deviceType,
          status: status,
          value: "Н/Д",
          group: device.group,
          deviceId: deviceId,
          deviceName: device.name,
          location: device.dislocation || "Не указано",
          timestamp: device.timestamp || new Date().toISOString(),
          description: device.description,
          param: device.param,
          active: device.active,
          ipAddress: undefined,
          resolution: "1080p",
          fps: 30,
          storageUsage: undefined,
          isOnline: device.active !== false,
        };
      });
  }, []);

  const fetchCCTVDevices = useCallback(async () => {
    try {
      setLoading(true);

      const response = await apiClient.get("tblDevices");

      console.log("Устройства CCTV с бэка:", response);

      if (response && Array.isArray(response)) {
        const cctvDevices = filterCCTVDevices(response);
        console.log(`📊 Найдено ${cctvDevices.length} устройств CCTV`);

        // Загружаем значения из tblValues
        try {
          const valuesResponse = await apiClient.get<any[]>('tblValues');
          if (valuesResponse && Array.isArray(valuesResponse)) {
            const updatedDevices = cctvDevices.map(device => {
              if (device.param) {
                const deviceValue = valuesResponse.find((item: any) => 
                  item.param === device.param ||
                  item.name === device.param ||
                  item.id === device.param
                );
                
                if (deviceValue) {
                  const valueStr = String(deviceValue.value || deviceValue.data || deviceValue.val || '0');
                  const numericValue = parseFloat(valueStr.replace(',', '.'));
                  
                  if (!isNaN(numericValue)) {
                    const getUnitByParam = (param: string): string => {
                      if (param.startsWith('cam')) return 'fps';
                      if (param.startsWith('nvr') || param.startsWith('dvr')) return '%';
                      if (param.startsWith('sr')) return '%';
                      return 'ед.';
                    };
                    
                    const unit = getUnitByParam(device.param);
                    const fps = device.param.startsWith('cam') ? numericValue : undefined;
                    const storageUsage = (device.param.startsWith('nvr') || device.param.startsWith('dvr') || device.param.startsWith('sr')) ? numericValue : undefined;
                    
                    return {
                      ...device,
                      value: `${numericValue.toFixed(2)}${unit}`,
                      fps: fps,
                      storageUsage: storageUsage,
                    };
                  }
                }
              }
              return device;
            });
            
            setDevices(updatedDevices);
            setFilteredDevices(updatedDevices);
            setEquipmentTotalCount(updatedDevices.length);
            
            if (updatedDevices.length > 0 && !selectedNode) {
              setSelectedNode(updatedDevices[0].id);
            }
          } else {
            setDevices(cctvDevices);
            setFilteredDevices(cctvDevices);
            setEquipmentTotalCount(cctvDevices.length);
          }
        } catch (error) {
          console.warn('⚠️ Ошибка загрузки значений:', error);
          setDevices(cctvDevices);
          setFilteredDevices(cctvDevices);
          setEquipmentTotalCount(cctvDevices.length);
        }

        setError(null);
      }
    } catch (err: any) {
      console.error("Ошибка загрузки устройств CCTV:", err);
      setSnackbar({
        open: true,
        message: `Ошибка загрузки устройств CCTV: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedNode, filterCCTVDevices]);

  const generateActivityData = useCallback(() => {
    const now = Date.now();
    const activityPoints: ActivityDataPoint[] = [];
    
    for (let i = 0; i < 24; i++) {
      const hoursAgo = 23 - i;
      const timestamp = new Date(now - hoursAgo * 3600000).toISOString();
      
      const hourOfDay = new Date(timestamp).getHours();
      let activityValue = 0;
      
      if (hourOfDay >= 8 && hourOfDay <= 10) {
        activityValue = 80 + Math.random() * 40;
      } else if (hourOfDay >= 13 && hourOfDay <= 15) {
        activityValue = 60 + Math.random() * 30;
      } else if (hourOfDay >= 17 && hourOfDay <= 19) {
        activityValue = 90 + Math.random() * 50;
      } else if (hourOfDay >= 20 || hourOfDay <= 6) {
        activityValue = 5 + Math.random() * 15;
      } else {
        activityValue = 30 + Math.random() * 30;
      }
      
      activityPoints.push({
        timestamp,
        value: Math.round(activityValue),
        type: "activity"
      });
    }
    
    setActivityData(activityPoints);
  }, []);

  // ========== WEB SOCKET ==========
  useEffect(() => {
    if (!TARGET_WS) {
      console.warn("WebSocket URL не настроен");
      return;
    }

    const ws = new WebSocket(TARGET_WS);
    console.log("🔗 Подключение к WebSocket для CCTV:", TARGET_WS);

    ws.onopen = () => {
      console.log("✅ WebSocket подключен для CCTV");
      setWsConnected(true);
      
      const subscribeMsg = {
        type: "SUBSCRIBE",
        path: "tblDevices"
      };
      
      ws.send(JSON.stringify(subscribeMsg));
      console.log("📡 Подписка отправлена");
      
      setSnackbar({
        open: true,
        message: "Реальное время подключено для CCTV",
        severity: "success",
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📥 WS сообщение для CCTV:", data.type);

        if (data.type === "UPDATE") {
          console.log("🔄 Обновление данных CCTV через WS");
          if (data.value && Array.isArray(data.value)) {
            const cctvDevices = filterCCTVDevices(data.value);
            setDevices(prev => {
              const deviceMap = new Map<string, CCTVDevice>();
              prev.forEach(device => deviceMap.set(device.id, device));
              cctvDevices.forEach(newDevice => deviceMap.set(newDevice.id, newDevice));
              return Array.from(deviceMap.values());
            });
            setLastUpdate(new Date().toLocaleTimeString("ru-RU"));
          }
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
  }, [filterCCTVDevices]);

  // ========== ОБРАБОТЧИКИ ==========
  const handleManualRefresh = () => {
    fetchCCTVDevices();
    generateActivityData();
    fetchMaintenanceTasks();
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  const handleAlarmClick = async () => {
    const device = devices.find((d) => d.id === selectedNode);
    if (!device) return;

    setSnackbar({
      open: true,
      message: `Сигнал тревоги отправлен для ${device.name}`,
      severity: "success",
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleSchemePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setSchemePage(page);
  };

  const handleEquipmentPageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setEquipmentPage(page);
  };

  const handleEquipmentRowsPerPageChange = (event: SelectChangeEvent<number>) => {
    setEquipmentRowsPerPage(Number(event.target.value));
    setEquipmentPage(1);
  };

  const handleEquipmentTypeChange = (event: SelectChangeEvent) => {
    const type = event.target.value;
    setSelectedEquipmentType(type);
    
    if (type === "all") {
      setFilteredDevices(devices);
    } else {
      const filtered = devices.filter(device => 
        device.type.toLowerCase() === type.toLowerCase()
      );
      setFilteredDevices(filtered);
    }
    setEquipmentTotalCount(filteredDevices.length);
    setSchemePage(1);
    setEquipmentPage(1);
  };

  // ========== ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ ==========
  const paginatedDevices = useMemo(() => {
    const startIndex = (schemePage - 1) * schemeItemsPerPage;
    const endIndex = startIndex + schemeItemsPerPage;
    return filteredDevices.slice(startIndex, endIndex);
  }, [filteredDevices, schemePage, schemeItemsPerPage]);

  const totalPages = Math.ceil(filteredDevices.length / schemeItemsPerPage);

  const selectedDevice = useMemo(() => {
    return devices.find((d) => d.id === selectedNode) || filteredDevices[0];
  }, [devices, selectedNode, filteredDevices]);

  const equipmentPageDevices = useMemo(() => {
    const startIndex = (equipmentPage - 1) * equipmentRowsPerPage;
    const endIndex = startIndex + equipmentRowsPerPage;
    return filteredDevices.slice(startIndex, endIndex);
  }, [filteredDevices, equipmentPage, equipmentRowsPerPage]);

  // Вычисляемые значения для пагинации задач
  const paginatedTasks = useMemo(() => {
    const startIndex = (tasksPage - 1) * tasksRowsPerPage;
    const endIndex = startIndex + tasksRowsPerPage;
    return allTasks.slice(startIndex, endIndex);
  }, [allTasks, tasksPage, tasksRowsPerPage]);

  const tasksTotalCount = allTasks.length;
  const tasksTotalPages = Math.ceil(tasksTotalCount / tasksRowsPerPage);

  // ========== ЭФФЕКТЫ ==========
  useEffect(() => {
    fetchCCTVDevices();
    generateActivityData();
    fetchMaintenanceTasks();
  }, [fetchCCTVDevices, generateActivityData, fetchMaintenanceTasks]);

  // ========== РЕНДЕР ==========
  const renderNodeDetails = () => {
    const device = devices.find((d) => d.id === selectedNode);
    
    if (!device) {
      return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 3 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Устройство не выбрано
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Выберите устройство из списка для просмотра параметров
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Settings sx={{ color: "primary.main" }} />
          Параметры оборудования CCTV
        </Typography>
        
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Avatar sx={{ bgcolor: `${getStatusColor(device.status)}.light`, color: `${getStatusColor(device.status)}.dark` }}>
            {getDeviceIcon(device.type)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ wordBreak: "break-word" }}>{device.name}</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={getStatusIcon(device.status)}
                label={device.status}
                color={getStatusColor(device.status)}
                size="small"
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 2, flex: 1, overflow: "auto", pr: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e0e0e0", pb: 1, mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Статус</Typography>
            <Chip icon={getStatusIcon(device.status)} label={device.status} color={getStatusColor(device.status)} size="small" />
          </Box>
          
          <Box sx={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e0e0e0", pb: 1, mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Текущее значение</Typography>
            <Typography variant="body2">{formatDeviceValue(device)}</Typography>
          </Box>
          
          <Box sx={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e0e0e0", pb: 1, mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Расположение</Typography>
            <Typography variant="body2">{device.location}</Typography>
          </Box>
          
          {device.ipAddress && (
            <Box sx={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e0e0e0", pb: 1, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">IP-адрес</Typography>
              <Typography variant="body2">{device.ipAddress}</Typography>
            </Box>
          )}
          
          <Box sx={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e0e0e0", pb: 1, mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Последнее обновление</Typography>
            <Typography variant="body2">
              {device.timestamp ? new Date(device.timestamp).toLocaleString("ru-RU") : "Нет данных"}
            </Typography>
          </Box>
          
          {device.resolution && (
            <Box sx={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e0e0e0", pb: 1, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Разрешение</Typography>
              <Typography variant="body2">{device.resolution}</Typography>
            </Box>
          )}

          {device.fps && (
            <Box sx={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e0e0e0", pb: 1, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Кадров/сек</Typography>
              <Typography variant="body2">{device.fps} fps</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ mt: "auto", pt: 3, display: "flex", gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" size="small" startIcon={<History />}>
            История
          </Button>
          <Button variant="outlined" size="small" startIcon={<BuildIcon />}>
            Заявка
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3, height: "100vh", display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Шапка */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Videocam sx={{ fontSize: 40, color: "primary.main" }} />
            <Box>
              <Typography variant="h4">Система видеонаблюдения</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mt: 1 }}>
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

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
          <Tab icon={<Schedule />} iconPosition="start" label="Расписание обслуживания" />
        </Tabs>
      </Paper>

      {/* Контент табов */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        {/* Вкладка Мнемосхема */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3} sx={{ height: "100%", minHeight: "600px" }}>
            {/* Левая колонка: Схема */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ height: "100%", p: 3, display: "flex", flexDirection: "column" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Схема системы видеонаблюдения
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
                <Box sx={{ flex: 1, position: "relative", bgcolor: "#f8f9fa", borderRadius: 2, overflow: "auto", mb: 3, p: 2, display: "flex", flexDirection: "column" }}>
                  {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                      <CircularProgress />
                    </Box>
                  ) : devices.length === 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", gap: 2 }}>
                      <Typography variant="body1" color="text.secondary">
                        Нет устройств CCTV для отображения
                      </Typography>
                      <Button variant="outlined" startIcon={<Refresh />} onClick={handleManualRefresh}>
                        Обновить
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, flex: 1, mb: 2 }}>
                        {paginatedDevices.map((device) => (
                          <Card
                            key={device.id}
                            onClick={() => handleNodeClick(device.id)}
                            sx={{
                              cursor: "pointer",
                              transition: "all 0.3s",
                              border: selectedNode === device.id ? "2px solid #1976d2" : "1px solid #e0e0e0",
                              backgroundColor: selectedNode === device.id ? "primary.50" : "white",
                              position: "relative",
                              "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
                              minHeight: "120px",
                            }}
                          >
                            <CardContent sx={{ p: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
                              <Avatar sx={{ bgcolor: `${getStatusColor(device.status)}.light`, color: `${getStatusColor(device.status)}.dark`, mb: 1, width: 40, height: 40 }}>
                                {getDeviceIcon(device.type)}
                              </Avatar>
                              <Typography variant="caption" fontWeight="bold" align="center" noWrap>
                                {device.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" align="center">
                                {device.param || device.id}
                              </Typography>
                              <Chip size="small" label={device.status === "normal" ? "Норма" : device.status === "warning" ? "Внимание" : "Критично"} color={getStatusColor(device.status)} sx={{ mt: 1 }} />
                            </CardContent>
                          </Card>
                        ))}
                      </Box>

                      {filteredDevices.length > schemeItemsPerPage && (
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, pt: 2, borderTop: "1px solid #e0e0e0" }}>
                          <IconButton onClick={() => setSchemePage(1)} disabled={schemePage === 1} size="small">
                            <FirstPage />
                          </IconButton>
                          <IconButton onClick={() => setSchemePage(prev => Math.max(1, prev - 1))} disabled={schemePage === 1} size="small">
                            <ChevronLeft />
                          </IconButton>

                          <Pagination count={totalPages} page={schemePage} onChange={handleSchemePageChange} size="small" siblingCount={1} boundaryCount={1} />

                          <IconButton onClick={() => setSchemePage(prev => Math.min(totalPages, prev + 1))} disabled={schemePage === totalPages} size="small">
                            <ChevronRight />
                          </IconButton>
                          <IconButton onClick={() => setSchemePage(totalPages)} disabled={schemePage === totalPages} size="small">
                            <LastPage />
                          </IconButton>

                          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                            Страница {schemePage} из {totalPages}
                          </Typography>
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
                      <Avatar sx={{ bgcolor: `${getStatusColor(selectedDevice.status)}.light`, color: `${getStatusColor(selectedDevice.status)}.dark` }}>
                        {getDeviceIcon(selectedDevice.type)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedDevice.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {selectedDevice.param || selectedDevice.id} • Тип: {selectedDevice.type}
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
                  <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <CardHeader
                      title={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <ShowChart color="primary" />
                          <Typography variant="h6">
                            Активность доступа - Мониторинг
                          </Typography>
                          {refreshing && <CircularProgress size={20} />}
                        </Box>
                      }
                      action={
                        <Tooltip title="Обновить данные">
                          <IconButton onClick={handleManualRefresh} disabled={refreshing}>
                            <Refresh />
                          </IconButton>
                        </Tooltip>
                      }
                    />
                    <CardContent sx={{ flex: 1, p: 2 }}>
                      <Box sx={{ height: "250px", width: "100%" }}>
                        <ActivityChart
                          data={activityData}
                          title="События доступа - последние 24 часа"
                          color="#1976d2"
                          unit=" событий/час"
                          isLoading={refreshing}
                        />
                      </Box>

                      <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="caption" color="text.secondary">
                          Точек: {activityData.length}
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
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                            <Avatar sx={{ bgcolor: `${getStatusColor(selectedDevice.status)}.light`, color: `${getStatusColor(selectedDevice.status)}.main`, width: 60, height: 60 }}>
                              {getDeviceIcon(selectedDevice.type)}
                            </Avatar>
                            <Box>
                              <Typography variant="h6">{selectedDevice.name}</Typography>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                                <Chip label={selectedDevice.status === "normal" ? "Норма" : selectedDevice.status === "warning" ? "Внимание" : "Критично"} color={getStatusColor(selectedDevice.status)} size="small" />
                                <Chip label={selectedDevice.type} variant="outlined" size="small" />
                              </Box>
                            </Box>
                          </Box>

                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">ID устройства</Typography>
                              <Typography variant="body2">{selectedDevice.id}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Группа</Typography>
                              <Typography variant="body2">{selectedDevice.group || "Не указана"}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Местоположение</Typography>
                              <Typography variant="body2">{selectedDevice.location || "Не указано"}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Последнее обновление</Typography>
                              <Typography variant="body2">
                                {selectedDevice.timestamp ? new Date(selectedDevice.timestamp).toLocaleString("ru-RU") : "Нет данных"}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                            <Button size="small" startIcon={<History />} variant="outlined">
                              История
                            </Button>
                            <Button size="small" startIcon={<BuildIcon />} variant="outlined">
                              Заявка
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 3 }}>
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            Выберите устройство на схеме
                          </Typography>
                          <Typography variant="body2" color="text.secondary" align="center">
                            Нажмите на любой элемент схемы для просмотра подробной информации
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
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h5">
                Оборудование системы видеонаблюдения
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Фильтр по типу</InputLabel>
                  <Select value={selectedEquipmentType} label="Фильтр по типу" onChange={handleEquipmentTypeChange}>
                    <MenuItem value="all">Все типы</MenuItem>
                    <MenuItem value="camera">Камеры</MenuItem>
                    <MenuItem value="recorder">Регистраторы</MenuItem>
                    <MenuItem value="server">Серверы</MenuItem>
                    <MenuItem value="switch">Коммутаторы</MenuItem>
                  </Select>
                </FormControl>

                <Button variant="outlined" startIcon={<Refresh />} onClick={fetchCCTVDevices} disabled={loading}>
                  Обновить
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Параметр</TableCell>
                    <TableCell>Наименование</TableCell>
                    <TableCell>Тип</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Значение</TableCell>
                    <TableCell>Местоположение</TableCell>
                    <TableCell>Последнее обновление</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {equipmentPageDevices.length > 0 ? (
                    equipmentPageDevices.map((device) => (
                      <TableRow key={device.id} hover sx={{ cursor: "pointer", "&:hover": { backgroundColor: "action.hover" } }} onClick={() => setSelectedNode(device.id)}>
                        <TableCell><Chip label={device.id} size="small" variant="outlined" /></TableCell>
                        <TableCell><Typography variant="body1" fontWeight="medium">{device.name}</Typography></TableCell>
                        <TableCell><Chip label={device.type} size="small" variant="outlined" /></TableCell>
                        <TableCell>
                          <Chip icon={getStatusIcon(device.status)} label={device.status === "normal" ? "Норма" : device.status === "warning" ? "Внимание" : "Критично"} color={getStatusColor(device.status)} size="small" />
                        </TableCell>
                        <TableCell><Typography variant="body2">{device.value}</Typography></TableCell>
                        <TableCell>{device.location || "Не указано"}</TableCell>
                        <TableCell>
                          {device.timestamp ? (
                            <Typography variant="caption">{new Date(device.timestamp).toLocaleString("ru-RU")}</Typography>
                          ) : (
                            "Н/Д"
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        {loading ? (
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                            <CircularProgress size={24} />
                            <Typography>Загрузка данных оборудования...</Typography>
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

            {/* Пагинация */}
            {equipmentTotalCount > 0 && (
  <ReportPagination
    page={equipmentPage}
    rowsPerPage={equipmentRowsPerPage}
    totalRows={equipmentTotalCount}
    onPageChange={(page) => setEquipmentPage(page)}
    onRowsPerPageChange={(rowsPerPage) => setEquipmentRowsPerPage(rowsPerPage)}
    disabled={loading}
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
                Расписание обслуживания CCTV
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
                      Задачи обслуживания для CCTV оборудования не найдены
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
                        
                        // Находим соответствующее устройство
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
                                    {getDeviceIcon(relatedDevice.type)}
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

                {/* Пагинация */}
                {allTasks.length > 0 && (
  <ReportPagination
    page={tasksPage}
    rowsPerPage={tasksRowsPerPage}
    totalRows={tasksTotalCount}
    onPageChange={(page) => setTasksPage(page)}
    onRowsPerPageChange={(rowsPerPage) => setTasksRowsPerPage(rowsPerPage)}
    disabled={tasksLoading}
  />
)}

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
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};