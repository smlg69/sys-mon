// api/equipment.ts
import { apiClient } from './client';
import { 
  EquipmentType, 
  EquipmentParameter,
  SimpleEquipmentParameter 
} from "../types/equipment";

export interface Device {
  id: string | number;
  name?: string;
  type?: string;
  status?: string;
  location?: string;
  description?: string;
  model?: string;
  serialNumber?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  ipAddress?: string;
  macAddress?: string;
  firmwareVersion?: string;
  [key: string]: any;
}

export const equipmentTypesApi = {
  // Получение типов оборудования с бэкенда
  async getEquipmentTypes(group?: string): Promise<EquipmentType[]> {
    try {
      const response = await apiClient.post("/getTypesF", [
        { group }
      ]);
      
      if (response && Array.isArray(response)) {
        return response.map((item: any) => ({
          id: item.id,
          type: item.type || "",
          group: item.group || "hvac",
          parameter: item.parameter || "",
          displayName: this.generateDisplayName(item),
          unit: this.getUnitByParameter(item.parameter),
          min: this.getDefaultMin(item.parameter),
          max: this.getDefaultMax(item.parameter),
          color: this.getColorByType(item.type)
        }));
      }
      return [];
    } catch (error) {
      console.error("❌ Ошибка получения типов оборудования:", error);
      return [];
    }
  },

  // Получение данных для конкретного оборудования
  async getEquipmentData(parameterIds: string[]): Promise<any> {
    try {
      const response = await apiClient.post("/getCurrentParamsF", [
        { 
          system: "hvac", 
          parameters: parameterIds,
          includeHistory: true 
        }
      ]);
      return response;
    } catch (error) {
      console.error("❌ Ошибка получения данных оборудования:", error);
      throw error;
    }
  },

  // Вспомогательные методы
  generateDisplayName(item: any): string {
    const typeMap: Record<string, string> = {
      "датчик": "Датчик",
      "тепловой узел": "Тепловой узел",
      "котел": "Котел",
      "насос": "Насос",
      "клапан": "Клапан",
      "вентиляция": "Вент.",
      "щит": "Щит"
    };

    const paramMap: Record<string, string> = {
      "temperature": "температуры",
      "pressure": "давления",
      "flow": "расхода",
      "power": "мощности",
      "tu": "теплоносителя"
    };

    const typeName = typeMap[item.type] || item.type;
    const paramName = paramMap[item.parameter] || item.parameter;
    
    return `${typeName} ${paramName} ${item.id}`;
  },

  getUnitByParameter(parameter: string): string {
    const units: Record<string, string> = {
      "temperature": "°C",
      "tu": "°C",
      "pressure": "бар",
      "flow": "м³/ч",
      "power": "кВт"
    };
    return units[parameter] || "";
  },

  getDefaultMin(parameter: string): number {
    const defaults: Record<string, number> = {
      "temperature": 0,
      "tu": 40,
      "pressure": 0,
      "flow": 0,
      "power": 0
    };
    return defaults[parameter] || 0;
  },

  getDefaultMax(parameter: string): number {
    const defaults: Record<string, number> = {
      "temperature": 100,
      "tu": 90,
      "pressure": 10,
      "flow": 50,
      "power": 100
    };
    return defaults[parameter] || 100;
  },

  getColorByType(type: string): string {
    const colors: Record<string, string> = {
      "тепловой узел": "#1976d2",
      "датчик": "#4caf50",
      "котел": "#f44336",
      "насос": "#3f51b5",
      "клапан": "#ff9800",
      "вентиляция": "#009688",
      "щит": "#9c27b0"
    };
    return colors[type] || "#9e9e9e";
  },

  // Извлечение значения из сложной структуры
  extractValue(data: any): number {
    if (!data) return 0;
    
    if (typeof data === 'object' && data.vValue && Array.isArray(data.vValue)) {
      const val = data.vValue[0];
      return typeof val === 'number' ? val : parseFloat(val) || 0;
    }
    
    if (Array.isArray(data)) {
      const lastItem = data[data.length - 1];
      return this.extractValue(lastItem);
    }
    
    return typeof data === 'number' ? data : parseFloat(data) || 0;
  }
};

export const equipmentApi = {
  // Получение всего оборудования с бэка
  getAllDevices: async (): Promise<Device[]> => {
    try {
      console.log('🔄 Отправка запроса на получение оборудования...');
      
      // Используем метод с декодированием
      const response = await apiClient.postWithDecoding('/getTblDevicesF', [], 'windows-1251');
      console.log('✅ Оборудование получено, количество:', response.length);
      
      if (response.length > 0) {
        console.log('📋 Пример устройства:', response[0]);
        console.log('🔑 Ключи устройства:', Object.keys(response[0]));
      }
      
      // Форматируем данные
      const devices = response.map((device: any, index: number) => {
        const formattedDevice: Device = {
          id: device.id || device.deviceId || `device_${index}`,
          name: device.name || device.deviceName || device.title || 'Не указано',
          type: device.type || device.deviceType || device.category || 'Не указан',
          status: mapStatus(device.status || device.deviceStatus || device.state) || 'Неизвестно',
          location: device.location || device.place || device.address || 'Не указано',
          description: device.description || device.comment || 'Нет описания',
          model: device.model || device.modelName,
          serialNumber: device.serialNumber || device.sn,
          lastMaintenance: device.lastMaintenance || device.lastServiceDate,
          nextMaintenance: device.nextMaintenance || device.nextServiceDate,
          ipAddress: device.ipAddress || device.ip,
          macAddress: device.macAddress || device.mac,
          firmwareVersion: device.firmwareVersion || device.firmware,
          originalData: device,
        };
        
        // Копируем остальные поля
        Object.keys(device).forEach(key => {
          if (!(key in formattedDevice)) {
            formattedDevice[key] = device[key];
          }
        });
        
        return formattedDevice;
      });
      
      // Статистика
      const typeStats = devices.reduce((acc: Record<string, number>, device: Device) => {
        const type = device.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📊 Статистика по типам:', typeStats);
      console.log('📊 Всего устройств:', devices.length);
      
      return devices;
      
    } catch (error: any) {
      console.error('❌ Ошибка при получении оборудования:', error);
      
      // Альтернативный способ
      try {
        console.log('🔄 Пробуем альтернативный способ...');
        const response = await apiClient.post<any[]>('/getTblDevicesF', []);
        
        // Вручную декодируем
        const decodedDevices = response.map((device: any) => {
          const decoded: any = {};
          Object.keys(device).forEach(key => {
            const value = device[key];
            if (typeof value === 'string') {
              // Пробуем декодировать
              try {
                const bytes = new Uint8Array(value.length);
                for (let i = 0; i < value.length; i++) {
                  bytes[i] = value.charCodeAt(i) & 0xFF;
                }
                const decoder = new TextDecoder('windows-1251');
                decoded[key] = decoder.decode(bytes);
              } catch {
                decoded[key] = value;
              }
            } else {
              decoded[key] = value;
            }
          });
          return decoded;
        });
        
        console.log('✅ Альтернативный способ успешен');
        return decodedDevices.map((device: any, index: number) => ({
          id: device.id || device.deviceId || `device_${index}`,
          name: device.name || device.deviceName || device.title || 'Не указано',
          type: device.type || device.deviceType || device.category || 'Не указан',
          status: mapStatus(device.status || device.deviceStatus || device.state) || 'Неизвестно',
          location: device.location || device.place || device.address || 'Не указано',
          description: device.description || device.comment || 'Нет описания',
          model: device.model || device.modelName,
          serialNumber: device.serialNumber || device.sn,
          lastMaintenance: device.lastMaintenance || device.lastServiceDate,
          nextMaintenance: device.nextMaintenance || device.nextServiceDate,
          ipAddress: device.ipAddress || device.ip,
          macAddress: device.macAddress || device.mac,
          firmwareVersion: device.firmwareVersion || device.firmware,
          originalData: device,
        }));
        
      } catch (error2: any) {
        console.error('❌ Оба способа не сработали:', error2);
        return getMockDevices();
      }
    }
  },
  
  // Получение оборудования определенного типа (СКУД)
  getAccessDevices: async (): Promise<Device[]> => {
    try {
      const allDevices = await equipmentApi.getAllDevices();
      
      const accessDevices = allDevices  //добавлено б/фильтра
	  /*// Расширяем фильтр для СКУД
      const accessDevices = allDevices.filter(device => {
        const type = (device.type || '').toLowerCase();
        const name = (device.name || '').toLowerCase();
        
        // Ключевые слова для СКУД
        const accessKeywords = [
          'скуд', 'контроллер', 'считыватель', 'замок', 
          'контроль доступа', 'доступ', 'карта', 'пропуск',
          'controller', 'reader', 'lock', 'access'
        ];
        
        return accessKeywords.some(keyword => 
          type.includes(keyword) || name.includes(keyword)
        );
      });
      
      console.log(`✅ Найдено устройств СКУД: ${accessDevices.length} из ${allDevices.length}`);
      */
	  
      // Если не найдено, показываем все
      if (accessDevices.length === 0) {
        console.log('⚠️ Устройств СКУД не найдено, показываем все устройства');
        return allDevices;
      }
      
      return accessDevices;
    } catch (error) {
      console.error('❌ Ошибка при получении устройств СКУД:', error);
      return getMockAccessDevices();
    }
  },
  
  // Получение статистики по статусам
  getStatusStats: async (): Promise<Record<string, number>> => {
    try {
      const devices = await equipmentApi.getAllDevices();
      
      return devices.reduce((acc: Record<string, number>, device: Device) => {
        const status = device.status || 'Неизвестно';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
    } catch (error) {
      console.error('❌ Ошибка при получении статистики:', error);
      return { 'Норма': 3, 'Внимание': 1, 'Ошибка': 0 };
    }
  }
};

// Маппинг статусов
const mapStatus = (status?: string): string => {
  if (!status) return 'Неизвестно';
  
  const statusMap: Record<string, string> = {
    // Кириллица
    'норма': 'Норма',
    'работает': 'Норма',
    'исправен': 'Норма',
    'внимание': 'Внимание',
    'предупреждение': 'Внимание',
    'ошибка': 'Ошибка',
    'неисправен': 'Ошибка',
    'отключен': 'Отключен',
    // Английские аналоги
    'normal': 'Норма',
    'ok': 'Норма',
    'working': 'Норма',
    'warning': 'Внимание',
    'error': 'Ошибка',
    'fault': 'Ошибка',
    'disabled': 'Отключен',
    'offline': 'Отключен',
  };
  
  const lowerStatus = status.toLowerCase().trim();
  return statusMap[lowerStatus] || status;
};

// Тестовые данные для СКУД
const getMockAccessDevices = (): Device[] => {
  console.log('⚠️ Используем тестовые данные для СКУД');
  
  return [
    { 
      id: 1, 
      name: 'Контроллер доступа №1', 
      type: 'Контроллер СКУД', 
      status: 'Норма', 
      location: 'Главный вход',
      model: 'AC-100',
      serialNumber: 'SN001',
      ipAddress: '192.168.1.100',
      lastMaintenance: '2023-10-15',
      nextMaintenance: '2024-04-15',
    },
    { 
      id: 2, 
      name: 'Считыватель карт №5', 
      type: 'Считыватель СКУД', 
      status: 'Внимание', 
      location: 'Запасной выход',
      model: 'RFID-200',
      serialNumber: 'SN002',
      lastMaintenance: '2023-09-20',
      nextMaintenance: '2024-03-20',
    },
    { 
      id: 3, 
      name: 'Замок главного входа', 
      type: 'Замок СКУД', 
      status: 'Норма', 
      location: 'Главный вход',
      model: 'EL-300',
      serialNumber: 'SN003',
      lastMaintenance: '2023-11-05',
      nextMaintenance: '2024-05-05',
    },
  ];
};

// Общие тестовые данные
const getMockDevices = (): Device[] => {
  return getMockAccessDevices();
};