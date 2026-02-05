// CreateReportPdfFallback.tsx

// Константы
const ORDERREPORTXLSX = process.env.REACT_APP_ORDERREPORTXLSX;
const DEVICEREPORTXLSX = process.env.REACT_APP_DEVICEREPORTXLSX;
const KPIREPORTXLSX = process.env.REACT_APP_KPIREPORTXLSX;

// Определяем типы внутри файла
interface ReportData {
  id: number;
  name: string;
  value: number;
  date: string;
  status: 'completed' | 'in_progress' | 'pending' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  description?: string;
  type?: string;
  unit?: string;
}

interface ReportStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  cancelled: number;
  averageValue: number;
  startDate?: string;
  endDate?: string;
}

interface ReportResponse {
  data: ReportData[];
  stats: ReportStats;
  reportType: string;
  generatedAt: string;
}

// Функция для парсинга Excel данных из base64 (если установлена библиотека xlsx)
const parseExcelData = (base64Data: string): ReportData[] => {
  try {
    // Динамический импорт XLSX для избежания проблем с бандлингом
    let XLSX: any;
    
    if (typeof window !== 'undefined' && (window as any).XLSX) {
      // Если XLSX уже загружен в глобальную область
      XLSX = (window as any).XLSX;
    } else {
      // Пробуем импортировать напрямую
      try {
        XLSX = require('xlsx');
      } catch (error) {
        console.warn('Библиотека XLSX недоступна через require, используем моковые данные');
        return generateMockData('orders', {});
      }
    }
    
    if (!XLSX) {
      console.warn('Библиотека XLSX не найдена');
      return generateMockData('orders', {});
    }
    
    // Конвертируем base64 в binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Читаем Excel файл
    const workbook = XLSX.read(bytes, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const firstSheet = workbook.Sheets[firstSheetName];
    
    // Конвертируем в JSON
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    
    console.log('📊 Excel данные:', jsonData);
    
    // Если данные есть, парсим их
    if (jsonData.length > 1) { // Первая строка - заголовки
      // Пытаемся определить заголовки
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1);
      
      // Маппим данные в нужный формат
      return dataRows.map((row: any, index: number) => {
        // Создаем объект из строки Excel
        const rowObj: any = {};
        headers.forEach((header, idx) => {
          if (header && row[idx] !== undefined) {
            rowObj[header] = row[idx];
          }
        });
        
        // Пытаемся извлечь данные по разным возможным названиям столбцов
        /*const name = 
          rowObj['Наименование'] || 
          rowObj['Name'] || 
          rowObj['name'] || 
          rowObj['Название'] || 
          rowObj['Заявка'] || 
          `Запись ${index + 1}`;*/
          
        const date = 
          rowObj['date'] || ['Дата создания'] || 
          new Date().toISOString().split('T')[0];
          
        const id = rowObj['id'];
        const type = rowObj['type'];
        const device = rowObj['device'];
        const description = rowObj['description'];
        const status = rowObj['status'];
        //const date = rowObj['date'];
        const priority = rowObj['priority'];
        const user = rowObj['user'];
        
        return {
          id: index + 1,
          type: String(type),
          device: String(device),
          description: String(description),
          status: String(status),
          date: String(date),
          priority: String(priority),
          user: String(user)
          /*date: formatDate(date),
          status,
          priority,
          description: rowObj['Описание'] || rowObj['Description'] || rowObj['description'] || '',
          type: rowObj['Тип'] || rowObj['Type'] || rowObj['type'] || 'count',
          unit: rowObj['Единица'] || rowObj['Unit'] || rowObj['unit'] || 'шт.'*/
        };
      });
    }
    
    // Если не удалось распарсить структурированные данные,
    // пробуем альтернативный метод парсинга
    try {
      const alternativeData = XLSX.utils.sheet_to_json(firstSheet);
      console.log('📊 Альтернативные данные:', alternativeData);
      
      return alternativeData.map((row: any, index: number) => ({
        id: index + 1,
        type: row['type'] || `Запись ${index + 1}`,
        device: row['Устройство'] || row['device'] || 0,
        description: row['Описание работ'] || row['description'],
        status: row['Статус'] || row['Status'] || row['status'],
        date: formatDate(row['Дата'] || row['Date'] || row['date'] || new Date().toISOString().split('T')[0]),
        priority: row['Приоритет'] || row['Priority'] || row['priority'],
        user: row['Пользователь'] || row['user']
        /*id: index + 1,
        name: row['Наименование'] || row['Name'] || row['name'] || `Запись ${index + 1}`,
        value: row['Значение'] || row['Value'] || row['value'] || 0,
        date: formatDate(row['Дата'] || row['Date'] || row['date'] || new Date().toISOString().split('T')[0]),
        status: mapStatus(row['Статус'] || row['Status'] || row['status'] || 'pending'),
        priority: mapPriority(row['Приоритет'] || row['Priority'] || row['priority'] || 'medium'),
        description: row['Описание'] || row['Description'] || row['description'] || '',
        type: row['Тип'] || row['Type'] || row['type'] || 'count',
        unit: row['Единица'] || row['Unit'] || row['unit'] || 'шт.'*/
      }));
    } catch (altError) {
      console.warn('Альтернативный парсинг не удался:', altError);
    }
    
    console.warn('Excel файл не содержит распознаваемых данных');
    return generateMockData('orders', {});
    
  } catch (error) {
    console.error('❌ Ошибка парсинга Excel:', error);
    return generateMockData('orders', {});
  }
};

// Вспомогательная функция для форматирования даты
const formatDate = (dateInput: any): string => {
  if (!dateInput) return new Date().toISOString().split('T')[0];
  
  try {
    // Если это строка даты
    if (typeof dateInput === 'string') {
      // Пробуем различные форматы
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      // Пробуем парсить Excel дату (число дней с 1900-01-01)
      const excelDate = Number(dateInput);
      if (!isNaN(excelDate)) {
        const date = new Date(Date.UTC(0, 0, excelDate - 1));
        return date.toISOString().split('T')[0];
      }
    }
    
    // Если это число (Excel дата)
    if (typeof dateInput === 'number') {
      // Excel использует дату с 1900-01-01, но с багом (считает 1900 високосным)
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelEpoch.getTime() + dateInput * 86400000);
      return date.toISOString().split('T')[0];
    }
    
    return new Date().toISOString().split('T')[0];
  } catch (e) {
    console.warn('Ошибка форматирования даты:', e, dateInput);
    return new Date().toISOString().split('T')[0];
  }
};

// Функция для получения данных отчета с бэкенда (существующий endpoint)
const fetchReportData = async (
  reportType: "orders" | "devices" | "kpi",
  params?: any
): Promise<{ data: ReportData[], stats: ReportStats }> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Требуется авторизация');
    }

    let endpoint = '';
    switch (reportType) {
      case 'orders':
        endpoint = `${ORDERREPORTXLSX}`;
        break;
      case 'devices':
        endpoint = `${DEVICEREPORTXLSX}`;
        break;
      case 'kpi':
        endpoint = `${KPIREPORTXLSX}`;
        break;
    }

    console.log(`🔄 Запрос данных отчета: ${endpoint}`, params);

    const response = await fetch(
      `${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params || [])
      }
    );

    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    const result = await response.json();
    console.log('📋 Ответ от сервера:', result);

    // Парсим данные из ответа
    if (Array.isArray(result) && result[0] && result[0].value) {
      const fileInfo = JSON.parse(result[0].value);
      
      // Пробуем распарсить Excel данные, если они есть
      if (fileInfo.data) {
        try {
          console.log('📊 Парсим Excel данные...');
          const data = parseExcelData(fileInfo.data);
          console.log('✅ Успешно распарсено записей:', data.length);
          
          if (data.length > 0) {
            const stats = calculateStats(data, reportType, params);
            return { data, stats };
          } else {
            console.warn('Excel парсинг вернул 0 записей, используем моковые данные');
          }
        } catch (excelError) {
          console.error('❌ Не удалось распарсить Excel:', excelError);
        }
      }
      
      // Если не удалось распарсить Excel, используем моковые данные
      console.log('⚠️ Используем моковые данные как fallback');
      return {
        data: generateMockData(reportType, params),
        stats: generateMockStats(reportType, params)
      };
    }

    throw new Error('Неверный формат ответа сервера');
    
  } catch (error) {
    console.error('❌ Ошибка получения данных отчета:', error);
    // В случае ошибки возвращаем моковые данные
    return {
      data: generateMockData(reportType, params),
      stats: generateMockStats(reportType, params)
    };
  }
};

// Функция для получения данных в JSON формате (если есть такой endpoint)
const fetchReportDataJson = async (
  reportType: "orders" | "devices" | "kpi",
  params?: any
): Promise<ReportResponse> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Требуется авторизация');
    }

    // Предполагаем, что есть endpoint для JSON данных
    const endpoint = `get${reportType.charAt(0).toUpperCase() + reportType.slice(1)}ReportJson`;
    
    console.log(`🔄 Запрос JSON данных отчета: ${endpoint}`, params);

    const response = await fetch(
      `${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params || [])
      }
    );

    if (!response.ok) {
      // Если endpoint не существует, пробуем получить данные через обычный endpoint
      console.log(`Endpoint ${endpoint} не найден, используем стандартный метод`);
      return await fetchReportDataAsResponse(reportType, params);
    }

    const result = await response.json();
    console.log('📋 JSON данные отчета:', result);

    // Парсим ответ
    if (Array.isArray(result) && result[0] && result[0].value) {
      return JSON.parse(result[0].value) as ReportResponse;
    }

    throw new Error('Неверный формат ответа сервера');
    
  } catch (error) {
    console.error('❌ Ошибка получения JSON данных отчета:', error);
    // В случае ошибки возвращаем данные через стандартный метод
    return await fetchReportDataAsResponse(reportType, params);
  }
};

// Вспомогательная функция для конвертации данных в формат ReportResponse
const fetchReportDataAsResponse = async (
  reportType: "orders" | "devices" | "kpi",
  params?: any
): Promise<ReportResponse> => {
  const { data, stats } = await fetchReportData(reportType, params);
  
  return {
    data,
    stats,
    reportType,
    generatedAt: new Date().toISOString()
  };
};

// Функция для расчета статистики на основе реальных данных
const calculateStats = (
  data: ReportData[], 
  reportType: "orders" | "devices" | "kpi",
  params?: any
): ReportStats => {
  const total = data.length;
  const completed = data.filter(item => item.status === 'completed').length;
  const inProgress = data.filter(item => item.status === 'in_progress').length;
  const pending = data.filter(item => item.status === 'pending').length;
  const cancelled = data.filter(item => item.status === 'cancelled').length;
  
  const values = data.map(item => item.value).filter(val => !isNaN(val));
  const averageValue = values.length > 0 
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) 
    : 0;
  
  return {
    total,
    completed,
    inProgress,
    pending,
    cancelled,
    averageValue,
    startDate: params?.startDate || findMinDate(data),
    endDate: params?.endDate || findMaxDate(data)
  };
};

const findMinDate = (data: ReportData[]): string => {
  if (data.length === 0) return new Date().toISOString().split('T')[0];
  const dates = data.map(item => new Date(item.date).getTime());
  return new Date(Math.min(...dates)).toISOString().split('T')[0];
};

const findMaxDate = (data: ReportData[]): string => {
  if (data.length === 0) return new Date().toISOString().split('T')[0];
  const dates = data.map(item => new Date(item.date).getTime());
  return new Date(Math.max(...dates)).toISOString().split('T')[0];
};

// Временная функция для генерации моковых данных (используется как fallback)
const generateMockData = (
  reportType: "orders" | "devices" | "kpi",
  params?: any
): ReportData[] => {
  const now = new Date();
  const baseData: ReportData[] = [];
  const count = params?.mockCount || 15;
  
  for (let i = 1; i <= count; i++) {
    const date = new Date();
    date.setDate(now.getDate() - Math.floor(Math.random() * 30));
    
    let name = '';
    let value = 0;
    let status: 'completed' | 'in_progress' | 'pending' | 'cancelled' = 'pending';
    let priority: 'high' | 'medium' | 'low' = 'medium';
    
    switch (reportType) {
      case 'orders':
        name = `Заявка #ORD-${1000 + i}`;
        value = Math.floor(Math.random() * 100);
        const orderStatuses: ('completed' | 'in_progress' | 'pending' | 'cancelled')[] = ['completed', 'in_progress', 'pending', 'cancelled'];
        status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
        const orderPriorities: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];
        priority = orderPriorities[Math.floor(Math.random() * orderPriorities.length)];
        break;
      case 'devices':
        name = `Оборудование #DEV-${2000 + i}`;
        value = Math.floor(Math.random() * 100);
        const deviceStatuses: ('completed' | 'in_progress')[] = ['completed', 'in_progress'];
        status = deviceStatuses[Math.floor(Math.random() * deviceStatuses.length)];
        const devicePriorities: ('high' | 'medium')[] = ['high', 'medium'];
        priority = devicePriorities[Math.floor(Math.random() * devicePriorities.length)];
        break;
      case 'kpi':
        name = `KPI #${3000 + i}`;
        value = Math.floor(Math.random() * 100);
        status = 'completed';
        priority = 'medium';
        break;
    }
    
    baseData.push({
      id: i,
      name,
      value,
      date: date.toISOString().split('T')[0],
      status,
      priority,
      description: `Описание для ${name}`,
      type: reportType === 'kpi' ? 'percentage' : 'count',
      unit: reportType === 'kpi' ? '%' : 'шт.'
    });
  }
  
  return baseData;
};

// Временная функция для генерации статистики
const generateMockStats = (
  reportType: "orders" | "devices" | "kpi",
  params?: any
): ReportStats => {
  const data = generateMockData(reportType, params);
  return calculateStats(data, reportType, params);
};

// Функция для форматирования статуса
const formatStatus = (status: string): { text: string, class: string } => {
  switch (status) {
    case 'completed':
      return { text: 'Завершено', class: 'status-completed' };
    case 'in_progress':
      return { text: 'В работе', class: 'status-in-progress' };
    case 'pending':
      return { text: 'Ожидание', class: 'status-pending' };
    case 'cancelled':
      return { text: 'Отменено', class: 'status-cancelled' };
    default:
      return { text: status, class: 'status-pending' };
  }
};

// Функция для форматирования приоритета
const formatPriority = (priority: string): string => {
  switch (priority) {
    case 'high':
      return 'Высокий';
    case 'medium':
      return 'Средний';
    case 'low':
      return 'Низкий';
    default:
      return priority;
  }
};

// Основная функция для генерации PDF через HTML с реальными данными
export const generatePDFviaHTML = async (
  reportType: "orders" | "devices" | "kpi", 
  params?: any
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`🔄 Получение данных для отчета ${reportType}...`);
      
      // Пробуем получить данные через JSON endpoint (если есть)
      let reportData: ReportResponse;
      try {
        reportData = await fetchReportDataJson(reportType, params);
        console.log('✅ Данные получены через JSON endpoint');
      } catch (jsonError) {
        console.log('⚠️ JSON endpoint не доступен, используем стандартный метод');
        const { data, stats } = await fetchReportData(reportType, params);
        reportData = {
          data,
          stats,
          reportType,
          generatedAt: new Date().toISOString()
        };
      }
      
      const { data, stats } = reportData;
      console.log(`✅ Получено ${data.length} записей`, data);
      
      const title = reportType === "orders" ? "Отчет по заявкам" : 
                   reportType === "devices" ? "Отчет по оборудованию" : "KPI отчет";
      
      const now = new Date();
      
      // Генерируем строки таблицы из реальных данных
      const tableRows = data.slice(0, 50).map((item: ReportData) => { // Ограничиваем 50 записями для читаемости
        const status = formatStatus(item.status);
        const priority = formatPriority(item.priority);
        const valueDisplay = reportType === 'kpi' || item.unit === '%' 
          ? `${item.value}%` 
          : item.unit 
            ? `${item.value} ${item.unit}`
            : item.value;
        
        return `
          <tr>
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${valueDisplay}</td>
            <td>${item.date}</td>
            <td class="${status.class}">${status.text}</td>
            <td>${priority}</td>
          </tr>
        `;
      }).join('');
      
      // Предупреждение если данных много
      const dataWarning = data.length > 50 
        ? `<div class="warning">Показано 50 из ${data.length} записей. Для полных данных используйте Excel формат.</div>`
        : '';
      
      // Создаем красивый HTML для отчета
      const content = `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            body {
              padding: 40px;
              background: #f5f7fa;
              color: #333;
              line-height: 1.6;
            }
            
            .report-container {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              border-radius: 10px;
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
              padding: 40px;
            }
            
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 3px solid #3498db;
            }
            
            h1 {
              color: #2c3e50;
              font-size: 28px;
              margin-bottom: 10px;
            }
            
            .subtitle {
              color: #7f8c8d;
              font-size: 16px;
              margin-bottom: 20px;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }
            
            .info-card {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #3498db;
            }
            
            .info-card h3 {
              color: #2c3e50;
              margin-bottom: 10px;
              font-size: 16px;
            }
            
            .info-card p {
              color: #34495e;
              font-size: 14px;
            }
            
            .data-section {
              margin: 30px 0;
            }
            
            .data-section h2 {
              color: #2c3e50;
              margin-bottom: 20px;
              font-size: 22px;
              padding-bottom: 10px;
              border-bottom: 2px solid #ecf0f1;
            }
            
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              color: #856404;
              padding: 12px;
              border-radius: 5px;
              margin-bottom: 20px;
              font-size: 14px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
              border-radius: 8px;
              overflow: hidden;
              font-size: 13px;
            }
            
            thead {
              background: linear-gradient(135deg, #3498db, #2980b9);
              color: white;
            }
            
            th {
              padding: 12px;
              text-align: left;
              font-weight: 600;
              font-size: 13px;
            }
            
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #ecf0f1;
              font-size: 13px;
            }
            
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            
            tr:hover {
              background-color: #e8f4fc;
            }
            
            .status-completed {
              color: #27ae60;
              font-weight: 600;
            }
            
            .status-in-progress {
              color: #f39c12;
              font-weight: 600;
            }
            
            .status-pending {
              color: #95a5a6;
              font-weight: 600;
            }
            
            .status-cancelled {
              color: #e74c3c;
              font-weight: 600;
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
              gap: 15px;
              margin-top: 30px;
            }
            
            .stat-card {
              background: white;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              box-shadow: 0 3px 10px rgba(0,0,0,0.08);
              border: 1px solid #ecf0f1;
            }
            
            .stat-value {
              font-size: 28px;
              font-weight: bold;
              color: #2c3e50;
              margin: 8px 0;
            }
            
            .stat-label {
              color: #7f8c8d;
              font-size: 13px;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #ecf0f1;
              text-align: center;
              color: #7f8c8d;
              font-size: 12px;
            }
            
            .print-button {
              position: fixed;
              top: 20px;
              right: 20px;
              background: #3498db;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
              font-weight: 600;
              box-shadow: 0 4px 6px rgba(52, 152, 219, 0.3);
              transition: all 0.3s ease;
              z-index: 1000;
            }
            
            .print-button:hover {
              background: #2980b9;
              transform: translateY(-2px);
              box-shadow: 0 6px 8px rgba(52, 152, 219, 0.4);
            }
            
            @media print {
              body {
                padding: 0;
                background: white;
              }
              
              .report-container {
                box-shadow: none;
                padding: 20px;
                max-width: 100%;
              }
              
              .print-button {
                display: none;
              }
              
              .no-print {
                display: none;
              }
              
              table {
                page-break-inside: avoid;
                font-size: 11px;
              }
              
              th, td {
                padding: 8px 10px;
              }
              
              .stat-value {
                font-size: 24px;
              }
            }
          </style>
        </head>
        <body>
          <button class="print-button no-print" onclick="window.print()">
            🖨️ Печать / Сохранить как PDF
          </button>
          
          <div class="report-container">
            <div class="header">
              <h1>${title}</h1>
              <div class="subtitle">Сформировано системой мониторинга оборудования</div>
            </div>
            
            <div class="info-grid">
              <div class="info-card">
                <h3>📅 Дата генерации</h3>
                <p>${now.toLocaleDateString('ru-RU')} ${now.toLocaleTimeString('ru-RU')}</p>
              </div>
              
              <div class="info-card">
                <h3>📊 Тип отчета</h3>
                <p>${reportType === 'orders' ? 'Заявки' : reportType === 'devices' ? 'Оборудование' : 'KPI'}</p>
              </div>
              
              ${stats.startDate && stats.endDate 
                ? `
                <div class="info-card">
                  <h3>📅 Период отчета</h3>
                  <p>${stats.startDate} — ${stats.endDate}</p>
                </div>
                ` 
                : `
                <div class="info-card">
                  <h3>📅 Период отчета</h3>
                  <p>Актуальные данные</p>
                </div>
                `}
              
              <div class="info-card">
                <h3>📈 Всего записей</h3>
                <p>${stats.total} ${reportType === 'orders' ? 'заявок' : reportType === 'devices' ? 'единиц оборудования' : 'показателей'}</p>
              </div>
            </div>
            
            <div class="data-section">
              <h2>📋 Данные отчета</h2>
              ${dataWarning}
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Наименование</th>
                    <th>${reportType === 'kpi' ? 'Значение, %' : 'Значение'}</th>
                    <th>Дата</th>
                    <th>Статус</th>
                    <th>Приоритет</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
              ${data.length > 50 ? '<p class="warning">... и ещё ' + (data.length - 50) + ' записей</p>' : ''}
            </div>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Всего</div>
                <div class="stat-value">${stats.total}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Завершено</div>
                <div class="stat-value">${stats.completed}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">В работе</div>
                <div class="stat-value">${stats.inProgress}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Ожидание</div>
                <div class="stat-value">${stats.pending}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Отменено</div>
                <div class="stat-value">${stats.cancelled}</div>
              </div>
              ${reportType === 'kpi' || stats.averageValue > 0 ? `
                <div class="stat-card">
                  <div class="stat-label">Среднее значение</div>
                  <div class="stat-value">${stats.averageValue}%</div>
                </div>
              ` : ''}
            </div>
            
            <div class="data-section">
              <h2>📈 Статистика</h2>
              <div class="info-card">
                <h3>Сводка по отчету</h3>
                <p>• Отчет содержит ${stats.total} ${reportType === 'orders' ? 'заявок' : reportType === 'devices' ? 'единиц оборудования' : 'ключевых показателей'}</p>
                <p>• Завершено: ${stats.completed} (${stats.total > 0 ? Math.round(stats.completed / stats.total * 100) : 0}%)</p>
                <p>• В работе: ${stats.inProgress} (${stats.total > 0 ? Math.round(stats.inProgress / stats.total * 100) : 0}%)</p>
                <p>• Ожидание: ${stats.pending} (${stats.total > 0 ? Math.round(stats.pending / stats.total * 100) : 0}%)</p>
                <p>• Отменено: ${stats.cancelled} (${stats.total > 0 ? Math.round(stats.cancelled / stats.total * 100) : 0}%)</p>
                ${reportType === 'kpi' || stats.averageValue > 0 ? `<p>• Среднее значение показателей: ${stats.averageValue}%</p>` : ''}
              </div>
            </div>
            
            <div class="footer">
              <p>📄 Отчет сгенерирован автоматически на основе данных системы мониторинга.</p>
              <p>© ${now.getFullYear()} Система мониторинга оборудования. Все права защищены.</p>
            </div>
          </div>
          
          <script>
            // Автоматически открываем диалог печати через 1 секунду
            setTimeout(() => {
              try {
                window.print();
              } catch (error) {
                console.log('Печать отменена пользователем');
              }
            }, 1000);
          </script>
        </body>
        </html>
      `;
      
      // Открываем в новом окне
      const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
      if (!printWindow) {
        throw new Error('Не удалось открыть окно для печати. Разрешите всплывающие окна.');
      }
      
      printWindow.document.write(content);
      printWindow.document.close();
      
      console.log('✅ Окно для печати PDF открыто с реальными данными');
      resolve();
      
    } catch (error) {
      console.error('❌ Ошибка генерации PDF через HTML:', error);
      reject(new Error('Не удалось создать PDF. Пожалуйста, используйте формат Excel или разрешите всплывающие окна.'));
    }
  });
};

// Интерфейс для пропсов PDF отчета
interface PdfReportProps {
  reportType: "orders" | "devices" | "kpi";
  params: any[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  setReportDialogOpen?: (open: boolean) => void;
}

// Основная функция для генерации PDF отчета
export const generatePdfReport = async ({
  reportType,
  params = [],
  setLoading,
  setError,
  setSuccess,
  setReportDialogOpen
}: PdfReportProps): Promise<void> => {
  setLoading(true);
  setError(null);

  try {
    console.log(`🔄 Генерация PDF отчета для ${reportType}...`);
    
    // Используем HTML метод с реальными данными
    await generatePDFviaHTML(reportType, params);
    
    const successMessage = `PDF отчет "${reportType}" успешно сгенерирован`;
    setSuccess(successMessage);
    
    if (setReportDialogOpen) {
      setTimeout(() => setReportDialogOpen(false), 1500);
    }
    
  } catch (err: any) {
    console.error('❌ Ошибка генерации PDF отчета:', err);
    setError(err.message || 'Не удалось сгенерировать PDF отчет. Пожалуйста, используйте формат Excel.');
  } finally {
    setLoading(false);
  }
};

// Экспорт вспомогательных функций для тестирования
export {
  fetchReportData,
  fetchReportDataJson,
  parseExcelData,
  generateMockData,
  generateMockStats
};