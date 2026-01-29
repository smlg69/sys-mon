// hooks/useAlert.ts (версия с fetch)
import { useState, useCallback } from 'react';

interface AlarmParams {
  parameter: string;
  value: string;
  user: string;
}

export const useAlert = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAlarm = useCallback(async (params: AlarmParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      
      // Формируем полный URL на основе env переменной
      const baseUrl = process.env.REACT_APP_FUNCTIONS || '';
      const fullUrl = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}setAlarmF`;
      
      console.log('🔔 Отправка сигнала тревоги:', {
        url: fullUrl,
        params,
      });
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify([params]) // Массив с одним объектом
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('✅ Ответ от setAlarmF:', responseData);
      
      return responseData;
    } catch (err: any) {
      console.error('❌ Ошибка при отправке сигнала тревоги:', err);
      setError(err.message || 'Произошла ошибка');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    setAlarm,
    loading,
    error,
    clearError: () => setError(null)
  };
};