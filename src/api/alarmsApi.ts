// api/alarmsApi.ts
import { apiClient } from './client';

// Типы для данных тревоги
export interface AlarmData {
  nodeId: string;
  nodeName: string;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  status?: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  alarmType: 'manual' | 'automatic' | 'sensor' | 'threshold' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata?: Record<string, any>;
  location?: string;
  building?: string;
  floor?: string;
  room?: string;
  equipmentType?: string;
  sensorId?: string;
}

export interface AlarmResponse {
  success: boolean;
  message: string;
  alarmId?: string;
  timestamp?: string;
  details?: Record<string, any>;
}

export interface Alarm {
  id: string;
  nodeId: string;
  nodeName: string;
  timestamp: string;
  alarmType: string;
  severity: string;
  description: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'cleared';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  sensorData?: Record<string, any>;
}

export interface AlarmStats {
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  byType: Record<string, number>;
  recentAlarms: Alarm[];
}

// Основной API для работы с тревогами
export const alarmsApi = {
  /**
   * Отправка сигнала тревоги
   */
  sendAlarm: async (alarmData: AlarmData): Promise<AlarmResponse> => {
    console.log("🚨 [Alarms API] Отправка сигнала тревоги...");
    console.log("📊 Данные тревоги:");
    console.log("   Узел:", alarmData.nodeName);
    console.log("   ID:", alarmData.nodeId);
    console.log("   Тип:", alarmData.alarmType);
    console.log("   Критичность:", alarmData.severity);
    console.log("   Описание:", alarmData.description);
    console.log("   Время:", new Date(alarmData.timestamp).toLocaleString());
    
    if (alarmData.temperature !== undefined) {
      console.log("   Температура:", alarmData.temperature);
    }
    if (alarmData.humidity !== undefined) {
      console.log("   Влажность:", alarmData.humidity);
    }
    if (alarmData.pressure !== undefined) {
      console.log("   Давление:", alarmData.pressure);
    }
    
    try {
      const response = await apiClient.post<AlarmResponse>("/alarmF", [alarmData]);
      
      console.log("✅ [Alarms API] Сигнал успешно отправлен");
      console.log("📄 Ответ сервера:");
      console.log("   Успех:", response.success);
      console.log("   Сообщение:", response.message);
      
      if (response.alarmId) {
        console.log("   ID тревоги:", response.alarmId);
      }
      if (response.details) {
        console.log("   Детали:", response.details);
      }
      
      return response;
    } catch (error: any) {
      console.error("❌ [Alarms API] Ошибка отправки тревоги:");
      console.error("   Сообщение:", error.message);
      console.error("   Код:", error.response?.status);
      
      // Пробуем получить детали ошибки
      if (error.response?.data) {
        console.error("   Данные ошибки:");
        if (typeof error.response.data === 'object') {
          Object.keys(error.response.data).forEach(key => {
            console.error(`   ${key}:`, error.response.data[key]);
          });
        } else {
          console.error("   Raw:", error.response.data);
        }
      }
      
      throw error;
    }
  },
  
  /**
   * Получение списка активных тревог
   */
  getActiveAlarms: async (params?: {
    nodeId?: string;
    severity?: string;
    limit?: number;
  }): Promise<Alarm[]> => {
    console.log("📋 [Alarms API] Получение активных тревог...");
    
    const queryParams = new URLSearchParams();
    queryParams.append('status', 'active');
    
    if (params?.nodeId) {
      queryParams.append('nodeId', params.nodeId);
      console.log("   Фильтр по узлу:", params.nodeId);
    }
    
    if (params?.severity) {
      queryParams.append('severity', params.severity);
      console.log("   Фильтр по критичности:", params.severity);
    }
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
      console.log("   Лимит:", params.limit);
    }
    
    const url = `/alarms?${queryParams.toString()}`;
    console.log("   URL запроса:", url);
    
    try {
      const response = await apiClient.get<Alarm[]>(url);
      
      console.log(`✅ [Alarms API] Получено ${response.length} активных тревог`);
      
      if (response.length > 0) {
        console.log("🔍 Пример активной тревоги:");
        console.log("   ID:", response[0].id);
        console.log("   Узел:", response[0].nodeName);
        console.log("   Тип:", response[0].alarmType);
        console.log("   Критичность:", response[0].severity);
        console.log("   Время:", new Date(response[0].timestamp).toLocaleString());
      }
      
      return response;
    } catch (error: any) {
      console.error("❌ [Alarms API] Ошибка получения активных тревог:", error.message);
      throw error;
    }
  },
  
  /**
   * Получение статистики по тревогам
   */
  getAlarmStats: async (): Promise<AlarmStats> => {
    console.log("📊 [Alarms API] Получение статистики тревог...");
    
    try {
      const response = await apiClient.get<AlarmStats>("/alarms/stats");
      
      console.log("✅ [Alarms API] Статистика получена:");
      console.log("   Всего тревог:", response.total);
      console.log("   Активных:", response.active);
      console.log("   Подтвержденных:", response.acknowledged);
      console.log("   Решенных:", response.resolved);
      
      console.log("   По критичности:");
      console.log("     Низкая:", response.bySeverity.low);
      console.log("     Средняя:", response.bySeverity.medium);
      console.log("     Высокая:", response.bySeverity.high);
      console.log("     Критическая:", response.bySeverity.critical);
      
      if (response.byType && Object.keys(response.byType).length > 0) {
        console.log("   По типам:");
        Object.entries(response.byType).forEach(([type, count]) => {
          console.log(`     ${type}:`, count);
        });
      }
      
      return response;
    } catch (error: any) {
      console.error("❌ [Alarms API] Ошибка получения статистики:", error.message);
      throw error;
    }
  },
  
  /**
   * Подтверждение тревоги
   */
  acknowledgeAlarm: async (alarmId: string, userId: string): Promise<AlarmResponse> => {
    console.log("👤 [Alarms API] Подтверждение тревоги...");
    console.log("   ID тревоги:", alarmId);
    console.log("   Пользователь:", userId);
    
    try {
      const response = await apiClient.post<AlarmResponse>(`/alarms/${alarmId}/acknowledge`, {
        userId,
        timestamp: new Date().toISOString()
      });
      
      console.log("✅ [Alarms API] Тревога подтверждена");
      console.log("   Сообщение:", response.message);
      
      return response;
    } catch (error: any) {
      console.error("❌ [Alarms API] Ошибка подтверждения тревоги:", error.message);
      throw error;
    }
  },
  
  /**
   * Получение истории тревог для конкретного узла
   */
  getNodeAlarmHistory: async (nodeId: string, days: number = 7): Promise<Alarm[]> => {
    console.log("📜 [Alarms API] Получение истории тревог для узла...");
    console.log("   ID узла:", nodeId);
    console.log("   За период (дней):", days);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const params = new URLSearchParams({
      nodeId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      orderBy: 'timestamp',
      order: 'desc'
    });
    
    const url = `/alarms/history?${params.toString()}`;
    
    try {
      const response = await apiClient.get<Alarm[]>(url);
      
      console.log(`✅ [Alarms API] Получено ${response.length} тревог за ${days} дней`);
      
      if (response.length > 0) {
        console.log("🔍 Последняя тревога:");
        const lastAlarm = response[0];
        console.log("   Время:", new Date(lastAlarm.timestamp).toLocaleString());
        console.log("   Тип:", lastAlarm.alarmType);
        console.log("   Статус:", lastAlarm.status);
        console.log("   Описание:", lastAlarm.description);
      }
      
      return response;
    } catch (error: any) {
      console.error("❌ [Alarms API] Ошибка получения истории:", error.message);
      throw error;
    }
  }
};