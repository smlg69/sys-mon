// hooks/useFormattedId.ts
import { useMemo } from 'react';
import { Order } from '../api/requests';

interface UseFormattedIdProps {
  orders: Order[];
}

export const useFormattedId = ({ orders }: UseFormattedIdProps): string => {
  return useMemo(() => {
    try {
      if (!orders || orders.length === 0) {
        return '#00001';
      }
      
      // Ищем максимальный числовой ID среди заявок
      const numericIds = orders
        .map(order => {
          if (!order.id) return 0;
          
          const idStr = order.id.toString();
          // Извлекаем числовую часть из строки вида "#00045"
          const match = idStr.match(/#?(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(id => !isNaN(id) && id > 0);
      
      // Находим максимальный ID
      const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
      
      // Генерируем следующий ID
      const nextId = maxId + 1;
      
      // Форматируем как "#00001", "#00045" и т.д.
      return `#${nextId.toString().padStart(5, '0')}`;
      
    } catch (error) {
      console.error('Ошибка в useFormattedId:', error);
      // Возвращаем дефолтное значение при ошибке
      const fallbackId = orders.length + 1;
      return `#${fallbackId.toString().padStart(5, '0')}`;
    }
  }, [orders]);
};