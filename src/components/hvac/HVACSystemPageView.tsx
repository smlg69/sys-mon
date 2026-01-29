// components/hvac/HVACSystemPageView.tsx
import React from "react";
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  AcUnit,
  Schema,
  Build,
  Schedule,
  Refresh,
  ShowChart,
  Settings,
  CheckCircle,
  Warning as WarningIcon,
  //Error as ErrorIcon,
  History,
  Whatshot,
  InvertColors,
  Toys,
  ElectricBolt,
  Sensors,
  Assignment,
  Visibility,
  TrendingUp,
  //TrendingDown,
  //ArrowUpward,
  //ArrowDownward,
} from "@mui/icons-material";
import { ReportPagination } from "../reports/Pagination";
import { TemperatureChart } from "./TemperatureChart";
import { HVACDevice, TemperatureDataPoint, HVACMaintenanceTask } from "../../types/hvac";
import { SelectChangeEvent } from "@mui/material";


// Интерфейс пропсов
interface HVACSystemPageViewProps {
  // Состояния
  temperatureData: TemperatureDataPoint[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdate: string;
  currentTab: number;
  selectedNode: string;
  pollingActive: boolean;
  selectedEquipmentType: string;
  devices: HVACDevice[];
  filteredDevices: HVACDevice[];
  wsConnected: boolean;
  equipmentTotalCount: number;
  allTasks: HVACMaintenanceTask[];
  tasksLoading: boolean;
  schemePage: number;
  schemeRowsPerPage: number;
  equipmentPage: number;
  equipmentRowsPerPage: number;
  tasksPage: number;
  tasksRowsPerPage: number;
  snackbar: {
    open: boolean;
    message: string;
    severity: "success" | "info" | "warning" | "error";
  };
  alarmLoading: boolean;

  // Пагинация
  schemeTotalCount: number;
  paginatedDevices: HVACDevice[];
  equipmentPageDevices: HVACDevice[];
  paginatedTasks: HVACMaintenanceTask[];
  tasksTotalCount: number;
  selectedDevice?: HVACDevice;

  // Обработчики
  onManualRefresh: () => void;
  onNodeClick: (nodeId: string) => void;
  onAlarmClick: () => void;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  onCloseSnackbar: () => void;
  onPollingChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEquipmentTypeChange: (event: SelectChangeEvent) => void;
  onSchemePageChange: (newPage: number) => void;
  onEquipmentPageChange: (newPage: number) => void;
  onEquipmentRowsPerPageChange: (newRowsPerPage: number) => void;
  onTasksPageChange: (newPage: number) => void;
  onTasksRowsPerPageChange: (newRowsPerPage: number) => void;
  onRefreshChart: () => void;
  onDebugChart: () => void;

  // Вспомогательные функции
  getStatusColor: (status: string) => "success" | "warning" | "error" | "default";
  getStatusIcon: (status: string) => React.ReactElement;
  getDeviceIcon: (type: string) => React.ReactNode;
  getTaskStatusInfo: (action: string) => { 
    label: string; 
    color: "success" | "info" | "warning" | "error" | "default" | "primary"; 
  };
  formatDeviceValue: (device: HVACDevice) => string;
}

// TabPanel компонент
const TabPanel: React.FC<{
  children?: React.ReactNode;
  index: number;
  value: number;
}> = ({ children, value, index, ...other }) => {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export const HVACSystemPageView: React.FC<HVACSystemPageViewProps> = ({
  // Состояния
  temperatureData,
  loading,
  refreshing,
  error,
  lastUpdate,
  currentTab,
  selectedNode,
  pollingActive,
  selectedEquipmentType,
  devices,
  filteredDevices,
  wsConnected,
  equipmentTotalCount,
  allTasks,
  tasksLoading,
  schemePage,
  schemeRowsPerPage,
  equipmentPage,
  equipmentRowsPerPage,
  tasksPage,
  tasksRowsPerPage,
  snackbar,
  alarmLoading,

  // Пагинация
  schemeTotalCount,
  paginatedDevices,
  equipmentPageDevices,
  paginatedTasks,
  tasksTotalCount,
  selectedDevice,

  // Обработчики
  onManualRefresh,
  onNodeClick,
  onAlarmClick,
  onTabChange,
  onCloseSnackbar,
  onPollingChange,
  onEquipmentTypeChange,
  onSchemePageChange,
  onEquipmentPageChange,
  onEquipmentRowsPerPageChange,
  onTasksPageChange,
  onTasksRowsPerPageChange,
  onRefreshChart,
  onDebugChart,

  // Вспомогательные функции
  getStatusColor,
  getStatusIcon,
  //getDeviceIcon,
  getTaskStatusInfo,
  //formatDeviceValue,
}) => {
  
  // Вспомогательная функция для получения иконки по типу параметра
const getDeviceIcon = (description: string): React.ReactNode => {
  const desc = description.toLowerCase();
  
  if (desc.includes("давление")) return <TrendingUp fontSize="small" />;
  if (desc.includes("температура")) return <Whatshot fontSize="small" />;
  if (desc.includes("вентиляция")) return <Toys fontSize="small" />;
  if (desc.includes("влажность")) return <InvertColors fontSize="small" />;
  if (desc.includes("электричество")) return <ElectricBolt fontSize="small" />;
  if (desc.includes("датчик")) return <Sensors fontSize="small" />;
  
  return <Build fontSize="small" />;
};

// Форматирование значения устройства
const formatDeviceValue = (device: HVACDevice): string => {
  const value = device.value;
  if (value === undefined) return "Нет данных";
  
  const desc = device.description?.toLowerCase() || "";
  
  if (desc.includes("давление")) return `${parseFloat(device.value.toString()).toFixed(2)} бар`;
  if (desc.includes("температура")) return `${parseFloat(device.value.toString()).toFixed(1)} °C`;
  if (desc.includes("влажность")) return `${parseFloat(device.value.toString()).toFixed(0)} %`;
  
  return `${parseFloat(device.value.toString()).toFixed(1)} ед.`;
};
  
  // Рендер кнопки тревоги
  const renderAlarmButton = () => {
    if (!selectedNode) return null;

    return (
      <Tooltip title="Отправить сигнал тревоги">
        <Fab
          color="error"
          size="small"
          onClick={onAlarmClick}
          disabled={alarmLoading}
          sx={{ 
            boxShadow: 2,
            position: 'relative'
          }}
        >
          {alarmLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <WarningIcon />
          )}
        </Fab>
      </Tooltip>
    );
  };

  // Получение уникальных типов оборудования для фильтра
  /*const equipmentTypes = React.useMemo(() => {
    const types = devices.map(device => device.type);
    return ['all', ...Array.from(new Set(types))];
  }, [devices]);*/

  return (
    <Box sx={{ p: 3, height: "100vh", display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Шапка */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <AcUnit sx={{ fontSize: 40, color: "primary.main" }} />
            <Box>
              <Typography variant="h4">Система ЖКХ</Typography>
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

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Typography variant="body2" color="text.secondary">
              Режим работы: нормальный • Последнее обновление: {lastUpdate}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={pollingActive}
                  onChange={onPollingChange}
                  size="small"
                />
              }
              label="Автообновление"
              labelPlacement="start"
              sx={{ m: 0 }}
            />

            <Tooltip title="Обновить все данные">
              <IconButton
                onClick={onManualRefresh}
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
        <Tabs value={currentTab} onChange={onTabChange} variant="fullWidth">
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
                    Схема системы ЖКХ
                  </Typography>
                  {renderAlarmButton()}
                </Box>

                {/* Схема 3x3 с пагинацией */}
                <Box sx={{ flex: 1, position: "relative", bgcolor: "#f8f9fa", borderRadius: 2, overflow: "auto", mb: 3, p: 2, display: "flex", flexDirection: "column" }}>
                  {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                      <CircularProgress />
                    </Box>
                  ) : filteredDevices.length === 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", gap: 2 }}>
                      <Typography variant="body1" color="text.secondary">
                        Нет устройств для отображения
                      </Typography>
                      <Button variant="outlined" startIcon={<Refresh />} onClick={onManualRefresh}>
                        Обновить
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, flex: 1, mb: 2 }}>
                        {paginatedDevices.map((device) => (
                          <Card
                            key={device.id}
                            onClick={() => onNodeClick(device.id)}
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
                              <Chip 
                                size="small" 
                                label={device.status === "normal" ? "Норма" : device.status === "warning" ? "Внимание" : "Критично"} 
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
                            onPageChange={onSchemePageChange}
                            onRowsPerPageChange={() => {}}
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
                      <Avatar sx={{ bgcolor: `${getStatusColor(selectedDevice.status)}.light`, color: `${getStatusColor(selectedDevice.status)}.dark` }}>
                        {getDeviceIcon(selectedDevice.type)}
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
                            Текущее значение: {formatDeviceValue(selectedDevice)}
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
                              onClick={onDebugChart}
                              size="small"
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Отладка данных">
                            <IconButton
                              onClick={onDebugChart}
                              size="small"
                            >
                              <Build />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Обновить данные">
                            <IconButton
                              onClick={onRefreshChart}
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
                          title={`Оборудование - ${selectedDevice?.name || "Устройство"}`}
                          color="#1976d2"
                          unit="°C"
                          isLoading={refreshing}
                        />
                      </Box>

                      <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
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
                              <Typography variant="h6">
                                {selectedDevice.name}
                              </Typography>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                                <Chip
                                  label={selectedDevice.status === "normal" ? "Норма" : selectedDevice.status === "warning" ? "Внимание" : "Критично"}
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
                          {selectedDevice.temperature !== undefined && (
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
                                {formatDeviceValue(selectedDevice)}
                              </Typography>
                            </Paper>
                          )}

                          {/* Дополнительная информация */}
                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                ID устройства
                              </Typography>
                              <Typography variant="body2">
                                {selectedDevice.id}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Группа
                              </Typography>
                              <Typography variant="body2">
                                {selectedDevice.group || "Не указано"}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Местоположение
                              </Typography>
                              <Typography variant="body2">
                                {selectedDevice.location || "Не указано"}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Последнее обновление
                              </Typography>
                              <Typography variant="body2">
                                {selectedDevice.timestamp
                                  ? new Date(selectedDevice.timestamp).toLocaleString("ru-RU")
                                  : "Нет данных"}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                            <Button
                              size="small"
                              startIcon={<History />}
                              variant="outlined"
                            >
                              История
                            </Button>
                            <Button
                              size="small"
                              startIcon={<Assignment />}
                              variant="outlined"
                            >
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
                            Нажмите на любой элемент схеме для просмотра подробной информации
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
                Оборудование системы ЖКХ
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
  <InputLabel>Тип параметра</InputLabel>
  <Select
    value={selectedEquipmentType}
    label="Тип параметра"
    onChange={onEquipmentTypeChange}
  >
    <MenuItem value="all">Все типы</MenuItem>
    <MenuItem value="давление">Давление</MenuItem>
    <MenuItem value="температура">Температура</MenuItem>
    <MenuItem value="вентиляция">Вентиляция</MenuItem>
    <MenuItem value="влажность">Влажность</MenuItem>
  </Select>
</FormControl>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={onManualRefresh}
                >
                  Обновить
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper} variant="outlined">
  <Table>
    <TableHead>
      <TableRow>
        <TableCell width="80">№</TableCell>
        <TableCell>Наименование</TableCell>
        <TableCell>Тип параметра</TableCell>
        <TableCell>Статус</TableCell>
        <TableCell>Код параметра</TableCell>
        <TableCell>Местоположение</TableCell>
        <TableCell>Текущее значение</TableCell>
        <TableCell>Последнее обновление</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {equipmentPageDevices.length > 0 ? (
        equipmentPageDevices.map((device, index) => (
          <TableRow
            key={device.id}
            hover
            sx={{
              cursor: "pointer",
              "&:hover": { backgroundColor: "action.hover" },
            }}
            onClick={() => {
              onNodeClick(device.id);
              onTabChange({} as React.SyntheticEvent, 0);
            }}
          >
            <TableCell>
              {/* Порядковый номер (начинается с 1) */}
              <Typography variant="body2" color="text.secondary">
                {index + 1}
              </Typography>
            </TableCell>
            <TableCell>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: `${getStatusColor(device.status)}.light`,
                    color: `${getStatusColor(device.status)}.dark`,
                  }}
                >
                  {getDeviceIcon(device.description.toLowerCase())}
                </Avatar>
                <Typography variant="body1" fontWeight="medium">
                  {device.name}
                </Typography>
              </Box>
            </TableCell>
            <TableCell>
              <Chip 
                label={device.description} 
                size="small" 
                variant="outlined"
                color={
                  device.description?.toLowerCase().includes("давление") 
                    ? "primary"
                    : device.description?.toLowerCase().includes("температура")
                    ? "error"
                    : "default"
                }
              />
            </TableCell>
            <TableCell>
              <Chip
                icon={getStatusIcon(device.status)}
                label={device.status === "normal" ? "Норма" : device.status === "warning" ? "Внимание" : "Критично"}
                color={getStatusColor(device.status)}
                size="small"
              />
            </TableCell>
            <TableCell>
              <Chip 
                label={device.param} 
                size="small" 
                variant="outlined"
                sx={{ fontFamily: "monospace" }}
              />
            </TableCell>
            <TableCell>
              <Typography variant="body2">
                {device.location}
              </Typography>
            </TableCell>
            <TableCell>
              {device.value !== undefined && device.value !== null && device.value !== "" ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography 
                    variant="body1" 
                    fontWeight="bold"
                    color={
                      parseFloat(device.value.toString()) > 100 ? "error.main" :
                      parseFloat(device.value.toString()) > 80 ? "warning.main" : "success.main"
                    }
                  >
                    {parseFloat(device.value.toString()).toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {device.description?.toLowerCase().includes("давление") 
                      ? "бар"
                      : device.description?.toLowerCase().includes("температура")
                      ? "°C"
                      : "ед."}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  Н/Д
                </Typography>
              )}
            </TableCell>
            <TableCell>
              {device.timestamp ? (
                <Typography variant="caption">
                  {new Date(device.timestamp).toLocaleString("ru-RU")}
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
            {/* Оставьте существующее сообщение о загрузке */}
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
                onPageChange={onEquipmentPageChange}
                onRowsPerPageChange={onEquipmentRowsPerPageChange}
                disabled={loading}
              />
            )}
          </Paper>
        </TabPanel>

        {/* Вкладка Расписание обслуживания */}
        <TabPanel value={currentTab} index={2}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
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
                  onClick={onManualRefresh}
                  disabled={tasksLoading}
                >
                  Обновить
                </Button>
              </Box>
            </Box>

            {allTasks.length === 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6, textAlign: "center" }}>
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
                      onClick={onManualRefresh}
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

                {/* Пагинация расписания обслуживания */}
                <ReportPagination
                  page={tasksPage}
                  rowsPerPage={tasksRowsPerPage}
                  totalRows={tasksTotalCount}
                  onPageChange={onTasksPageChange}
                  onRowsPerPageChange={onTasksRowsPerPageChange}
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
        onClose={onCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={onCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};