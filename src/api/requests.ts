// api/requests.ts
import { apiClient } from "./client";

export interface Order {
  id: string | number;
  date?: string;
  description?: string;
  type?: string;
  device?: string;
  user?: string;
  status?: string;
  priority?: string; // Добавлено
  originalData?: any;
  [key: string]: any;
}

export interface User {
  id: string | number;
  name: string;
  username?: string;
  role?: string;
}

//REACT_APP_FUNCTIONS=/rest/v1/contexts/users.admin.models.workerLimsN/functions
const FUNCTIONS = process.env.REACT_APP_FUNCTIONS;

// Улучшенная функция декодирования
const decodeText = (text: any): string => {
  if (text === null || text === undefined) return "";
  if (typeof text !== "string") return String(text);

  // Если текст уже нормальный (содержит кириллицу) и нет кракозябров
  if (/[А-Яа-яЁё]/.test(text)) {
    return text;
  }

  // Проверяем на кракозябры (двойное кодирование)
  if (/РЎ|Рў|Р Р|Р›|Рњ|Рќ/.test(text)) {
    return fixDoubleEncoding(text);
  }

  return text;
};

// Проверка на двойное кодирование (UTF-8 → CP1251 → UTF-8)
/*const isDoubleEncodedCp1251 = (text: string): boolean => {
  return /РЎ|Рў|Р Р|Р›|Рњ|Рќ/.test(text) || /СЂ|С‚|С |С›|Сњ|Сќ/.test(text);
};*/

// Исправление двойного кодирования
const fixDoubleEncoding = (text: string): string => {
  try {
    // Конвертируем текст в байты (предполагаем UTF-8)
    const utf8Bytes = new TextEncoder().encode(text);

    // Декодируем эти байты как CP1251
    const decoder1251 = new TextDecoder("windows-1251");
    const intermediate = decoder1251.decode(utf8Bytes);

    // Теперь intermediate содержит однократно закодированный UTF-8
    // Преобразуем в байты и декодируем как UTF-8
    const finalBytes = new TextEncoder().encode(intermediate);
    return new TextDecoder("utf-8").decode(finalBytes);
  } catch (error) {
    console.error("Ошибка исправления двойного кодирования:", error);
    return text;
  }
};

// Простое декодирование CP1251
/*const decodeCp1251 = (text: string): string => {
  try {
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      bytes[i] = text.charCodeAt(i) & 0xff;
    }

    const decoder = new TextDecoder("windows-1251");
    return decoder.decode(bytes);
  } catch (error) {
    // Резервный метод: ручное декодирование
    return decodeCp1251Manual(text);
  }
};*/

// Ручное декодирование CP1251
/*const decodeCp1251Manual = (text: string): string => {
  let result = "";

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);

    // Таблица CP1251 → UTF-16
    if (code >= 0xc0 && code <= 0xdf) {
      result += String.fromCharCode(code + 0x350);
    } else if (code >= 0xe0 && code <= 0xff) {
      result += String.fromCharCode(code + 0x350);
    } else if (code === 0xa8) {
      result += "Ё";
    } else if (code === 0xb8) {
      result += "ё";
    } else {
      result += text[i];
    }
  }

  return result;
};*/

export const requestsApi = {
  // Получение заявок с бэка
  getOrders: async (): Promise<Order[]> => {
    try {
      console.log("🔄 Отправка запроса на получение заявок...");

      // Пробуем обычный запрос без специального декодирования
      const response = await apiClient.post<any[]>("/getOrdersF", []);

      console.log("✅ Ответ от сервера, количество:", response.length);

      if (response.length > 0) {
        console.log("📋 Пример заявки (сырые данные):", response[0]);
        console.log("🔍 Пример поля type:", response[0]?.type);
        console.log("🔍 Пример поля description:", response[0]?.description);
      }

      // Декодируем поля
      const decodedOrders = response.map((order: any) => {
        const decoded: any = {};

        Object.keys(order).forEach((key) => {
          const value = order[key];

          // Для числовых ID не декодируем
          if (
            key === "id" &&
            (typeof value === "number" || /^#\d+$/.test(value))
          ) {
            decoded[key] = value;
          } else {
            decoded[key] = decodeText(value);
          }
        });

        return decoded;
      });

      console.log("📋 Пример после декодирования:", decodedOrders[0]);

      // Форматируем заявки
      const formattedOrders = decodedOrders.map((order: any, index: number) => {
        const formattedOrder: Order = {
          id: order.id || `#${String(index + 1).padStart(5, "0")}`,
          date: order.date || "",
          description: order.description || "Нет описания",
          type: order.type || "Не указан",
          device: order.device || "Не указано",
          user: order.user || order.nUser || "Не назначен", // Обрабатываем оба поля
          status: mapStatus(order.status) || "Создана",
          priority: order.priority || "Средний",
          originalData: order,
        };

        // Копируем все остальные поля
        Object.keys(order).forEach((key) => {
          if (!(key in formattedOrder)) {
            formattedOrder[key] = order[key];
          }
        });

        return formattedOrder;
      });

      // Статистика
      const statusStats = formattedOrders.reduce(
        (acc: Record<string, number>, order: Order) => {
          const status = order.status || "unknown";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {},
      );

      console.log("📊 Статистика по статусам:", statusStats);
      console.log("📊 Всего заявок:", formattedOrders.length);

      return formattedOrders;
    } catch (error: any) {
      console.error("❌ Ошибка при получении заявок:", error);
      console.error("📄 Детали ошибки:", error.response?.data || error.message);

      // Возвращаем тестовые данные
      return getMockOrders();
    }
  },

  // Обновление статуса заявки
  updateOrderStatus: async (
    orderId: string | number,
    status: string,
  ): Promise<any> => {
    try {
      console.log(`🔄 Обновление статуса заявки ${orderId} на "${status}"`);

      const dataToSend = {
        id: orderId.toString(),
        status: status,
      };

      // Используем FUNCTIONS путь - КОРРЕКТНОЕ ИСПОЛЬЗОВАНИЕ
      return await apiClient.post(
        "/updateOrderF",
        [dataToSend],
        { baseURL: FUNCTIONS }, // Важно передать baseURL в опциях
      );
    } catch (error) {
      console.error("❌ Ошибка при обновлении статуса:", error);
      throw error;
    }
  },

  // Полное обновление заявки
  updateOrder: async (
    orderId: string | number,
    updateData: {
      status?: string;
      user?: string;
      description?: string;
      priority?: string;
      [key: string]: any;
    },
  ): Promise<any> => {
    try {
      console.log(`🔄 Полное обновление заявки ${orderId}:`, updateData);

      // Подготавливаем данные в правильном формате
      const dataToSend: any = {
        id: orderId.toString(),
      };

      // Маппинг полей
      if (updateData.status) dataToSend.status = updateData.status;
      if (updateData.user) dataToSend.nUser = updateData.user; // Обратите внимание на поле nUser
      if (updateData.description)
        dataToSend.description = updateData.description;
      if (updateData.priority) dataToSend.priority = updateData.priority;

      // Добавляем остальные поля
      Object.keys(updateData).forEach((key) => {
        if (!["status", "user", "description", "priority"].includes(key)) {
          dataToSend[key] = updateData[key];
        }
      });

      console.log("📤 Данные для updateOrderF:", dataToSend);

      return await apiClient.post(
        "/updateOrderF",
        [dataToSend],
        { baseURL: FUNCTIONS }, // Важно!
      );
    } catch (error) {
      console.error("❌ Ошибка при обновлении заявки:", error);
      throw error;
    }
  },

  // Создание новой заявки
  createOrder: async (orderData: Partial<Order>): Promise<any> => {
    try {
      console.log("🆕 Создание новой заявки:", orderData);

      const response = await apiClient.post(
        "setNewOrderF",
        [orderData],
        { baseURL: FUNCTIONS }, // Важно!
      );
      console.log("✅ Заявка создана:", response);
      return response;
    } catch (error) {
      console.error("❌ Ошибка при создании заявки:", error);
      throw error;
    }
  },

  // Получение списка пользователей
  getUsers: async (): Promise<User[]> => {
    try {
      console.log("🔄 Получение списка пользователей...");

      // Пробуем получить пользователей
      const response = await apiClient.post<any[]>("/getUsersF", []);

      const users: User[] = response.map((user: any) => ({
        id: user.id || user.user_id || user.name,
        name: decodeText(
          user.name || user.full_name || user.username || "Неизвестный",
        ),
        username: user.username,
        role: user.role,
      }));

      console.log("✅ Получено пользователей:", users.length);
      return users;
    } catch (error) {
      console.warn("⚠️ Не удалось получить пользователей с сервера");

      // Статический список
      return [
        { id: 1, name: "Васильев М.С." },
        { id: 2, name: "Смирнов А.П." },
        { id: 3, name: "Иванов П.К." },
        { id: 4, name: "Попов Д.В." },
        { id: 5, name: "Сидоров И.И." },
        { id: 6, name: "Махмудов И.К." },
      ];
    }
  },

  // Назначение заявки исполнителю
  assignOrder: async (
    orderId: string | number,
    userId: string,
    userName: string,
  ): Promise<any> => {
    try {
      console.log(`🔄 Назначение заявки ${orderId} на исполнителя ${userName}`);

      // Внимание: поле user в базе называется nUser
      const dataToSend = {
        id: orderId.toString(),
        nUser: userName, // Используем nUser, а не user
        status: "В работе",
      };

      console.log("📤 Данные для отправки:", dataToSend);

      const response = await apiClient.post(
        "/updateOrderF",
        [dataToSend],
        { baseURL: FUNCTIONS }, // Важно!
      );

      console.log("✅ Заявка успешно назначена:", response);
      return response;
    } catch (error: any) {
      console.error("❌ Ошибка при назначении заявки:", error);
      throw error;
    }
  },

  // Тестовый метод
  testUpdateFormat: async (
    orderId: string | number,
    userName: string,
  ): Promise<any> => {
    console.log(`🧪 Тестирование форматов для заявки ${orderId}`);

    const formats = [
      {
        data: [{ id: orderId.toString(), nUser: userName }],
        name: "Только nUser",
      },
      {
        data: [{ id: orderId.toString(), nUser: userName, status: "В работе" }],
        name: "nUser + статус",
      },
      {
        data: { id: orderId.toString(), nUser: userName },
        name: "Объект вместо массива",
      },
    ];

    for (const format of formats) {
      try {
        console.log(`\n🔄 Пробуем формат: ${format.name}`);

        const response = await apiClient.post("/updateOrderF", format.data);

        console.log(`✅ Формат ${format.name} успешен:`, response);
        return { success: true, format: format.name, response };
      } catch (error: any) {
        console.log(`❌ Формат ${format.name} не сработал:`, error.message);
      }
    }

    throw new Error("Все форматы не сработали");
  },
};

// Маппинг статусов
const mapStatus = (status?: string): string => {
  if (!status) return "Создана";

  const statusMap: Record<string, string> = {
    создана: "Создана",
    "в работе": "В работе",
    завершена: "Завершена",
    закрыта: "Закрыта",
    отменена: "Отменена",
    created: "Создана",
    in_progress: "В работе",
    completed: "Завершена",
    closed: "Закрыта",
    cancelled: "Отменена",
  };

  const lowerStatus = status.toLowerCase().trim();
  return statusMap[lowerStatus] || status;
};

// Тестовые данные
const getMockOrders = (): Order[] => {
  console.log("⚠️ Используем тестовые данные");

  return [
    {
      id: "#00001",
      date: "2025-12-20 10:02:01",
      description: "Проведение регламентных работ",
      type: "Обслуживание",
      device: "Контроллер доступа №3",
      user: "Иванов И.И.",
      status: "Создана",
      priority: "Средний",
    },
    {
      id: "#00002",
      date: "2025-12-20 10:03:01",
      description: "Замена оборудования",
      type: "Замена",
      device: "Датчик №5",
      user: "Петров П.П.",
      status: "В работе",
      priority: "Высокий",
    },
  ];
};
