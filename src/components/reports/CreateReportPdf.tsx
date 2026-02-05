import React from "react";

// Константы
const ORDERREPORTXLSX = process.env.REACT_APP_ORDERREPORTXLSX;
const DEVICEREPORTXLSX = process.env.REACT_APP_DEVICEREPORTXLSX;
const KPIREPORTXLSX = process.env.REACT_APP_KPIREPORTXLSX;

// Интерфейс для пропсов
export interface PdfReportProps {
  reportType: "orders" | "devices" | "kpi";
  params: any[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  setReportDialogOpen?: (open: boolean) => void;
}

// Функция для получения данных с бэка
export const fetchReportData = async (
  reportType: "orders" | "devices" | "kpi",
  params?: any,
): Promise<any[]> => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("Токен не найден");
    }

    // Определяем endpoint
    const endpoints = {
      orders: `${ORDERREPORTXLSX}`, //'/rest/v1/contexts/users.admin.models.workerMS/functions/reportForOrdersXlsxF',
      devices: `${DEVICEREPORTXLSX}`, //'/rest/v1/contexts/users.admin.models.workerMS/functions/reportForDevicesXlsxF',
      kpi: `${KPIREPORTXLSX}`, //'/rest/v1/contexts/users.admin.models.workerMS/functions/reportForKPIXlsxF'
    };

    const endpoint = endpoints[reportType];
    if (!endpoint) {
      throw new Error(`Неизвестный тип отчета: ${reportType}`);
    }

    console.log(`🔄 Запрос данных ${reportType}`);

    // Всегда отправляем пустой массив, как в XLSX версии
    const requestBody = [];

    if (params && Array.isArray(params) && params.length > 0) {
      requestBody.push(...params);
    } else if (
      params &&
      typeof params === "object" &&
      Object.keys(params).length > 0
    ) {
      requestBody.push(params);
    }

    console.log("📤 Тело запроса:", requestBody);

    // Отправляем запрос
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorText = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.text();
        errorText += `\n${errorData.substring(0, 200)}`;
      } catch {}
      throw new Error(errorText);
    }

    const data = await response.json();
    console.log("📥 Ответ сервера получен");

    if (Array.isArray(data) && data[0]?.value) {
      const parsed = JSON.parse(data[0].value);

      if (parsed.data) {
        // Декодируем и парсим Excel
        return await parseExcelFromBase64Simple(parsed.data, reportType);
      }
    }

    throw new Error("Неверный формат ответа сервера");
  } catch (error) {
    console.error("❌ Ошибка fetchReportData:", error);
    throw error;
  }
};

// Простая функция парсинга Excel (исправленная версия)
const parseExcelFromBase64Simple = async (
  base64String: string,
  reportType: string,
): Promise<any[]> => {
  try {
    console.log(`🔧 Парсинг Excel для ${reportType}...`);

    // Декодируем base64
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Динамически импортируем xlsx
    const xlsx = await import("xlsx");

    // Читаем Excel файл
    const workbook = xlsx.read(bytes, {
      type: "array",
      cellDates: true,
      dateNF: "yyyy-mm-dd hh:mm:ss",
    });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    console.log("📊 Excel файл загружен, лист:", sheetName);

    // Получаем диапазон ячеек
    const range = xlsx.utils.decode_range(worksheet["!ref"] || "A1:A1");
    console.log(
      `📊 Диапазон: строк ${range.e.r + 1}, колонок ${range.e.c + 1}`,
    );

    // Ищем заголовки таблицы (строка с Id, Type, Device и т.д.)
    let headerRow = 5; // По умолчанию строка 6 (0-based индекс 5)
    let foundHeaders = false;

    // Проверяем первые 10 строк
    for (let r = 0; r < Math.min(10, range.e.r + 1); r++) {
      const rowData: string[] = [];
      for (let c = 0; c <= range.e.c; c++) {
        const cellRef = xlsx.utils.encode_cell({ r, c });
        const cell = worksheet[cellRef];
        if (cell && cell.v) {
          rowData.push(String(cell.v).toLowerCase());
        }
      }

      // Проверяем, есть ли в строке заголовки таблицы
      const rowText = rowData.join(" ");
      if (
        rowText.includes("id") &&
        (rowText.includes("type") ||
          rowText.includes("device") ||
          rowText.includes("status"))
      ) {
        headerRow = r;
        foundHeaders = true;
        console.log(`📌 Найдены заголовки в строке ${r + 1}`);
        break;
      }
    }

    if (!foundHeaders) {
      console.log("⚠️ Заголовки не найдены, использую строку 6 по умолчанию");
    }

    // Парсим данные начиная с найденной строки заголовков
    const jsonData = xlsx.utils.sheet_to_json(worksheet, {
      range: headerRow, // Начинаем с заголовков
      raw: false, // Конвертируем значения в строки
      defval: "", // Значение по умолчанию для пустых ячеек
      dateNF: "yyyy-mm-dd hh:mm:ss", // Формат даты
    });

    console.log(`✅ Excel распарсен: ${jsonData.length} записей`);

    // Фильтруем данные
    const filteredData = jsonData.filter((item: any) => {
      // Убираем строки с метаданными отчета
      if (!item) return false;

      const keys = Object.keys(item);
      if (keys.length === 0) return false;

      // Проверяем первый ключ (обычно Id)
      const firstKey = keys[0];
      const firstValue = item[firstKey];

      if (firstValue && typeof firstValue === "string") {
        // Убираем строки с заголовками отчета
        if (
          firstValue.includes("Отчет по") ||
          firstValue.includes("Период:") ||
          firstValue.includes("Автор :") ||
          firstValue.includes("Дата и время")
        ) {
          return false;
        }
      }

      // Проверяем, что есть хотя бы одно непустое значение
      return Object.values(item).some(
        (value) => value !== undefined && value !== null && value !== "",
      );
    });

    console.log(`📊 После фильтрации: ${filteredData.length} записей`);

    if (filteredData.length > 0) {
      const firstItem = filteredData[0] as Record<string, any>;
      console.log("📊 Пример первой записи:", firstItem);
      console.log("📊 Структура данных:", Object.keys(firstItem));
    } else {
      console.warn("⚠️ После фильтрации данных не осталось");
    }

    return filteredData;
  } catch (error) {
    console.error("❌ Ошибка парсинга Excel:", error);
    throw error;
  }
};

// Функция для генерации PDF через печать HTML
export const generatePDF = async (
  reportType: "orders" | "devices" | "kpi",
  params?: any,
): Promise<void> => {
  try {
    console.log("🔄 Начинаем генерацию PDF...");

    // Получаем данные с сервера
    const reportData = await fetchReportData(reportType, params);
    console.log("📊 Данные для PDF:", reportData.length, "записей");

    if (reportData.length === 0) {
      throw new Error("Нет данных для отчета");
    }

    // Определяем заголовок отчета
    const titles = {
      orders: "ОТЧЕТ ПО ЗАЯВКАМ",
      devices: "ОТЧЕТ ПО ОБОРУДОВАНИЮ",
      kpi: "ОТЧЕТ KPI",
    };

    const title = titles[reportType];
    const now = new Date();

    // Создаем HTML для печати
    const createHtmlContent = () => {
      // Определяем столбцы для разных типов отчетов
      let columns: string[] = [];
      if (reportData.length > 0) {
        const firstItem = reportData[0] as Record<string, any>;
        columns = Object.keys(firstItem);
      }

      // Маппинг русских названий для заголовков
      const headerTranslations: Record<string, string> = {
        Id: "ID",
        Type: "Тип",
        Device: "Оборудование",
        Description: "Описание",
        Status: "Статус",
        Date: "Дата",
        Priority: "Приоритет",
        User: "Пользователь",
        Код: "Код",
        Наименование: "Наименование",
        Параметр: "Параметр",
        "Тип оборудования": "Тип оборудования",
      };

      // Создаем строку с заголовками таблицы
      const tableHeaders = columns
        .map((col) => `<th>${headerTranslations[col] || col}</th>`)
        .join("");

      // Создаем строки таблицы (ограничиваем 100 записями для производительности)
      const tableRows = reportData
        .slice(0, 100)
        .map((item: any) => {
          const cells = columns
            .map((col) => {
              const value = item[col];
              return `<td>${value !== undefined && value !== null ? String(value) : ""}</td>`;
            })
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");

      return `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            @media print {
              @page {
                size: A4 landscape;
                margin: 10mm;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: 'Arial', 'Helvetica', sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
              padding: 15px;
              background: #fff;
            }
            
            .report-container {
              max-width: 100%;
              margin: 0 auto;
            }
            
            .header {
              text-align: center;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 2px solid #2c3e50;
            }
            
            .header h1 {
              font-size: 22px;
              color: #2c3e50;
              margin-bottom: 10px;
              font-weight: bold;
            }
            
            .report-info {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 6px;
              margin-bottom: 20px;
              border-left: 4px solid #3498db;
            }
            
            .info-row {
              display: flex;
              margin-bottom: 5px;
            }
            
            .info-label {
              font-weight: bold;
              min-width: 180px;
              color: #2c3e50;
            }
            
            .info-value {
              color: #555;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              table-layout: fixed;
              word-wrap: break-word;
            }
            
            th {
              background-color: #3498db !important;
              color: white !important;
              font-weight: bold;
              padding: 10px 8px;
              text-align: left;
              border: 1px solid #2980b9;
              font-size: 11px;
            }
            
            td {
              padding: 8px;
              border: 1px solid #ddd;
              font-size: 10px;
              vertical-align: top;
            }
            
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            
            tr:hover {
              background-color: #f5f7fa;
            }
            
            .footer {
              margin-top: 25px;
              padding-top: 15px;
              border-top: 1px solid #eee;
              text-align: center;
              font-size: 10px;
              color: #777;
            }
            
            /* Адаптивные стили для широких таблиц */
            @media screen and (max-width: 1200px) {
              body {
                font-size: 11px;
              }
              
              th, td {
                padding: 6px 4px;
                font-size: 9px;
              }
            }
            
            /* Стили для печати */
            @media print {
              body {
                font-size: 9pt;
                padding: 0;
              }
              
              .report-container {
                padding: 5mm;
              }
              
              th {
                background-color: #ccc !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <h1>${title}</h1>
            </div>
            
            <div class="report-info">
              <div class="info-row">
                <div class="info-label">Дата формирования:</div>
                <div class="info-value">${now.toLocaleDateString("ru-RU")} ${now.toLocaleTimeString("ru-RU")}</div>
              </div>
              
              ${
                params?.startDate && params?.endDate
                  ? `
                <div class="info-row">
                  <div class="info-label">Период:</div>
                  <div class="info-value">с ${params.startDate} по ${params.endDate}</div>
                </div>
              `
                  : `
                <div class="info-row">
                  <div class="info-label">Период:</div>
                  <div class="info-value">на текущую дату</div>
                </div>
              `
              }
              
              <div class="info-row">
                <div class="info-label">Всего записей:</div>
                <div class="info-value">${reportData.length}</div>
              </div>
              
              ${
                reportData.length > 100
                  ? `
                <div class="info-row">
                  <div class="info-label">Показано записей:</div>
                  <div class="info-value">100 из ${reportData.length} (первые 100 записей)</div>
                </div>
              `
                  : ""
              }
            </div>
            
            <div style="overflow-x: auto;">
              <table>
                <thead>
                  <tr>
                    ${tableHeaders}
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>
            
            <div class="footer">
              <p>Страница 1 из 1 • Сформировано автоматически • ${now.toLocaleDateString("ru-RU")}</p>
            </div>
          </div>
          
          <script>
            // Автоматически запускаем печать после загрузки страницы
            window.addEventListener('load', function() {
              // Даем время на рендеринг
              setTimeout(function() {
                window.print();
                
                // После печати закрываем окно (если оно открыто из скрипта)
                setTimeout(function() {
                  if (window.opener === null) {
                    // window.close(); // Раскомментируйте если нужно автоматическое закрытие
                  }
                }, 1000);
              }, 500);
            });
            
            // Альтернатива: кнопка для ручной печати
            document.addEventListener('keydown', function(e) {
              if (e.key === 'Escape') {
                window.close();
              }
            });
          </script>
        </body>
        </html>
      `;
    };

    // Создаем HTML контент
    const htmlContent = createHtmlContent();

    // Создаем новое окно для печати
    const printWindow = window.open(
      "",
      "_blank",
      "width=1200,height=800,scrollbars=yes",
    );

    // Проверяем, что окно открылось успешно
    if (!printWindow) {
      throw new Error(
        "Не удалось открыть окно для печати. Пожалуйста, разрешите всплывающие окна в браузере.",
      );
    }

    // Записываем HTML в новое окно
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Даем время на загрузку стилей и контента
    setTimeout(() => {
      if (printWindow && !printWindow.closed) {
        printWindow.focus();

        // Показываем сообщение о готовности
        console.log("✅ PDF готов к печати. Откроется диалог печати...");
      }
    }, 1000);

    console.log("✅ HTML для PDF сформирован успешно");
  } catch (error) {
    console.error("❌ Ошибка generatePDF:", error);
    throw error;
  }
};

// Основная функция для генерации PDF отчета
export const generatePdfReport = async ({
  reportType,
  params = [],
  setLoading,
  setError,
  setSuccess,
  setReportDialogOpen,
}: PdfReportProps): Promise<void> => {
  setLoading(true);
  setError(null);
  setSuccess(null);

  try {
    console.log(`🔄 Генерация PDF отчета ${reportType}...`);
    console.log("📋 Параметры:", params);

    // Подготавливаем параметры
    let requestParams: any = {};
    if (params && params.length > 0) {
      requestParams = Array.isArray(params[0]) ? params[0] : params[0];
    }

    console.log("📤 Отправляемые параметры:", requestParams);

    // Генерируем PDF
    await generatePDF(reportType, requestParams);

    // Устанавливаем успешное сообщение
    setSuccess("PDF отчет успешно сгенерирован. Откроется окно печати...");

    // Закрываем диалог через некоторое время
    if (setReportDialogOpen) {
      setTimeout(() => {
        setReportDialogOpen(false);
      }, 2000);
    }
  } catch (err: any) {
    console.error("❌ Ошибка генерации PDF:", err);

    // Формируем понятное сообщение об ошибке
    let errorMessage = "Не удалось сгенерировать PDF отчет";

    if (err.message.includes("Не удалось открыть окно")) {
      errorMessage =
        "Браузер заблокировал всплывающее окно. Разрешите всплывающие окна для этого сайта и попробуйте снова.";
    } else if (err.message.includes("Нет данных")) {
      errorMessage =
        "Нет данных для формирования отчета. Проверьте параметры отчета.";
    } else if (err.message.includes("Токен не найден")) {
      errorMessage = "Требуется авторизация. Пожалуйста, войдите в систему.";
    } else {
      errorMessage = err.message || errorMessage;
    }

    setError(errorMessage);

    // В случае ошибки закрываем диалог
    if (setReportDialogOpen) {
      setTimeout(() => {
        setReportDialogOpen(false);
      }, 3000);
    }
  } finally {
    setLoading(false);
  }
};

// Экспортируем компонент (если требуется)
const CreateReportPdf: React.FC = () => {
  return null; // Этот компонент не имеет UI
};

export default CreateReportPdf;
