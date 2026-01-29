// api/orders.ts
import { apiClient } from "./client";

export interface Order {
  date: string;
  description: string;
  id: string;
  type: string;
  device: string;
  user: string;
  status: string;
}

export interface GetOrdersParams {
  num?: number;
}

export const ordersApi = {
  // Получение списка заявок
  getOrders: async (params?: GetOrdersParams): Promise<Order[]> => {
    const response = await apiClient.post<any>(
      "/getOrdersF",
      params?.num ? [{ num: params.num.toString() }] : [],
    );

    // Проверяем формат ответа
    if (Array.isArray(response)) {
      return response.map((item: any) => ({
        date: item.date || "",
        description: item.description || "",
        id: item.id || "",
        type: item.type || "",
        group: item.group || "",
        device: item.device || "",
        user: item.user || "",
        status: item.status || "",
      }));
    }

    return [];
  },

  // Создание новой заявки
  createOrder: async (orderData: Partial<Order>): Promise<Order> => {
    const response = await apiClient.post<any>("createOrderF", [orderData]);
    return Array.isArray(response) ? response[0] : response;
  },

  // Обновление заявки
  updateOrder: async (
    id: string,
    orderData: Partial<Order>,
  ): Promise<Order> => {
    const response = await apiClient.put<any>("/updateOrderF", [
      { id, ...orderData },
    ]);
    return Array.isArray(response) ? response[0] : response;
  },

  // Удаление заявки
  deleteOrder: async (id: string): Promise<void> => {
    await apiClient.delete("deleteOrderF", { data: [{ id }] });
  },

  // Получение статистики по заявкам
  getOrdersStats: async (): Promise<{
    created: number;
    inProgress: number;
    completed: number;
  }> => {
    const orders = await ordersApi.getOrders();
    return {
      created: orders.filter((o) => o.status?.includes("Создана")).length,
      inProgress: orders.filter((o) => o.status?.includes("работе")).length,
      completed: orders.filter((o) => o.status?.includes("Завершена")).length,
    };
  },
};
