// src/services/hvacDataService.ts
import { apiClient } from "../api/client";
import { SystemParameter, TemperatureDataPoint } from "../types/equipment";
import { equipmentTypeService, EquipmentType } from "./equipmentTypeService";

interface EquipmentTypeWithBackendField extends EquipmentType {
  backendField: string; // Делаем обязательным
}

export interface ParameterRange {
  id: string;
  name: string;
  min: number;
  max: number;
  unit: string;
}

export interface ParameterConfig {
  backendField: string;
  displayName: string;
  unit: string;
  defaultValue: number;
}

export interface EquipmentData {
  value: number;
  unit: string;
  timestamp: string;
  status: "normal" | "warning" | "critical";
  equipmentType: EquipmentType;
}

class HVACDataService {
  private parameterRanges: Map<string, ParameterRange> = new Map();
  private parameterConfigs: Map<string, ParameterConfig> = new Map();
  private isInitialized = false;

  // Инициализация сервиса
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log("🔄 Инициализация HVACDataService...");
      
      // Инициализируем сервис типов оборудования
      await equipmentTypeService.initialize();
      
      // Загружаем конфигурацию параметров
      await this.loadParameterConfigs();
      
      // Загружаем диапазоны значений с бэкенда
      await this.loadParameterRanges();
      
      this.isInitialized = true;
      console.log("✅ HVACDataService инициализирован");
    } catch (error) {
      console.error("❌ Ошибка инициализации HVACDataService:", error);
    }
  }

  // Загрузка конфигурации параметров
  private async loadParameterConfigs(): Promise<void> {
    // Получаем типы оборудования для ЖКХ
    const hkxTypes = equipmentTypeService.getEquipmentTypesByGroup("hkх");
    
    // Создаем конфигурацию на основе типов оборудования
    hkxTypes.forEach(type => {
      if (type.backendField) {
        this.parameterConfigs.set(type.backendField, {
          backendField: type.backendField,
          displayName: type.displayName || type.type,
          unit: type.unit || "",
          defaultValue: this.getDefaultValueByType(type.type),
        });
      }
    });

    // Если не загрузились типы, используем конфигурацию по умолчанию
    if (this.parameterConfigs.size === 0) {
      console.log("⚠️ Используем конфигурацию параметров по умолчанию");
      const defaultConfigs: ParameterConfig[] = [
        {
          backendField: "tu1",
          displayName: "Температура котла",
          unit: "°C",
          defaultValue: 65,
        },
        {
          backendField: "pressure1",
          displayName: "Давление системы",
          unit: "бар",
          defaultValue: 3.2,
        },
        {
          backendField: "flowAir1",
          displayName: "Расход воздуха",
          unit: "м³/ч",
          defaultValue: 8.5,
        },
        {
          backendField: "flowWater1",
          displayName: "Расход воды",
          unit: "м³/ч",
          defaultValue: 12.5,
        },
        {
          backendField: "t1",
          displayName: "Температура общая",
          unit: "°C",
          defaultValue: 22,
        },
      ];

      defaultConfigs.forEach(config => {
        this.parameterConfigs.set(config.backendField, config);
      });
    }
    
    console.log(`📋 Загружено ${this.parameterConfigs.size} конфигураций параметров`);
  }

  // Загрузка диапазонов с бэкенда
  private async loadParameterRanges(): Promise<void> {
    try {
      const response = await apiClient.post("/getMinMaxValueF", [
        { system: "hvac" }
      ]);

      if (response && Array.isArray(response)) {
        response.forEach((range: any) => {
          if (range.parameter && range.min !== undefined && range.max !== undefined) {
            const config = this.parameterConfigs.get(range.parameter);
            if (config) {
              this.parameterRanges.set(range.parameter, {
                id: range.parameter,
                name: config.displayName,
                min: parseFloat(range.min) || this.getDefaultMin(range.parameter),
                max: parseFloat(range.max) || this.getDefaultMax(range.parameter),
                unit: config.unit,
              });
              console.log(`📊 Диапазон для ${range.parameter}: ${range.min}-${range.max}${config.unit}`);
            }
          }
        });
      }
    } catch (error) {
      console.warn("⚠️ Не удалось загрузить диапазоны с бэкенда, используем значения по умолчанию");
      this.setDefaultRanges();
    }
  }

  // Установка диапазонов по умолчанию
  private setDefaultRanges(): void {
    const defaultRanges: ParameterRange[] = [
      { id: "tu1", name: "Температура котла", min: 50, max: 90, unit: "°C" },
      { id: "pressure1", name: "Давление системы", min: 2.5, max: 4.0, unit: "бар" },
      { id: "flowAir1", name: "Расход воздуха", min: 5, max: 15, unit: "м³/ч" },
      { id: "flowWater1", name: "Расход воды", min: 8, max: 20, unit: "м³/ч" },
      { id: "t1", name: "Температура общая", min: 18, max: 26, unit: "°C" },
    ];

    defaultRanges.forEach(range => {
      this.parameterRanges.set(range.id, range);
    });
  }

  // Получение диапазона для параметра
  getParameterRange(parameterId: string): ParameterRange {
    return this.parameterRanges.get(parameterId) || {
      id: parameterId,
      name: parameterId,
      min: 0,
      max: 100,
      unit: "",
    };
  }

  // Получение конфигурации параметра
  getParameterConfig(parameterId: string): ParameterConfig {
    return this.parameterConfigs.get(parameterId) || {
      backendField: parameterId,
      displayName: parameterId,
      unit: "",
      defaultValue: 0,
    };
  }

  // ========== НОВЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С ОБОРУДОВАНИЕМ ==========

  // Извлечение данных для конкретного типа оборудования
extractDataForEquipment(data: any, equipmentType: EquipmentTypeWithBackendField): EquipmentData {
  console.log(`🔍 Извлечение данных для: ${equipmentType.displayName}`);
  console.log(`   Поле в данных: ${equipmentType.backendField}`);
  
  const value = this.extractValueByField(data, equipmentType.backendField);
  const range = this.getParameterRange(equipmentType.backendField);
  const status = this.getParamStatus(value, range.min, range.max);
  
  return {
    value,
    unit: equipmentType.unit || "",
    timestamp: new Date().toISOString(),
    status,
    equipmentType,
  };
}

  // Извлечение значения по конкретному полю
  private extractValueByField(data: any, field: string | undefined): number {
  if (!field || !data) {
    console.log(`   ⚠️ Нет поля или данных`);
    return 0;
  }

  console.log(`   🔎 Поиск поля "${field}" в данных...`);

  // Стратегия 1: Ищем поле в корне данных
  if (data[field] !== undefined) {
    const value = this.extractSingleValue(data[field]);
    console.log(`   ✅ Найдено в корне: ${value}`);
    return value;
  }

    // Стратегия 2: Ищем в массивах (tu, pressure и т.д.)
    const baseField = this.extractBaseField(field); // tu1 -> tu
    if (data[baseField] && Array.isArray(data[baseField])) {
      const value = this.extractFromHistoryArray(data[baseField], field);
      if (value !== 0) {
        console.log(`   ✅ Найдено в массиве ${baseField}: ${value}`);
        return value;
      }
    }

    // Стратегия 3: Ищем во всех массивах
    for (const key in data) {
      if (Array.isArray(data[key])) {
        const value = this.extractFromHistoryArray(data[key], field);
        if (value !== 0) {
          console.log(`   ✅ Найдено в массиве ${key}: ${value}`);
          return value;
        }
      }
    }

    // Стратегия 4: Ищем похожие поля (t1, t2, tu1, tu2 и т.д.)
    const similarFields = this.findSimilarFields(data, field);
    if (similarFields.length > 0) {
      const firstField = similarFields[0];
      const value = this.extractValueByField(data, firstField);
      console.log(`   🔄 Используем похожее поле "${firstField}": ${value}`);
      return value;
    }

    console.log(`   ❌ Не найдено поле "${field}" в данных`);
    return this.getDefaultValueByField(field);
  }

  // Извлечение из исторического массива
  private extractFromHistoryArray(dataArray: any[], field: string): number {
    if (!Array.isArray(dataArray) || dataArray.length === 0) return 0;
    
    // Берем последнюю запись (самую свежую)
    const latestRecord = dataArray[0];
    if (!latestRecord || !latestRecord.vValue || !Array.isArray(latestRecord.vValue) || latestRecord.vValue.length === 0) {
      return 0;
    }
    
    const vValue = latestRecord.vValue[0];
    
    // Прямой поиск поля
    if (vValue[field] !== undefined) {
      return this.extractSingleValue(vValue[field]);
    }
    
    // Поиск по базовому имени (tu1 -> tu)
    const baseField = this.extractBaseField(field);
    for (const key in vValue) {
      if (key.includes(baseField)) {
        return this.extractSingleValue(vValue[key]);
      }
    }
    
    return 0;
  }

  // Получение данных для графика по типу оборудования
getChartDataForEquipment(data: any, equipmentType: EquipmentTypeWithBackendField, hours: number = 24): TemperatureDataPoint[] {
  const chartData: TemperatureDataPoint[] = [];
  const field = equipmentType.backendField;
  const baseField = this.extractBaseField(field);
  
  console.log(`📈 Создание графика для ${equipmentType.displayName}`);
  console.log(`   Поле: ${field}, Базовое поле: ${baseField}`);

  if (!data || !data[baseField] || !Array.isArray(data[baseField])) {
    console.log(`   ⚠️ Нет данных для ${baseField}, используем fallback`);
    return this.generateFallbackChartData(
      this.getDefaultValueByType(equipmentType.type), 
      hours,
      equipmentType.displayName
    );
  }

  const historyArray = data[baseField];
  
  historyArray.forEach((record: any, index: number) => {
    if (record && record.vValue && Array.isArray(record.vValue) && record.vValue.length > 0) {
      const vValue = record.vValue[0];
      let value = 0;
      
      // Ищем поле - безопасный доступ
      const fieldValue = field ? vValue[field] : undefined;
      if (fieldValue !== undefined) {
        value = this.extractSingleValue(fieldValue);
      } else {
        // Ищем похожие поля
        for (const key in vValue) {
          if (key.includes(baseField)) {
            value = this.extractSingleValue(vValue[key]);
            break;
          }
        }
      }
      
      const timestamp = record.vUpdateTime || (vValue.volumeDate || new Date().toISOString());
      
      chartData.push({
        timestamp,
        temperature: value, // Используем как общее значение для графика
      });
    }
  });

  if (chartData.length > 0) {
    console.log(`   ✅ Создано ${chartData.length} точек`);
    return chartData;
  }

  console.log(`   ⚠️ Не удалось создать график, используем fallback`);
  return this.generateFallbackChartData(
    this.getDefaultValueByType(equipmentType.type), 
    hours,
    equipmentType.displayName
  );
}


  // Получение всех параметров системы
getAllSystemParameters(data: any): SystemParameter[] {
  const parameters: SystemParameter[] = [];
  
  // Получаем все типы оборудования для ЖКХ
  const hkxTypes = equipmentTypeService.getEquipmentTypesByGroup("hkх");
  
  hkxTypes.forEach(type => {
    // Проверяем что backendField существует
    if (type.backendField) {
      // Приводим к типу с обязательным backendField
      const equipmentTypeWithField = type as EquipmentTypeWithBackendField;
      const equipmentData = this.extractDataForEquipment(data, equipmentTypeWithField);
      const range = this.getParameterRange(type.backendField);
      
      parameters.push({
        id: type.id,
        name: type.displayName || type.type,
        value: equipmentData.value,
        unit: type.unit || "",
        min: range.min,
        max: range.max,
        timestamp: equipmentData.timestamp,
        status: equipmentData.status,
      });
    }
  });

  return parameters;
}

  // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

  private extractSingleValue(item: any): number {
    if (item === null || item === undefined) return 0;
    
    if (typeof item === 'number') return item;
    
    if (typeof item === 'string') {
      const normalized = item.replace(',', '.');
      const num = parseFloat(normalized);
      return isNaN(num) ? 0 : num;
    }
    
    return 0;
  }

  private extractBaseField(field: string): string {
    // Извлекаем базовое поле: tu1 -> tu, pressure2 -> pressure
    return field.replace(/\d+$/, '');
  }

private findSimilarFields(data: any, targetField: string): string[] {
  const similarFields: string[] = [];
  const baseField = this.extractBaseField(targetField);
  
  // Поиск в корне
  for (const key in data) {
    if (key.includes(baseField)) {
      similarFields.push(key);
    }
  }
  
  // Поиск в массивах
  for (const key in data) {
    if (Array.isArray(data[key]) && data[key].length > 0) {
      const firstRecord = data[key][0];
      if (firstRecord && firstRecord.vValue && Array.isArray(firstRecord.vValue) && firstRecord.vValue.length > 0) {
        const vValue = firstRecord.vValue[0];
        for (const vKey in vValue) {
          if (vKey.includes(baseField)) {
            similarFields.push(vKey);
          }
        }
      }
    }
  }
  // Удаляем дубликаты без использования Set (для совместимости с ES5)
  const uniqueFields: string[] = [];
  similarFields.forEach(field => {
    if (!uniqueFields.includes(field)) {
      uniqueFields.push(field);
    }
  });
  
  return uniqueFields;
}


  private getParamStatus(value: number, min: number, max: number): "normal" | "warning" | "critical" {
    if (value < min * 0.9 || value > max * 1.1) return "critical";
    if (value < min || value > max) return "warning";
    return "normal";
  }

  private getDefaultValueByType(equipmentType: string): number {
    const defaults: Record<string, number> = {
      "тепловой узел": 65,
      "котел": 65,
      "датчик": 22,
      "насос": 3.2,
      "вентиляция": 8.5,
      "щит": 220,
      "клапан": 50,
    };
    return defaults[equipmentType] || 0;
  }

  private getDefaultValueByField(field: string): number {
    const config = this.getParameterConfig(field);
    return config.defaultValue;
  }

  // Генерация тестовых данных (fallback)
public generateFallbackChartData(baseValue: number, hours: number = 24, title: string = ""): TemperatureDataPoint[] {
  console.log("🔄 Создание fallback данных для", title);
  
  const data: TemperatureDataPoint[] = [];
  const now = new Date();
  
  // Диапазон значений для разных типов оборудования
  const valueRange = {
    boiler: { min: 60, max: 80, base: 70 },
    pump: { min: 2.5, max: 4.5, base: 3.5 },
    ventilation: { min: 18, max: 28, base: 22 },
    shield: { min: 210, max: 230, base: 220 },
    sensor: { min: 18, max: 26, base: 22 }
  };
  
  // Определяем тип оборудования из title или используем baseValue
  let type = "boiler";
  if (title.toLowerCase().includes("вент") || title.toLowerCase().includes("vent")) {
    type = "ventilation";
  } else if (title.toLowerCase().includes("насос") || title.toLowerCase().includes("pump")) {
    type = "pump";
  } else if (title.toLowerCase().includes("щит") || title.toLowerCase().includes("shield")) {
    type = "shield";
  } else if (title.toLowerCase().includes("датчик") || title.toLowerCase().includes("sensor")) {
    type = "sensor";
  }
  
  const range = valueRange[type as keyof typeof valueRange] || valueRange.boiler;
  const actualBaseValue = baseValue || range.base;
  
  console.log(`📊 Параметры fallback: type=${type}, baseValue=${actualBaseValue}, hours=${hours}`);
  
  // Генерируем реалистичные данные с колебаниями
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now);
    timestamp.setHours(timestamp.getHours() - i);
    
    // Добавляем естественные колебания
    const hourFactor = timestamp.getHours();
    let value: number;
    
    if (type === "ventilation") {
      // Для вентиляции: днем выше, ночью ниже
      const isDayTime = hourFactor >= 8 && hourFactor <= 20;
      const baseTemp = isDayTime ? actualBaseValue + 2 : actualBaseValue - 2;
      value = baseTemp + Math.sin(i * 0.5) * 1.5 + Math.random() * 0.5;
    } else if (type === "boiler") {
      // Для котла: небольшие колебания вокруг базового значения
      value = actualBaseValue + Math.sin(i * 0.3) * 2 + Math.random() * 0.3;
    } else if (type === "pump") {
      // Для насосов: стабильное давление с небольшими отклонениями
      value = actualBaseValue + Math.cos(i * 0.4) * 0.3 + Math.random() * 0.1;
    } else if (type === "shield") {
      // Для щитов: стабильное напряжение
      value = actualBaseValue + (Math.random() - 0.5) * 0.5;
    } else {
      // Для датчиков: естественные колебания
      const timeOfDayFactor = Math.sin(hourFactor * Math.PI / 12) * 2;
      value = actualBaseValue + timeOfDayFactor + (Math.random() - 0.5);
    }
    
    // Ограничиваем значение допустимым диапазоном
    value = Math.max(range.min, Math.min(range.max, value));
    
    data.push({
      timestamp: timestamp.toISOString(),
      temperature: parseFloat(value.toFixed(1)),
      pressure: type === "pump" ? parseFloat((actualBaseValue + Math.random() * 0.2).toFixed(1)) : undefined,
      flow: type === "ventilation" ? parseFloat((200 + Math.random() * 50).toFixed(1)) : undefined,
    });
  }
  
  console.log(`📊 Создано ${data.length} fallback точек`, 
    `диапазон: ${Math.min(...data.map(d => d.temperature)).toFixed(1)}-${Math.max(...data.map(d => d.temperature)).toFixed(1)}`);
  
  return data;
}


  // Вспомогательные функции для значений по умолчанию
  private getDefaultMin(parameter: string): number {
    const defaults: Record<string, number> = {
      "tu1": 50, "tu2": 50, "tu3": 50, "tu4": 50,
      "pressure1": 2.5, "pressure2": 2.5,
      "flowAir1": 5, "flowAir2": 5,
      "flowWater1": 8, "flowWater2": 8,
      "t1": 18, "t2": 18, "t3": 18,
    };
    return defaults[parameter] || 0;
  }

  private getDefaultMax(parameter: string): number {
    const defaults: Record<string, number> = {
      "tu1": 90, "tu2": 90, "tu3": 90, "tu4": 90,
      "pressure1": 4.0, "pressure2": 4.0,
      "flowAir1": 15, "flowAir2": 15,
      "flowWater1": 20, "flowWater2": 20,
      "t1": 26, "t2": 26, "t3": 26,
    };
    return defaults[parameter] || 100;
  }
}

export const hvacDataService = new HVACDataService();