// pages/ReportsPage.tsx
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
  RadioGroup,
  Radio,
  FormLabel,
  FormControlLabel,
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
  CalendarMonth,
  DateRange,
} from "@mui/icons-material";

// Импортируем функции генерации отчетов
import { generateXlsxReport } from "../components/reports/CreateReportXlsx";
import { generatePdfReport } from "../components/reports/CreateReportPdf";
// Импортируем компонент пагинации
import { ReportPagination } from "../components/reports/Pagination";

export const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState<
    "orders" | "devices" | "kpi" | null
  >(null);
  const [reportFormat, setReportFormat] = useState<'xlsx' | 'pdf'>('xlsx');
  const [reportPeriod, setReportPeriod] = useState("month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Состояния для пагинации истории отчетов
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // История отчетов (заглушка - в реальном приложении данные будут с сервера)
  const [reports, setReports] = useState<any[]>([
    {
      id: 1,
      name: "Отчет по заявкам - Ноябрь 2024",
      type: "orders",
      period: "Ноябрь 2024",
      created: "01.12.2024 10:30",
      size: "1.2 MB",
      format: "xlsx"
    },
    {
      id: 2,
      name: "Отчет по оборудованию",
      type: "devices",
      period: "Октябрь 2024",
      created: "01.11.2024 14:45",
      size: "2.1 MB",
      format: "pdf"
    },
    {
      id: 3,
      name: "KPI отчет - Q3 2024",
      type: "kpi",
      period: "Июль-Сентябрь 2024",
      created: "01.10.2024 09:15",
      size: "0.8 MB",
      format: "xlsx"
    },
    {
      id: 4,
      name: "Отчет по заявкам - Октябрь 2024",
      type: "orders",
      period: "Октябрь 2024",
      created: "01.11.2024 11:20",
      size: "1.1 MB",
      format: "xlsx"
    },
    {
      id: 5,
      name: "Отчет по оборудованию - Сентябрь 2024",
      type: "devices",
      period: "Сентябрь 2024",
      created: "01.10.2024 16:30",
      size: "1.9 MB",
      format: "pdf"
    },
    {
      id: 6,
      name: "KPI отчет - Август 2024",
      type: "kpi",
      period: "Август 2024",
      created: "01.09.2024 13:10",
      size: "0.9 MB",
      format: "xlsx"
    },
    {
      id: 7,
      name: "Отчет по заявкам - Сентябрь 2024",
      type: "orders",
      period: "Сентябрь 2024",
      created: "01.10.2024 10:00",
      size: "1.0 MB",
      format: "xlsx"
    },
    {
      id: 8,
      name: "Отчет по оборудованию - Август 2024",
      type: "devices",
      period: "Август 2024",
      created: "01.09.2024 15:45",
      size: "2.0 MB",
      format: "pdf"
    },
    {
      id: 9,
      name: "KPI отчет - Июль 2024",
      type: "kpi",
      period: "Июль 2024",
      created: "01.08.2024 12:30",
      size: "0.7 MB",
      format: "xlsx"
    },
    {
      id: 10,
      name: "Отчет по заявкам - Август 2024",
      type: "orders",
      period: "Август 2024",
      created: "01.09.2024 09:45",
      size: "1.1 MB",
      format: "xlsx"
    },
    {
      id: 11,
      name: "Отчет по оборудованию - Июль 2024",
      type: "devices",
      period: "Июль 2024",
      created: "01.08.2024 14:20",
      size: "1.8 MB",
      format: "pdf"
    },
    {
      id: 12,
      name: "KPI отчет - Q2 2024",
      type: "kpi",
      period: "Апрель-Июнь 2024",
      created: "01.07.2024 11:00",
      size: "1.2 MB",
      format: "xlsx"
    }
  ]);

  // Вычисляем индексы для отображаемых данных
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const displayedReports = reports.slice(startIndex, endIndex);

  // Функция для генерации отчета по заявкам
  const generateOrdersReport = async (format: 'xlsx' | 'pdf') => {
    if (format === 'xlsx') {
      await generateXlsxReport({
        endpoint: 'reportForOrdersXlsxF',
        params: [],
        defaultFilename: 'orders_report',
        setLoading,
        setError,
        setSuccess,
        setReportDialogOpen,
      });
    } else {
      await generatePdfReport({
        reportType: 'orders',
        params: [],
        setLoading,
        setError,
        setSuccess,
        setReportDialogOpen,
      });
    }
    
    // После успешной генерации добавляем новый отчет в историю
    if (!error) {
      const newReport = {
        id: reports.length + 1,
        name: `Отчет по заявкам - ${new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}`,
        type: "orders",
        period: new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
        created: new Date().toLocaleString('ru-RU'),
        size: format === 'xlsx' ? "~1.2 MB" : "~0.5 MB",
        format: format
      };
      setReports([newReport, ...reports]);
      setPage(1); // Переходим на первую страницу
    }
  };

  // Функция для генерации отчета по оборудованию
  const generateDevicesReport = async (format: 'xlsx' | 'pdf') => {
    if (format === 'xlsx') {
      await generateXlsxReport({
        endpoint: 'reportForDevicesXlsxF',
        params: [],
        defaultFilename: 'devices_report',
        setLoading,
        setError,
        setSuccess,
        setReportDialogOpen,
      });
    } else {
      await generatePdfReport({
        reportType: 'devices',
        params: [],
        setLoading,
        setError,
        setSuccess,
        setReportDialogOpen,
      });
    }
    
    // После успешной генерации добавляем новый отчет в историю
    if (!error) {
      const newReport = {
        id: reports.length + 1,
        name: `Отчет по оборудованию - ${new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}`,
        type: "devices",
        period: new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
        created: new Date().toLocaleString('ru-RU'),
        size: format === 'xlsx' ? "~2.0 MB" : "~0.8 MB",
        format: format
      };
      setReports([newReport, ...reports]);
      setPage(1); // Переходим на первую страницу
    }
  };

  // Функция для генерации KPI отчета
  const generateKPIReport = async (format: 'xlsx' | 'pdf') => {
    // Подготавливаем параметры для KPI отчета
    const params: any[] = [];
    
    if (startDate || endDate) {
      const kpiParams: any = {};
      if (startDate) kpiParams.startDate = startDate;
      if (endDate) kpiParams.endDate = endDate;
      params.push(kpiParams);
    }

    if (format === 'xlsx') {
      await generateXlsxReport({
        endpoint: 'reportForKPIXlsxF', // Исправлено: было 'reportForKpiXlsxF'
        params,
        defaultFilename: 'kpi_report',
        setLoading,
        setError,
        setSuccess,
        setReportDialogOpen,
      });
    } else {
      await generatePdfReport({
        reportType: 'kpi',
        params,
        setLoading,
        setError,
        setSuccess,
        setReportDialogOpen,
      });
    }
    
    // После успешной генерации добавляем новый отчет в историю
    if (!error) {
      const periodText = reportPeriod === 'custom' 
        ? `${startDate} - ${endDate}`
        : getPeriodText(reportPeriod);
        
      const newReport = {
        id: reports.length + 1,
        name: `KPI отчет - ${periodText}`,
        type: "kpi",
        period: periodText,
        created: new Date().toLocaleString('ru-RU'),
        size: format === 'xlsx' ? "~1.0 MB" : "~0.6 MB",
        format: format
      };
      setReports([newReport, ...reports]);
      setPage(1); // Переходим на первую страницу
    }
  };

  // Функция для получения текста периода
  const getPeriodText = (period: string): string => {
    const now = new Date();
    switch (period) {
      case "week": return "Неделя";
      case "month": return now.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
      case "quarter": return `${Math.floor(now.getMonth() / 3) + 1} квартал ${now.getFullYear()}`;
      case "year": return `Год ${now.getFullYear()}`;
      default: return "Произвольный период";
    }
  };

    
  // Обработчик создания отчета
  const handleGenerateReport = () => {
    if (!reportType) return;

    switch (reportType) {
      case "orders":
        generateOrdersReport(reportFormat);
        break;
      case "devices":
        generateDevicesReport(reportFormat);
        break;
      case "kpi":
        generateKPIReport(reportFormat);
        break;
    }
  };

  // Обработчик открытия диалога отчета
  const handleOpenReportDialog = (type: "orders" | "devices" | "kpi") => {
    setReportType(type);
    setReportFormat('xlsx'); // По умолчанию XLSX
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

  // Функция для получения названия отчета
  const getReportTypeName = (type: string | null): string => {
    switch (type) {
      case "orders":
        return "Отчет по заявкам";
      case "devices":
        return "Отчет по оборудованию";
      case "kpi":
        return "KPI отчет";
      default:
        return "Отчет";
    }
  };

  // Функция для получения названия формата файла
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'xlsx':
        return <TableChart fontSize="small" color="success" />;
      case 'pdf':
        return <PictureAsPdf fontSize="small" color="error" />;
      default:
        return <Assessment fontSize="small" />;
    }
  };

  // Обработчики пагинации
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(1);
  };

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
              Генерация и скачивание отчетов в форматах Excel и PDF
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
              {getReportTypeName(reportType)}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Выбор формата отчета */}
            <FormControl component="fieldset">
              <FormLabel component="legend">Формат отчета</FormLabel>
              <RadioGroup
                row
                value={reportFormat}
                onChange={(e) => setReportFormat(e.target.value as 'xlsx' | 'pdf')}
              >
                <FormControlLabel
                  value="xlsx"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TableChart fontSize="small" />
                      <Typography>Excel (XLSX)</Typography>
                    </Box>
                  }
                  disabled={loading}
                />
                <FormControlLabel
                  value="pdf"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PictureAsPdf fontSize="small" />
                      <Typography>PDF</Typography>
                    </Box>
                  }
                  disabled={loading}
                />
              </RadioGroup>
            </FormControl>

            {/* Описание форматов */}
            <Alert severity="info" variant="outlined">
              <Typography variant="body2">
                {reportFormat === 'xlsx' 
                  ? "Excel-отчет содержит полные данные и может быть использован для дальнейшего анализа. Формируется на сервере."
                  : "PDF-отчет содержит основные данные в удобном для чтения формате. Формируется в браузере."}
              </Typography>
            </Alert>

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
              loading ? <CircularProgress size={20} color="inherit" /> : 
              reportFormat === 'pdf' ? <PictureAsPdf /> : <TableChart />
            }
          >
            {loading ? "Генерация..." : `Сгенерировать в ${reportFormat.toUpperCase()}`}
          </Button>
        </DialogActions>
      </Dialog>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <History sx={{ fontSize: 28, color: "primary.main" }} />
          <Typography variant="h6">История отчетов</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
            Всего: {reports.length} отчетов
          </Typography>
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
          <>
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
                      <strong>Формат</strong>
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
                  {displayedReports.map((report) => (
                    <TableRow
                      key={report.id}
                      sx={{
                        "&:hover": {
                          backgroundColor: "action.hover",
                        },
                      }}
                    >
                      <TableCell>{report.name}</TableCell>
                      <TableCell>{getReportTypeName(report.type)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {getFormatIcon(report.format)}
                          <Typography variant="body2">
                            {report.format.toUpperCase()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{report.period}</TableCell>
                      <TableCell>{report.created}</TableCell>
                      <TableCell>{report.size}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Download />}
                          onClick={() => {
                            // Здесь будет логика скачивания отчета
                            setSuccess(`Отчет "${report.name}" скачивается...`);
                          }}
                        >
                          Скачать
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Пагинация */}
            <ReportPagination
              page={page}
              rowsPerPage={rowsPerPage}
              totalRows={reports.length}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </>
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
            onClick={() => {
              setReportType("orders");
              setReportFormat("pdf");
              setReportDialogOpen(true);
            }}
          >
            Создать PDF отчет
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<TableChart />}
            onClick={() => {
              setReportType("orders");
              setReportFormat("xlsx");
              setReportDialogOpen(true);
            }}
          >
            Создать Excel отчет
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
              <strong>Формат отчетов:</strong> Excel (.xlsx) и PDF
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2">
              <strong>Кодировка данных:</strong> Base64 (Excel), UTF-8 (PDF)
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2">
              <strong>Автоматическое скачивание:</strong> Да
            </Typography>
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Примечание: PDF отчеты формируются в браузере и могут содержать упрощенную версию данных.
          Для получения полных данных используйте формат Excel.
        </Typography>
      </Paper>
    </Box>
  );
};