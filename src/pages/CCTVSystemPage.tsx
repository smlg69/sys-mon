// pages/CCTVSystemPage.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SelectChangeEvent } from "@mui/material";
import {
  CheckCircle,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Camera,
  Storage,
  Computer,
  Lan,
  Router,
  Videocam,
} from "@mui/icons-material";
import { apiClient } from "../api/client";
import { useAlert } from '../hooks/useAlert';
import { CCTVSystemPageView } from "../components/cctv/CCTVSystemPageView";
import { 
  CCTVDevice, 
  CCTVDataPoint, 
  CCTVMaintenanceTask,
  HTFResponseItem,
  TblValuesItem 
} from "../types/cctv";

// Константы
const TARGET_WS = process.env.REACT_APP_TARGET_WS;
const FUNCTIONS = process.env.REACT_APP_FUNCTIONS;

export const CCTVSystemPage: React.FC = () => {
  // ========== СОСТОЯНИЯ ==========
  const [chartData, setChartData] = useState<CCTVDataPoint[]>([]);
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
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  const [schemePage, setSchemePage] = useState<number>(1);
  const [schemeRowsPerPage] = useState<number>(9);
  const [equipmentPage, setEquipmentPage] = useState<number>(1);
  const [equipmentRowsPerPage, setEquipmentRowsPerPage] = useState<number>(10);
  const [equipmentTotalCount, setEquipmentTotalCount] = useState<number>(0);
  
  const [maintenanceTasks, setMaintenanceTasks] = useState<CCTVMaintenanceTask[]>([]);
  const [allTasks, setAllTasks] = useState<CCTVMaintenanceTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState<boolean>(true);
  const [tasksPage, setTasksPage] = useState<number>(1);
  const [tasksRowsPerPage, setTasksRowsPerPage] = useState<number>(10);

  const { setAlarm, loading: alarmLoading } = useAlert();
  
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

  const getStatusIcon = (status: string): React.ReactElement => {
    switch (status.toLowerCase()) {
      case "normal": case "норма": case "активен": 
        return <CheckCircle fontSize="small" />;
      case "warning": case "внимание": case "предупреждение": 
        return <WarningIcon fontSize="small" />;
      case "critical": case "критично": case "ошибка": 
        return <ErrorIcon fontSize="small" />;
      default: 
        return <CheckCircle fontSize="small" />;
    }
  };

  const getDeviceIcon = (type: string): React.ReactNode => {
    switch (type.toLowerCase()) {
      case "camera": case "камера": 
        return <Camera />;
      case "recorder": case "регистратор": case "rg": 
        return <Storage />;
      case "server": case "сервер": case "sr": 
        return <Computer />;
      case "switch": case "коммутатор": 
        return <Lan />;
      case "nvr": case "nvr-регистратор": 
        return <Router />;
      case "scanner": case "сканер": case "sc": 
        return <Videocam />;
      default: 
        return <Videocam />;
    }
  };

  const formatDeviceValue = (device: CCTVDevice): string => {
    if (device.currentValue !== undefined) {
      let unit = "ед.";
      if (device.param?.startsWith('cam')) unit = 'fps';
      if (device.param?.startsWith('rg')) unit = 'кБ/с';
      if (device.param?.startsWith('sc')) unit = '%';
      if (device.param?.startsWith('sr')) unit = 'ед.';
      return `${device.currentValue.toFixed(2)} ${unit}`;
    }
    return device.value || "Нет данных";
  };

  const mapDeviceType = (deviceType: string, param?: string): string => {
    if (!deviceType) {
      // Определяем по параметру
      if (param?.startsWith('cam')) return "camera";
      if (param?.startsWith('rg')) return "recorder";
      if (param?.startsWith('sc')) return "scanner";
      if (param?.startsWith('sr')) return "server";
      return "camera";
    }

    const typeLower = deviceType.toLowerCase();

    if (typeLower.includes("камера") || typeLower.includes("camera") || typeLower.includes("cam")) {
      return "camera";
    }
    if (typeLower.includes("регистратор") || typeLower.includes("recorder") || typeLower.includes("rg")) {
      return "recorder";
    }
    if (typeLower.includes("сервер") || typeLower.includes("server") || typeLower.includes("sr")) {
      return "server";
    }
    if (typeLower.includes("сканер") || typeLower.includes("scanner") || typeLower.includes("sc")) {
      return "scanner";
    }
    if (typeLower.includes("коммутатор") || typeLower.includes("switch") || typeLower.includes("sw")) {
      return "switch";
    }
    return "camera";
  };

  // ========== ФУНКЦИИ ДЛЯ ПОЛУЧЕНИЯ РЕАЛЬНЫХ ДАННЫХ ==========
  const fetchFromGetDevicesHTF = useCallback(async (paramPrefix: string): Promise<CCTVDataPoint[]> => {
    try {
      console.log('🔍 fetchFromGetDevicesHTF для префикса:', paramPrefix);
      
      const functionsBase = FUNCTIONS;
      if (!functionsBase) {
        console.error('❌ FUNCTIONS не определен в env');
        return [];
      }
      
      const requestData = [{ param: paramPrefix }];
      
      console.log('📤 Отправляем запрос с данными:', JSON.stringify(requestData));
      
      const response = await apiClient.post<HTFResponseItem[]>(
        'getDevicesHTF',
        requestData,
        { 
          baseURL: functionsBase,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('📥 Ответ getDevicesHTF:', {
        тип: Array.isArray(response) ? 'массив' : typeof response,
        длина: Array.isArray(response) ? response.length : 'N/A',
      });
      
      if (response && Array.isArray(response) && response.length > 0) {
        const historicalData: CCTVDataPoint[] = [];
        
        response.forEach((item: HTFResponseItem) => {
          if (item.vValue && Array.isArray(item.vValue) && item.vValue[0]) {
            const values = item.vValue[0];
            
            Object.keys(values).forEach(key => {
              if (key.startsWith(paramPrefix) && key !== 'volumeDate' && key !== 'id') {
                const valueStr = String(values[key]).replace(',', '.');
                const value = parseFloat(valueStr);
                
                if (!isNaN(value)) {
                  historicalData.push({
                    timestamp: item.vUpdateTime,
                    value: value,
                    node: key,
                    param: key
                  });
                }
              }
            });
          }
        });
        
        console.log(`📈 Найдено ${historicalData.length} точек для префикса ${paramPrefix}`);
        return historicalData;
      }
      
      return [];
      
    } catch (error: any) {
      console.error('❌ Ошибка getDevicesHTF:', error.message);
      return [];
    }
  }, []);

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
      
      const response = await apiClient.get<CCTVMaintenanceTask[]>('tblTasks');
      
      if (response && Array.isArray(response)) {
        const cctvTasks = response.filter(task => {
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
                 taskDevice.includes('регистратор');
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

  // ========== ЗАГРУЗКА УСТРОЙСТВ CCTV ==========
  const filterCCTVDevices = useCallback((deviceData: any[]): CCTVDevice[] => {
    return deviceData
      .filter((device: any) => {
        const group = (device.group || "").toLowerCase().trim();
        const param = (device.param || "").toLowerCase();
        const name = (device.name || "").toLowerCase();
        
        return group === "video" || 
               group === "cctv" ||
               param.startsWith("cam") ||
               param.startsWith("rg") ||
               param.startsWith("sc") ||
               param.startsWith("sr") ||
               name.includes("камера") ||
               name.includes("видео") ||
               name.includes("cctv") ||
               name.includes("регистратор");
      })
      .map((device: any, index: number): CCTVDevice => {
        const deviceType = mapDeviceType(device.type || device.description || device.name, device.param);

        let status: "normal" | "warning" | "critical" = "normal";
        if (device.status === "warning" || device.status === "Внимание") {
          status = "warning";
        } else if (device.status === "critical" || device.status === "Критично") {
          status = "critical";
        }

        const deviceId = device.param || device.id || `cctv-${index}`;

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
          fps: undefined,
          storageUsage: undefined,
          isOnline: device.active !== false,
          currentValue: undefined,
        };
      });
  }, []);

  const fetchCCTVDevices = useCallback(async () => {
    try {
      setLoading(true);

      const response = await apiClient.get("tblDevices");

      if (response && Array.isArray(response)) {
        const cctvDevices = filterCCTVDevices(response);
        console.log(`📊 Найдено ${cctvDevices.length} устройств CCTV`);

        try {
          const valuesResponse = await apiClient.get<TblValuesItem[]>('tblValues');
          if (valuesResponse && Array.isArray(valuesResponse)) {
            console.log(`📈 Загружено ${valuesResponse.length} текущих значений`);
            
            const updatedDevices = cctvDevices.map(device => {
              if (device.param) {
                const deviceValue = valuesResponse.find((item: TblValuesItem) => 
                  item.param === device.param ||
                  item.name === device.param ||
                  item.id === device.param
                );
                
                if (deviceValue) {
                  const valueStr = String(deviceValue.value || deviceValue.data || deviceValue.val || '0');
                  const numericValue = parseFloat(valueStr.replace(',', '.'));
                  
                  if (!isNaN(numericValue)) {
                    let unit = "ед.";
                    if (device.param.startsWith('cam')) unit = 'fps';
                    if (device.param.startsWith('rg')) unit = 'кБ/с';
                    if (device.param.startsWith('sc')) unit = '%';
                    if (device.param.startsWith('sr')) unit = 'ед.';
                    
                    return {
                      ...device,
                      value: `${numericValue.toFixed(2)} ${unit}`,
                      currentValue: numericValue,
                      timestamp: deviceValue.timestamp || deviceValue.time || deviceValue.created_at || new Date().toISOString()
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
              const firstDevice = updatedDevices[0];
              setSelectedNode(firstDevice.id);
              if (firstDevice.param) {
                const prefix = firstDevice.param.replace(/\d+$/, '');
                await fetchHistoricalDataForDevice(firstDevice.id, prefix, firstDevice.param);
              }
            }
          } else {
            console.warn('⚠️ tblValues вернул не массив');
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

  // ========== ОБНОВЛЕНИЕ ДАННЫХ ГРАФИКА ==========
  const fetchHistoricalDataForDevice = useCallback(async (deviceId: string, paramPrefix: string, specificParam?: string) => {
    console.log(`🔄 Загрузка исторических данных для устройства ${deviceId}, префикс: ${paramPrefix}`);
    
    try {
      setRefreshing(true);
      
      const historicalData = await fetchFromGetDevicesHTF(paramPrefix);
      
      if (historicalData.length === 0) {
        console.error('❌ Нет исторических данных для отображения');
        setSnackbar({
          open: true,
          message: `Нет данных для префикса ${paramPrefix}`,
          severity: 'warning'
        });
        return;
      }
      
      let filteredData = historicalData;
      if (specificParam) {
        filteredData = historicalData.filter(item => item.param === specificParam);
        console.log(`📊 Для параметра ${specificParam} найдено ${filteredData.length} точек`);
      }
      
      filteredData.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      setChartData(filteredData);
      console.log(`✅ График обновлен: ${filteredData.length} точек`);
      
      if (filteredData.length > 0) {
        const latestValue = filteredData[filteredData.length - 1].value;
        
        setDevices(prev => prev.map(d => 
          d.id === deviceId ? { 
            ...d, 
            currentValue: latestValue,
            timestamp: filteredData[filteredData.length - 1].timestamp
          } : d
        ));
      }
      
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
  }, [fetchFromGetDevicesHTF]);

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
      
      setSnackbar({
        open: true,
        message: "Реальное время подключено для CCTV",
        severity: "success",
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "UPDATE") {
          console.log("🔄 Обновление данных через WS");
          setLastUpdate(new Date().toLocaleTimeString("ru-RU"));
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

  // ========== АВТООБНОВЛЕНИЕ ГРАФИКА ==========
  useEffect(() => {
    if (!pollingActive || !selectedNode) return;
    
    const intervalId = setInterval(() => {
      console.log('🔄 Автообновление данных CCTV');
      const selectedDevice = devices.find(d => d.id === selectedNode);
      if (selectedDevice?.param) {
        const prefix = selectedDevice.param.replace(/\d+$/, '');
        fetchHistoricalDataForDevice(selectedNode, prefix, selectedDevice.param);
      }
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [pollingActive, selectedNode, devices, fetchHistoricalDataForDevice]);

  // ========== ОБРАБОТЧИКИ ==========
  const handleManualRefresh = useCallback(() => {
    fetchCCTVDevices();
    const selectedDevice = devices.find(d => d.id === selectedNode);
    if (selectedDevice?.param) {
      const prefix = selectedDevice.param.replace(/\d+$/, '');
      fetchHistoricalDataForDevice(selectedNode, prefix, selectedDevice.param);
    }
    fetchMaintenanceTasks();
  }, [fetchCCTVDevices, selectedNode, devices, fetchHistoricalDataForDevice, fetchMaintenanceTasks]);

  const handleNodeClick = useCallback(async (nodeId: string) => {
    setSelectedNode(nodeId);
    
    const device = devices.find(d => d.id === nodeId);
    if (device?.param) {
      const prefix = device.param.replace(/\d+$/, '');
      await fetchHistoricalDataForDevice(nodeId, prefix, device.param);
    }
  }, [devices, fetchHistoricalDataForDevice]);

  const handleAlarmClick = useCallback(async () => {
    const device = devices.find((d) => d.id === selectedNode);
    if (!device) {
      setSnackbar({
        open: true,
        message: "Устройство не найдено",
        severity: "warning",
      });
      return;
    }

    try {
      const currentUser = localStorage.getItem('userName') || 'admin';
      
      await setAlarm({
        parameter: device.param || device.id,
        value: device.value || 'Н/Д',
        user: currentUser
      });

      setSnackbar({
        open: true,
        message: `Сигнал тревоги отправлен для ${device.name}`,
        severity: "success",
      });
    } catch (err: any) {
      console.error('❌ Ошибка при отправке сигнала тревоги:', err);
      setSnackbar({
        open: true,
        message: `Ошибка отправки сигнала тревоги: ${err.message || 'Неизвестная ошибка'}`,
        severity: "error",
      });
    }
  }, [devices, selectedNode, setAlarm]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleEquipmentTypeChange = (event: SelectChangeEvent) => {
    const type = event.target.value;
    setSelectedEquipmentType(type);
    
    if (type === "all") {
      setFilteredDevices(devices);
      setEquipmentTotalCount(devices.length);
    } else {
      const filtered = devices.filter(device => 
        device.type.toLowerCase() === type.toLowerCase()
      );
      setFilteredDevices(filtered);
      setEquipmentTotalCount(filtered.length);
    }
    setEquipmentPage(1);
    setSchemePage(1);
  };

  const handlePollingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPollingActive(event.target.checked);
  };

  const handleRefreshChart = () => {
    const device = devices.find(d => d.id === selectedNode);
    if (device?.param) {
      const prefix = device.param.replace(/\d+$/, '');
      fetchHistoricalDataForDevice(selectedNode, prefix, device.param);
    }
  };

  // ========== ОБРАБОТЧИКИ ПАГИНАЦИИ ==========
  const handleSchemePageChange = (newPage: number) => {
    setSchemePage(newPage);
  };

  const handleEquipmentPageChange = (newPage: number) => {
    setEquipmentPage(newPage);
  };

  const handleEquipmentRowsPerPageChange = (newRowsPerPage: number) => {
    setEquipmentRowsPerPage(newRowsPerPage);
    setEquipmentPage(1);
  };

  const handleTasksPageChange = (newPage: number) => {
    setTasksPage(newPage);
  };

  const handleTasksRowsPerPageChange = (newRowsPerPage: number) => {
    setTasksRowsPerPage(newRowsPerPage);
    setTasksPage(1);
  };

  // ========== ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ ==========
  const schemeTotalCount = filteredDevices.length;
  const paginatedDevices = useMemo(() => {
    const startIndex = (schemePage - 1) * schemeRowsPerPage;
    const endIndex = startIndex + schemeRowsPerPage;
    return filteredDevices.slice(startIndex, endIndex);
  }, [filteredDevices, schemePage, schemeRowsPerPage]);

  const equipmentPageDevices = useMemo(() => {
    const startIndex = (equipmentPage - 1) * equipmentRowsPerPage;
    const endIndex = startIndex + equipmentRowsPerPage;
    return filteredDevices.slice(startIndex, endIndex);
  }, [filteredDevices, equipmentPage, equipmentRowsPerPage]);

  const paginatedTasks = useMemo(() => {
    const startIndex = (tasksPage - 1) * tasksRowsPerPage;
    const endIndex = startIndex + tasksRowsPerPage;
    return allTasks.slice(startIndex, endIndex);
  }, [allTasks, tasksPage, tasksRowsPerPage]);

  const tasksTotalCount = allTasks.length;
  const selectedDevice = useMemo(() => {
    return devices.find((d) => d.id === selectedNode) || filteredDevices[0];
  }, [devices, selectedNode, filteredDevices]);

  // ========== ЭФФЕКТЫ ==========
  useEffect(() => {
    fetchCCTVDevices();
    fetchMaintenanceTasks();
  }, [fetchCCTVDevices, fetchMaintenanceTasks]);

  // ========== РЕНДЕР ==========
  return (
    <CCTVSystemPageView
      // Состояния
      chartData={chartData}
      loading={loading}
      refreshing={refreshing}
      error={error}
      lastUpdate={lastUpdate}
      currentTab={currentTab}
      selectedNode={selectedNode}
      pollingActive={pollingActive}
      selectedEquipmentType={selectedEquipmentType}
      devices={devices}
      filteredDevices={filteredDevices}
      wsConnected={wsConnected}
      equipmentTotalCount={equipmentTotalCount}
      allTasks={allTasks}
      tasksLoading={tasksLoading}
      schemePage={schemePage}
      schemeRowsPerPage={schemeRowsPerPage}
      equipmentPage={equipmentPage}
      equipmentRowsPerPage={equipmentRowsPerPage}
      tasksPage={tasksPage}
      tasksRowsPerPage={tasksRowsPerPage}
      snackbar={snackbar}
      alarmLoading={alarmLoading}

      // Пагинация
      schemeTotalCount={schemeTotalCount}
      paginatedDevices={paginatedDevices}
      equipmentPageDevices={equipmentPageDevices}
      paginatedTasks={paginatedTasks}
      tasksTotalCount={tasksTotalCount}
      selectedDevice={selectedDevice}

      // Обработчики
      onManualRefresh={handleManualRefresh}
      onNodeClick={handleNodeClick}
      onAlarmClick={handleAlarmClick}
      onTabChange={handleTabChange}
      onCloseSnackbar={handleCloseSnackbar}
      onEquipmentTypeChange={handleEquipmentTypeChange}
      onPollingChange={handlePollingChange}
      onSchemePageChange={handleSchemePageChange}
      onEquipmentPageChange={handleEquipmentPageChange}
      onEquipmentRowsPerPageChange={handleEquipmentRowsPerPageChange}
      onTasksPageChange={handleTasksPageChange}
      onTasksRowsPerPageChange={handleTasksRowsPerPageChange}
      onRefreshChart={handleRefreshChart}

      // Вспомогательные функции
      getStatusColor={getStatusColor}
      getStatusIcon={getStatusIcon}
      getDeviceIcon={getDeviceIcon}
      getTaskStatusInfo={getTaskStatusInfo}
      formatDeviceValue={formatDeviceValue}
    />
  );
};