// components/cctv/CCTVSystemPageView.tsx
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
  Visibility,
  Assignment,
  TrendingUp,
  TrendingDown,
  ArrowUpward,
  ArrowDownward,
} from "@mui/icons-material";
import { ReportPagination } from "../reports/Pagination";
import { CCTVChart } from "./CCTVChart";
import { CCTVDevice, CCTVDataPoint, CCTVMaintenanceTask } from "../../types/cctv";

// Интерфейс пропсов
interface CCTVSystemPageViewProps {
  // Состояния
  chartData: CCTVDataPoint[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdate: string;
  currentTab: number;
  selectedNode: string;
  pollingActive: boolean;
  selectedEquipmentType: string;
  devices: CCTVDevice[];
  filteredDevices: CCTVDevice[];
  wsConnected: boolean;
  equipmentTotalCount: number;
  allTasks: CCTVMaintenanceTask[];
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
  paginatedDevices: CCTVDevice[];
  equipmentPageDevices: CCTVDevice[];
  paginatedTasks: CCTVMaintenanceTask[];
  tasksTotalCount: number;
  selectedDevice?: CCTVDevice;

  // Обработчики
  onManualRefresh: () => void;
  onNodeClick: (nodeId: string) => void;
  onAlarmClick: () => void;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  onCloseSnackbar: () => void;
  onEquipmentTypeChange: (event: SelectChangeEvent) => void;
  onPollingChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSchemePageChange: (newPage: number) => void;
  onEquipmentPageChange: (newPage: number) => void;
  onEquipmentRowsPerPageChange: (newRowsPerPage: number) => void;
  onTasksPageChange: (newPage: number) => void;
  onTasksRowsPerPageChange: (newRowsPerPage: number) => void;
  onRefreshChart: () => void;

  // Вспомогательные функции
  getStatusColor: (status: string) => "success" | "warning" | "error" | "default";
  getStatusIcon: (status: string) => React.ReactElement;
  getDeviceIcon: (type: string) => React.ReactNode;
  getTaskStatusInfo: (action: string) => { 
    label: string; 
    color: "success" | "info" | "warning" | "error" | "default" | "primary"; 
  };
  formatDeviceValue: (device: CCTVDevice) => string;
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

export const CCTVSystemPageView: React.FC<CCTVSystemPageViewProps> = ({
  // Состояния
  chartData,
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
  onEquipmentTypeChange,
  onPollingChange,
  onSchemePageChange,
  onEquipmentPageChange,
  onEquipmentRowsPerPageChange,
  onTasksPageChange,
  onTasksRowsPerPageChange,
  onRefreshChart,

  // Вспомогательные функции
  getStatusColor,
  getStatusIcon,
  getDeviceIcon,
  getTaskStatusInfo,
  formatDeviceValue,
}) => {
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
                <Chip
                  label={`${devices.length} устройств`}
                  color="info"
                  size="small"
                  variant="outlined"
                />
                <Typography variant="caption" color="text.secondary">
                  Автообновление: {pollingActive ? 'вкл (10 сек)' : 'выкл'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Последнее обновление: {lastUpdate}
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
                    Схема системы видеонаблюдения
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
                        Нет устройств CCTV для отображения
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
                              <Chip size="small" label={device.status === "normal" ? "Норма" : device.status === "warning" ? "Внимание" : "Критично"} color={getStatusColor(device.status)} sx={{ mt: 1 }} />
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
                          ID: {selectedDevice.param || selectedDevice.id} • Тип: {selectedDevice.type}
                        </Typography>
                        <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                          Текущее значение: {formatDeviceValue(selectedDevice)}
                        </Typography>
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
                            {selectedDevice?.name || "Видеоактивность"} - Мониторинг
                          </Typography>
                          {refreshing && <CircularProgress size={20} />}
                        </Box>
                      }
                      subheader={
                        <Box>
                          <Typography variant="caption">
                            Обновлено: {lastUpdate}
                          </Typography>
                          {chartData.length > 0 && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                              Точек: {chartData.length} • 
                              От {chartData[0]?.timestamp?.substring(11, 19) || 'N/A'} до {chartData[chartData.length - 1]?.timestamp?.substring(11, 19) || 'N/A'}
                            </Typography>
                          )}
                        </Box>
                      }
                      action={
                        <Tooltip title="Обновить график">
                          <IconButton 
                            onClick={onRefreshChart}
                            disabled={refreshing || !selectedDevice?.param}
                          >
                            <Refresh />
                          </IconButton>
                        </Tooltip>
                      }
                    />
                    <CardContent sx={{ flex: 1, p: 2 }}>
                      <Box sx={{ height: "250px", width: "100%" }}>
                        <CCTVChart
                          data={chartData}
                          title={selectedDevice ? `${selectedDevice.name} - активность` : "Видеоактивность"}
                          color="#1976d2"
                          unit={selectedDevice?.param?.startsWith('cam') ? 'fps' : 
                                selectedDevice?.param?.startsWith('sc') ? '%' : 'ед.'}
                          isLoading={refreshing}
                        />
                      </Box>

                      <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="caption" color="text.secondary">
                          Отображается: {chartData.length > 50 ? 50 : chartData.length} из {chartData.length} точек
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {chartData.length > 0 &&
                            `Диапазон: ${Math.min(...chartData.map(d => d.value)).toFixed(1)} - ${Math.max(...chartData.map(d => d.value)).toFixed(1)}`}
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

                          {selectedDevice.currentValue !== undefined && (
                            <Paper
                              sx={{
                                p: 2,
                                mb: 2,
                                bgcolor: "primary.light",
                                color: "primary.contrastText",
                              }}
                            >
                              <Typography variant="subtitle2">
                                Текущее значение
                              </Typography>
                              <Typography
                                variant="h4"
                                sx={{ fontWeight: "bold" }}
                              >
                                {selectedDevice.currentValue.toFixed(2)}
                                {selectedDevice.param?.startsWith('cam') ? 'fps' : 
                                 selectedDevice.param?.startsWith('sc') ? '%' : 'ед.'}
                              </Typography>
                              <Typography variant="caption">
                                {selectedDevice.timestamp ? 
                                  new Date(selectedDevice.timestamp).toLocaleTimeString('ru-RU') : 
                                  'N/A'}
                              </Typography>
                            </Paper>
                          )}

                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Параметр</Typography>
                              <Typography variant="body2">{selectedDevice.param || "Н/Д"}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Текущее значение</Typography>
                              <Typography variant="body2" fontWeight="medium">{formatDeviceValue(selectedDevice)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Группа</Typography>
                              <Typography variant="body2">{selectedDevice.group || "Не указана"}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Статус</Typography>
                              <Typography variant="body2">
                                {selectedDevice.status === "normal" ? "Норма" : 
                                 selectedDevice.status === "warning" ? "Внимание" : 
                                 "Критично"}
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
                            Нажмите на любой элемент схемы для просмотра подробной информации и графика активности
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
                  <Select 
                    value={selectedEquipmentType} 
                    label="Фильтр по типу" 
                    onChange={onEquipmentTypeChange}
                  >
                    <MenuItem value="all">Все типы</MenuItem>
                    <MenuItem value="camera">Камеры</MenuItem>
                    <MenuItem value="recorder">Регистраторы</MenuItem>
                    <MenuItem value="server">Серверы</MenuItem>
                    <MenuItem value="scanner">Сканеры</MenuItem>
                  </Select>
                </FormControl>

                <Button variant="outlined" startIcon={<Refresh />} onClick={onManualRefresh} disabled={loading}>
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
                    <TableCell>Группа</TableCell>
                    <TableCell>Местоположение</TableCell>
                    <TableCell>Последнее обновление</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {equipmentPageDevices.length > 0 ? (
                    equipmentPageDevices.map((device) => (
                      <TableRow 
                        key={device.id} 
                        hover 
                        sx={{ 
                          cursor: "pointer", 
                          "&:hover": { backgroundColor: "action.hover" },
                          backgroundColor: device.id === selectedNode ? "action.selected" : "inherit"
                        }} 
                        onClick={() => {
                          onNodeClick(device.id);
                          onTabChange({} as React.SyntheticEvent, 0);
                        }}
                      >
                        <TableCell><Chip label={device.param || device.id} size="small" variant="outlined" /></TableCell>
                        <TableCell><Typography variant="body1" fontWeight="medium">{device.name}</Typography></TableCell>
                        <TableCell><Chip label={device.type} size="small" variant="outlined" /></TableCell>
                        <TableCell>
                          <Chip 
                            icon={getStatusIcon(device.status)} 
                            label={device.status === "normal" ? "Норма" : device.status === "warning" ? "Внимание" : "Критично"} 
                            color={getStatusColor(device.status)} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell><Typography variant="body2">{formatDeviceValue(device)}</Typography></TableCell>
                        <TableCell>{device.group || "Не указана"}</TableCell>
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
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
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
            <Box sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}>
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
                  onClick={onManualRefresh}
                  disabled={tasksLoading}
                >
                  Обновить
                </Button>
              </Box>
            </Box>

            {allTasks.length === 0 ? (
              <Box sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: 6,
                textAlign: "center",
              }}>
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

                {/* Пагинация задач */}
                {allTasks.length > 0 && (
                  <ReportPagination
                    page={tasksPage}
                    rowsPerPage={tasksRowsPerPage}
                    totalRows={tasksTotalCount}
                    onPageChange={onTasksPageChange}
                    onRowsPerPageChange={onTasksRowsPerPageChange}
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
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
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