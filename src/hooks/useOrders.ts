import { useState, useCallback } from 'react';
import { ordersApi, Order } from '../api/orders';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (num?: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersApi.getOrders({ num });
      setOrders(data);
      return data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось загрузить заявки';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (orderData: Partial<Order>) => {
    try {
      setLoading(true);
      const newOrder = await ordersApi.createOrder(orderData);
      setOrders(prev => [...prev, newOrder]);
      return newOrder;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось создать заявку';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrder = useCallback(async (id: string, orderData: Partial<Order>) => {
    try {
      setLoading(true);
      const updatedOrder = await ordersApi.updateOrder(id, orderData);
      setOrders(prev => prev.map(order => 
        order.id === id ? updatedOrder : order
      ));
      return updatedOrder;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось обновить заявку';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await ordersApi.deleteOrder(id);
      setOrders(prev => prev.filter(order => order.id !== id));
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось удалить заявку';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    orders,
    loading,
    error,
    loadOrders,
    createOrder,
    updateOrder,
    deleteOrder,
  };
};