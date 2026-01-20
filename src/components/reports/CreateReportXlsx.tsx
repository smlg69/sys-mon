// components/reports/CreateReportXlsx.tsx
import React from 'react';

// Интерфейсы для типизации
interface ReportFileInfo {
  id: string;
  name: string;
  preview: string | null;
  data: string;
}

interface XlsxReportProps {
  endpoint: string;
  params: any[];
  defaultFilename: string;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  setReportDialogOpen?: (open: boolean) => void;
}

// Вспомогательная функция для скачивания файла из base64 данных
const downloadBase64File = (base64Data: string, filename: string, mimeType: string): boolean => {
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
      type: mimeType
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

// Функция для генерации XLSX отчета
export const generateXlsxReport = async ({
  endpoint,
  params = [],
  defaultFilename,
  setLoading,
  setError,
  setSuccess,
  setReportDialogOpen
}: XlsxReportProps): Promise<void> => {
  setLoading(true);
  setError(null);

  try {
    console.log(`🔄 Генерация XLSX отчета через ${endpoint}...`);

    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Требуется авторизация. Пожалуйста, войдите в систему.');
    }

    // Существующая логика для XLSX
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
    const fileInfo: ReportFileInfo = JSON.parse(result[0].value);
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
    const downloadSuccess = downloadBase64File(
      fileInfo.data, 
      filename, 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

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
    console.error('❌ Ошибка генерации XLSX отчета:', err);
    setError(err.message || 'Не удалось сгенерировать отчет');
  } finally {
    setLoading(false);
  }
};