import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  Assessment,
  Download,
  Summarize,
  Dns,
  TrendingUp,
  History,
  PictureAsPdf,
  TableChart,
  Print,
  ShowChart,
  InsertChart,
  CalendarMonth,
  DateRange,
} from "@mui/icons-material";

// Вспомогательная функция для скачивания файла из base64 данных
const downloadBase64File = (base64Data: string, filename: string): boolean => {
  try {
    // Убираем возможный data: префикс
    let cleanBase64 = base64Data;
    if (cleanBase64.includes('base64,')) {
      cleanBase64 = cleanBase64.split('base64,')[1];
    }

    // Проверяем валидность base64
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanBase64)) {
      console.error('Некорректный формат base64 данных');
      return false;
    }

    // Декодируем base64
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Создаем blob
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // Скачиваем файл
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);

    console.log(`✅ Файл "${filename}" скачан (${blob.size} байт)`);
    return true;
  } catch (error) {
    console.error('Ошибка при обработке base64 данных:', error);
    return false;
  }
};

// Универсальная функция для генерации отчета
const generateReport = async (
  endpoint: string,
  params: any[] = [],
  defaultFilename: string,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  setSuccess: (success: string | null) => void,
  setReportDialogOpen?: (open: boolean) => void
): Promise<void> => {
  setLoading(true);
  setError(null);

  try {
    console.log(`🔄 Генерация отчета через ${endpoint}...`);

    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Требуется авторизация. Пожалуйста, войдите в систему.');
    }

    // Отправляем запрос
    const response = await fetch(
      `/rest/v1/contexts/users.admin.models.workerMS/functions/${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      }
    );

    console.log(`✅ Статус ответа: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}. ${errorText}`);
    }

    // Получаем и парсим ответ
    const result = await response.json();
    console.log('📋 Ответ сервера:', result);

    // Проверяем структуру ответа
    if (!Array.isArray(result) || !result[0] || !result[0].value) {
      throw new Error('Неверный формат ответа сервера');
    }

    // Парсим вложенный JSON
    const fileInfo = JSON.parse(result[0].value);
    console.log('📦 Информация о файле:', {
      id: fileInfo.id,
      name: fileInfo.name,
      hasData: !!fileInfo.data,
      dataLength: fileInfo.data ? fileInfo.data.length : 0
    });

    if (!fileInfo.data) {
      throw new Error('Нет данных файла в ответе сервера');
    }

    // Формируем имя файла
    const filename = fileInfo.name || `${defaultFilename}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Скачиваем файл
    const downloadSuccess = downloadBase64File(fileInfo.data, filename);

    if (downloadSuccess) {
      const successMessage = `Отчет "${filename}" успешно сгенерирован и скачан`;
      setSuccess(successMessage);
      if (setReportDialogOpen) {
        setReportDialogOpen(false);
      }
    } else {
      throw new Error('Не удалось сохранить файл');
    }

  } catch (err: any) {
    console.error('❌ Ошибка генерации отчета:', err);
    setError(err.message || 'Не удалось сгенерировать отчет');
  } finally {
    setLoading(false);
  }
};

export const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState<
    "orders" | "devices" | "kpi" | null
  >(null);
  const [reportPeriod, setReportPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Функция для генерации отчета по заявкам
  const generateOrdersReport = async () => {
    await generateReport(
      'reportForOrdersXlsxF',
      [],
      'orders_report',
      setLoading,
      setError,
      setSuccess,
      setReportDialogOpen
    );
  };

  // Функция для генерации отчета по оборудованию
  const generateDevicesReport = async () => {
    await generateReport(
      'reportForDevicesXlsxF',
      [],
      'devices_report',
      setLoading,
      setError,
      setSuccess,
      setReportDialogOpen
    );
  };

  // Функция для генерации KPI отчета
  const generateKPIReport = async () => {
    // Подготавливаем параметры для KPI отчета
    const params = [];
    
    if (startDate || endDate) {
      const kpiParams: any = {};
      if (startDate) kpiParams.startDate = startDate;
      if (endDate) kpiParams.endDate = endDate;
      params.push(kpiParams);
    }

    await generateReport(
      'reportForKpiXlsxF',
      params,
      'kpi_report',
      setLoading,
      setError,
      setSuccess,
      setReportDialogOpen
    );
  };

  // Обработчик создания отчета
  const handleGenerateReport = () => {
    if (!reportType) return;

    switch (reportType) {
      case "orders":
        generateOrdersReport();
        break;
      case "devices":
        generateDevicesReport();
        break;
      case "kpi":
        generateKPIReport();
        break;
    }
  };

  // Обработчик открытия диалога отчета
  const handleOpenReportDialog = (type: "orders" | "devices" | "kpi") => {
    setReportType(type);
    setError(null);
    setSuccess(null);

    // Устанавливаем даты по умолчанию только для KPI отчета
    if (type === "kpi") {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      setStartDate(formatDateForInput(firstDay));
      setEndDate(formatDateForInput(lastDay));
      setReportPeriod("month");
    } else {
      // Для других отчетов даты не нужны
      setStartDate("");
      setEndDate("");
      setReportPeriod("month");
    }

    setReportDialogOpen(true);
  };

  // Форматирование даты для input type="date"
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Обработчик изменения периода
  const handlePeriodChange = (period: string) => {
    setReportPeriod(period);

    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (period) {
      case "week":
        start.setDate(now.getDate() - 7);
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case "custom":
        // Для произвольного периода не меняем даты
        return;
    }

    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
  };

  // История отчетов
  const reports: any[] = [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Уведомления */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSuccess(null)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Assessment sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h4">Отчеты и аналитика</Typography>
            <Typography variant="body1" color="text.secondary">
              Генерация и скачивание отчетов в формате Excel
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Карточка отчета по заявкам */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Summarize sx={{ fontSize: 40, color: "primary.main" }} />
                <Box>
                  <Typography variant="h6">Отчет по заявкам</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Статистика по заявкам на обслуживание за весь период
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                sx={{ mt: "auto" }}
                startIcon={
                  loading && reportType === "orders" ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Assessment />
                  )
                }
                onClick={() => handleOpenReportDialog("orders")}
                disabled={loading}
              >
                {loading && reportType === "orders"
                  ? "Генерация..."
                  : "Создать отчет"}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Карточка отчета по оборудованию */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Dns sx={{ fontSize: 40, color: "primary.main" }} />
                <Box>
                  <Typography variant="h6">Отчет по оборудованию</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Анализ работоспособности и статистика оборудования
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                sx={{ mt: "auto" }}
                startIcon={
                  loading && reportType === "devices" ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Assessment />
                  )
                }
                onClick={() => handleOpenReportDialog("devices")}
                disabled={loading}
              >
                {loading && reportType === "devices"
                  ? "Генерация..."
                  : "Создать отчет"}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Карточка KPI отчета */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <TrendingUp sx={{ fontSize: 40, color: "primary.main" }} />
                <Box>
                  <Typography variant="h6">KPI отчет</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ключевые показатели эффективности за выбранный период
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                sx={{ mt: "auto" }}
                startIcon={
                  loading && reportType === "kpi" ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Assessment />
                  )
                }
                onClick={() => handleOpenReportDialog("kpi")}
                disabled={loading}
              >
                {loading && reportType === "kpi"
                  ? "Генерация..."
                  : "Создать отчет"}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Диалог генерации отчета */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => !loading && setReportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarMonth color="primary" />
            <Typography variant="h6">
              {reportType === "orders" && "Отчет по заявкам"}
              {reportType === "devices" && "Отчет по оборудованию"}
              {reportType === "kpi" && "KPI отчет"}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            {reportType === "kpi" ? (
              <>
                <FormControl fullWidth>
                  <InputLabel>Период отчета</InputLabel>
                  <Select
                    value={reportPeriod}
                    label="Период отчета"
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="week">Неделя</MenuItem>
                    <MenuItem value="month">Месяц</MenuItem>
                    <MenuItem value="quarter">Квартал</MenuItem>
                    <MenuItem value="year">Год</MenuItem>
                    <MenuItem value="custom">Произвольный период</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <DateRange color="action" />
                  <TextField
                    label="Начальная дата"
                    type="date"
                    fullWidth
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setReportPeriod("custom");
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    disabled={loading}
                  />
                  <TextField
                    label="Конечная дата"
                    type="date"
                    fullWidth
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setReportPeriod("custom");
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    disabled={loading}
                  />
                </Box>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Отчет будет сгенерирован за весь период. Дополнительные параметры не требуются.
              </Typography>
            )}

            <Typography variant="body2" color="text.secondary">
              {reportType === "kpi" 
                ? "Отчет будет сгенерирован в формате Excel за указанный период и автоматически скачан."
                : "Отчет будет сгенерирован в формате Excel и автоматически скачан."}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mt: 1 }}>
                {success}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setReportDialogOpen(false)} 
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            onClick={handleGenerateReport}
            variant="contained"
            disabled={loading || (reportType === "kpi" && (!startDate || !endDate))}
            startIcon={
              loading ? <CircularProgress size={20} color="inherit" /> : null
            }
          >
            {loading ? "Генерация..." : "Сгенерировать отчет"}
          </Button>
        </DialogActions>
      </Dialog>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <History sx={{ fontSize: 28, color: "primary.main" }} />
          <Typography variant="h6">История отчетов</Typography>
        </Box>

        {reports.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              История отчетов будет отображаться здесь после их генерации
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Download />}
              sx={{ mt: 2 }}
              onClick={() => handleOpenReportDialog("orders")}
            >
              Создать первый отчет
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "action.hover" }}>
                  <TableCell>
                    <strong>Название отчета</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Тип</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Период</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Дата создания</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Размер</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Действия</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow
                    key={report.id}
                    sx={{
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    <TableCell>{report.name}</TableCell>
                    <TableCell>{report.type}</TableCell>
                    <TableCell>{report.period}</TableCell>
                    <TableCell>{report.created}</TableCell>
                    <TableCell>{report.size}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Download />}
                      >
                        Скачать
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            mt: 3,
            pt: 2,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Button 
            variant="outlined" 
            startIcon={<PictureAsPdf />}
            onClick={() => alert("Функция сохранения в PDF будет доступна позже")}
          >
            Сохранить в PDF
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<TableChart />}
            onClick={() => alert("Функция сохранения в XLS будет доступна позже")}
          >
            Сохранить в XLS
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Print />}
            onClick={() => window.print()}
          >
            Печать
          </Button>
        </Box>
      </Paper>

      {/* Информация о системе */}
      <Paper sx={{ p: 2, mt: 3, backgroundColor: "grey.50" }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Информация о системе отчетности
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2">
              <strong>Формат отчетов:</strong> Excel (.xlsx)
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2">
              <strong>Кодировка данных:</strong> Base64
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2">
              <strong>Автоматическое скачивание:</strong> Да
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};