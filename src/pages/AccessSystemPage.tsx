// pages/AccessSystemPage.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { SelectChangeEvent } from "@mui/material";
import {
  CheckCircle,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Build as BuildIcon,
  SensorDoor,
  Lock,
  Dashboard,
  Settings,
} from "@mui/icons-material";
import { apiClient } from "../api/client";
import { useAlert } from "../hooks/useAlert";
import { AccessSystemPageView } from "../components/access/AccessSystemPageView";
import {
  AccessDevice,
  ActivityDataPoint,
  AccessMaintenanceTask,
} from "../types/access";

// Константы
const WS_URL = process.env.REACT_APP_WS_URL;
const FUNCTIONS = process.env.REACT_APP_FUNCTIONS;

export const AccessSystemPage: React.FC = () => {
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

  const [devices, setDevices] = useState<AccessDevice[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<AccessDevice[]>([]);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // Состояния для пагинации
  const [schemePage, setSchemePage] = useState<number>(1);
  const [schemeRowsPerPage, setSchemeRowsPerPage] = useState<number>(9);
  const [equipmentPage, setEquipmentPage] = useState<number>(1);
  const [equipmentRowsPerPage, setEquipmentRowsPerPage] = useState<number>(10);
  const [equipmentTotalCount, setEquipmentTotalCount] = useState<number>(0);
  const [maintenanceTasks, setMaintenanceTasks] = useState<
    AccessMaintenanceTask[]
  >([]);
  const [allTasks, setAllTasks] = useState<AccessMaintenanceTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState<boolean>(true);
  const [tasksPage, setTasksPage] = useState<number>(1);
  const [tasksRowsPerPage, setTasksRowsPerPage] = useState<number>(10);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "info" | "warning" | "error",
  });

  const lastFetchRef = useRef<Record<string, number>>({});
  const { setAlarm, loading: alarmLoading } = useAlert();

  // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "normal":
      case "норма":
      case "активен":
        return "success";
      case "warning":
      case "внимание":
      case "предупреждение":
        return "warning";
      case "critical":
      case "критично":
      case "ошибка":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string): React.ReactElement => {
    switch (status.toLowerCase()) {
      case "normal":
      case "норма":
      case "активен":
        return <CheckCircle fontSize="small" />;
      case "warning":
      case "внимание":
      case "предупреждение":
        return <WarningIcon fontSize="small" />;
      case "critical":
      case "критично":
      case "ошибка":
        return <ErrorIcon fontSize="small" />;
      default:
        return <CheckCircle fontSize="small" />;
    }
  };

  const getDeviceIcon = (type: string): React.ReactNode => {
    switch (type.toLowerCase()) {
      case "controller":
      case "контроллер":
      case "gsm контроллер":
        return <BuildIcon />;
      case "reader":
      case "считыватель":
        return <SensorDoor />;
      case "lock":
      case "замок":
        return <Lock />;
      case "server":
      case "сервер":
        return <Dashboard />;
      case "panel":
      case "панель":
        return <Settings />;
      default:
        return <Lock />;
    }
  };

  const mapDeviceType = (deviceType: string): string => {
    if (!deviceType) return "controller";

    const typeLower = deviceType.toLowerCase();

    if (
      typeLower.includes("контроллер") ||
      typeLower.includes("controller") ||
      typeLower.includes("gsm")
    ) {
      return "controller";
    }
    if (typeLower.includes("считыватель") || typeLower.includes("reader")) {
      return "reader";
    }
    if (typeLower.includes("замок") || typeLower.includes("lock")) {
      return "lock";
    }
    if (typeLower.includes("сервер") || typeLower.includes("server")) {
      return "server";
    }
    if (typeLower.includes("панель") || typeLower.includes("panel")) {
      return "panel";
    }

    return "controller";
  };

  // ========== ФУНКЦИИ ДЛЯ ОБСЛУЖИВАНИЯ ==========
  const getTaskStatusInfo = (action: string) => {
    const actionLower = action.toLowerCase();

    if (
      actionLower.includes("выполнено") ||
      actionLower.includes("завершено")
    ) {
      return { label: "Выполнено", color: "success" as const };
    } else if (
      actionLower.includes("запланировано") ||
      actionLower.includes("план")
    ) {
      return { label: "Запланировано", color: "info" as const };
    } else if (
      actionLower.includes("задерж") ||
      actionLower.includes("отложен")
    ) {
      return { label: "Задержка", color: "warning" as const };
    } else if (
      actionLower.includes("отмен") ||
      actionLower.includes("отклонен")
    ) {
      return { label: "Отменено", color: "error" as const };
    } else if (
      actionLower.includes("в работе") ||
      actionLower.includes("выполняется")
    ) {
      return { label: "В работе", color: "primary" as const };
    } else {
      return { label: action, color: "default" as const };
    }
  };

  // ========== ФУНКЦИИ ДЛЯ ПОЛУЧЕНИЯ ДАННЫХ ГРАФИКА ==========
  const fetchHistoricalData = useCallback(async (deviceParam: string) => {
    if (!deviceParam) return [];

    try {
      setRefreshing(true);

      const prefix = deviceParam.replace(/\d+/g, "");

      const historicalData = await apiClient.post<any[]>(
        "getDevicesHTF",
        [{ param: prefix }],
        { baseURL: FUNCTIONS },
      );

      if (historicalData && Array.isArray(historicalData)) {
        const chartData: ActivityDataPoint[] = [];

        historicalData.forEach((item) => {
          if (item.vValue && Array.isArray(item.vValue) && item.vValue[0]) {
            const values = item.vValue[0];
            if (
              values[deviceParam] !== undefined &&
              values[deviceParam] !== null
            ) {
              const valueStr = String(values[deviceParam]).replace(",", ".");
              const value = parseFloat(valueStr);

              if (!isNaN(value)) {
                chartData.push({
                  timestamp: item.vUpdateTime,
                  value: value,
                  type: "activity",
                });
              }
            }
          }
        });

        chartData.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

        const limitedData =
          chartData.length > 50 ? chartData.slice(-50) : chartData;

        console.log(
          `📊 Исторических данных: ${chartData.length}, отображается: ${limitedData.length}`,
        );

        setActivityData(limitedData);
        return limitedData;
      }

      return [];
    } catch (error) {
      console.error("❌ Ошибка получения исторических данных:", error);
      setSnackbar({
        open: true,
        message: "Ошибка загрузки исторических данных",
        severity: "error",
      });
      return [];
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ========== ЗАГРУЗКА ДАННЫХ ==========
  const fetchMaintenanceTasks = useCallback(async () => {
    try {
      setTasksLoading(true);

      const response = await apiClient.get<AccessMaintenanceTask[]>("tblTasks");

      if (response && Array.isArray(response)) {
        const accessTasks = response.filter((task) => {
          const taskType = (task.type || "").toLowerCase();
          const taskDevice = (task.device || "").toLowerCase();

          return (
            taskType.includes("контроллер") ||
            taskType.includes("считыватель") ||
            taskType.includes("замок") ||
            taskType.includes("сервер") ||
            taskType.includes("панель") ||
            taskDevice.includes("контроллер") ||
            taskDevice.includes("считыватель") ||
            taskDevice.includes("замок") ||
            taskDevice.includes("сервер") ||
            taskDevice.includes("панель") ||
            taskType.includes("доступ") ||
            taskDevice.includes("доступ")
          );
        });

        setAllTasks(accessTasks);
        setMaintenanceTasks(accessTasks);
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

  const filterAccessDevices = useCallback(
    (deviceData: any[]): AccessDevice[] => {
      return deviceData
        .filter((device: any) => {
          const group = (device.group || "").toLowerCase().trim();
          const param = (device.param || "").toLowerCase();
          return (
            group === "access" ||
            param.startsWith("sr") ||
            param.startsWith("fh") ||
            param.startsWith("lk")
          );
        })
        .map((device: any, index: number): AccessDevice => {
          const deviceType = mapDeviceType(
            device.type || device.description || device.name || "controller",
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

          const deviceId =
            device.param || device.id || `access-device-${index}`;

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
            onlineUsers: undefined,
            batteryLevel: undefined,
            isOnline: device.active !== false,
          };
        });
    },
    [],
  );

  const fetchAccessDevices = useCallback(async () => {
    try {
      setLoading(true);

      const response = await apiClient.get("tblDevices");

      if (response && Array.isArray(response)) {
        const accessDevices = filterAccessDevices(response);

        try {
          const valuesResponse = await apiClient.get<any[]>("tblValues");
          if (valuesResponse && Array.isArray(valuesResponse)) {
            const updatedDevices = accessDevices.map((device) => {
              if (device.param) {
                const deviceValue = valuesResponse.find(
                  (item: any) =>
                    item.param === device.param ||
                    item.name === device.param ||
                    item.id === device.param,
                );

                if (deviceValue) {
                  const valueStr = String(
                    deviceValue.value ||
                      deviceValue.data ||
                      deviceValue.val ||
                      "0",
                  );
                  const numericValue = parseFloat(valueStr.replace(",", "."));

                  if (!isNaN(numericValue)) {
                    const getUnitByParam = (param: string): string => {
                      if (param.startsWith("sr")) return "ед.";
                      if (param.startsWith("fh")) return "%";
                      if (param.startsWith("lk")) return "сост.";
                      return "ед.";
                    };

                    const unit = getUnitByParam(device.param);

                    return {
                      ...device,
                      value: `${numericValue.toFixed(2)}${unit}`,
                      batteryLevel: device.param.startsWith("fh")
                        ? numericValue
                        : undefined,
                      onlineUsers: device.param.startsWith("sr")
                        ? numericValue
                        : undefined,
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
                await fetchHistoricalData(firstDevice.param);
              }
            }
          } else {
            setDevices(accessDevices);
            setFilteredDevices(accessDevices);
            setEquipmentTotalCount(accessDevices.length);
          }
        } catch (error) {
          console.warn("⚠️ Ошибка загрузки значений:", error);
          setDevices(accessDevices);
          setFilteredDevices(accessDevices);
          setEquipmentTotalCount(accessDevices.length);
        }

        setError(null);
      }
    } catch (err: any) {
      console.error("Ошибка загрузки устройств СКУД:", err);
      setSnackbar({
        open: true,
        message: `Ошибка загрузки устройств СКУД: ${err.message}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedNode, filterAccessDevices, fetchHistoricalData]);

  // ========== WEB SOCKET ==========
  useEffect(() => {
    if (!WS_URL) {
      console.warn("WebSocket URL не настроен");
      return;
    }

    const ws = new WebSocket(WS_URL);
    console.log("🔗 Подключение к WebSocket для СКУД:", WS_URL);

    ws.onopen = () => {
      console.log("✅ WebSocket подключен для СКУД");
      setWsConnected(true);

      const subscribeMsg = {
        type: "SUBSCRIBE",
        path: "tblDevices",
      };

      ws.send(JSON.stringify(subscribeMsg));
      console.log("📡 Подписка отправлена");

      setSnackbar({
        open: true,
        message: "Реальное время подключено для СКУД",
        severity: "success",
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "UPDATE") {
          if (data.value && Array.isArray(data.value)) {
            const accessDevices = filterAccessDevices(data.value);
            setDevices((prev) => {
              const deviceMap = new Map<string, AccessDevice>();

              prev.forEach((device) => {
                deviceMap.set(device.id, device);
              });

              accessDevices.forEach((newDevice) => {
                deviceMap.set(newDevice.id, newDevice);
              });

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
  }, [filterAccessDevices]);

  // ========== АВТООБНОВЛЕНИЕ ГРАФИКА ==========
  useEffect(() => {
    if (!pollingActive || !selectedNode) return;

    const selectedDevice = devices.find((d) => d.id === selectedNode);
    if (!selectedDevice?.param) return;

    const intervalId = setInterval(() => {
      console.log("🔄 Автообновление графика");
      fetchHistoricalData(selectedDevice.param!);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [pollingActive, selectedNode, devices, fetchHistoricalData]);

  // ========== ОБРАБОТЧИКИ ==========
  const handleManualRefresh = () => {
    fetchAccessDevices();
    fetchMaintenanceTasks();
  };

  const handleNodeClick = async (nodeId: string) => {
    setSelectedNode(nodeId);

    const device = devices.find((d) => d.id === nodeId);
    if (device?.param) {
      await fetchHistoricalData(device.param);
    }
  };

  const handleAlarmClick = async () => {
    const device = devices.find((d) => d.id === selectedNode);
    if (!device) {
      setSnackbar({
        open: true,
        message: "Устройство не найдено",
        severity: "warning",
      });
      return;
    }

    const currentUser = localStorage.getItem("userName") || "admin";
    const parameter = device.param || device.id;
    const value = device.value || "Н/Д";

    try {
      const alarmParams = {
        parameter: parameter,
        value: value,
        user: currentUser,
      };

      await setAlarm(alarmParams);

      setSnackbar({
        open: true,
        message: `Сигнал тревоги отправлен для ${device.name}`,
        severity: "success",
      });
    } catch (err: any) {
      console.error("❌ Ошибка при отправке сигнала тревоги:", err);
      setSnackbar({
        open: true,
        message: `Ошибка отправки сигнала тревоги: ${err.message || "Неизвестная ошибка"}`,
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

  const handleEquipmentTypeChange = (event: SelectChangeEvent) => {
    const type = event.target.value;
    setSelectedEquipmentType(type);

    if (type === "all") {
      setFilteredDevices(devices);
    } else {
      const filtered = devices.filter(
        (device) => device.type.toLowerCase() === type.toLowerCase(),
      );
      setFilteredDevices(filtered);
    }
    setEquipmentTotalCount(filteredDevices.length);
    setSchemePage(1);
    setEquipmentPage(1);
  };

  const handlePollingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPollingActive(event.target.checked);
  };

  const handleRefreshChart = () => {
    const device = devices.find((d) => d.id === selectedNode);
    if (device?.param) {
      fetchHistoricalData(device.param);
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

  const handleSchemeRowsPerPageChange = (newRowsPerPage: number) => {
    setSchemeRowsPerPage(newRowsPerPage);
    setSchemePage(1);
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
    fetchAccessDevices();
    fetchMaintenanceTasks();
  }, [fetchAccessDevices, fetchMaintenanceTasks]);

  // ========== РЕНДЕР ==========
  return (
    <AccessSystemPageView
      // Состояния
      activityData={activityData}
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
      onRefreshChart={handleRefreshChart}
      onSchemePageChange={handleSchemePageChange}
      onEquipmentPageChange={handleEquipmentPageChange}
      onEquipmentRowsPerPageChange={handleEquipmentRowsPerPageChange}
      onTasksPageChange={handleTasksPageChange}
      onTasksRowsPerPageChange={handleTasksRowsPerPageChange}
      onSchemeRowsPerPageChange={handleSchemeRowsPerPageChange}
      // Вспомогательные функции
      getStatusColor={getStatusColor}
      getStatusIcon={getStatusIcon}
      getDeviceIcon={getDeviceIcon}
      getTaskStatusInfo={getTaskStatusInfo}
    />
  );
};
