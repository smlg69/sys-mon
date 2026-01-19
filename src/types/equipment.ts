// ========== ОСНОВНЫЕ ТИПЫ ОБОРУДОВАНИЯ ==========

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

export interface Equipment {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
}

// ========== ДВЕ ВЕРСИИ ПАРАМЕТРОВ (для совместимости) ==========

// Простая версия (для старого кода)
export interface SimpleEquipmentParameter {
  name: string;
  value: string;
  status: string;
}

// Расширенная версия (для нового кода HVAC)
export interface EquipmentParameter {
  id: string;
  name: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  timestamp: string;
  status: "normal" | "warning" | "critical";
  group?: string;
  type?: string;
  parameter?: string;
}

// ========== ТИПЫ ДЛЯ КОНФИГУРАЦИИ ==========

export interface EquipmentType {
  id: string;
  type: string;
  group: string;
  parameter: string;
  displayName: string;
  unit: string;
  min: number;
  max: number;
  color?: string;
}

export interface EquipmentDataPoint {
  timestamp: string;
  value: number;
  parameterId: string;
}

// ========== ТИПЫ ДЛЯ ОБСЛУЖИВАНИЯ ==========

export interface MaintenanceSchedule {
  id: string;
  equipmentId: string;
  type: string;
  plannedDate: string;
  status: string;
}

// ========== ТИПЫ ДЛЯ HVAC СИСТЕМЫ ==========

export interface SystemParameter {
  id: string;
  name: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  timestamp: string;
  status: "normal" | "warning" | "critical";
}

export interface TemperatureDataPoint {
  timestamp: string;
  temperature: number;
  pressure?: number;
  flow?: number;
}

export interface EquipmentNode {
  id: string;
  name: string;
  type: "boiler" | "pump" | "ventilation" | "shield" | "sensor";
  status: "normal" | "warning" | "critical";
  x: number;
  y: number;
  value: string;
  parameters: SystemParameter[];
}

// ========== ХЕЛПЕР-ФУНКЦИИ ==========

export const convertToSimpleParameter = (param: EquipmentParameter): SimpleEquipmentParameter => ({
  name: param.name,
  value: param.value.toString(),
  status: param.status
});

export const convertToEquipmentParameter = (simple: SimpleEquipmentParameter, defaults?: Partial<EquipmentParameter>): EquipmentParameter => ({
  id: defaults?.id || `param_${Date.now()}`,
  name: simple.name,
  value: parseFloat(simple.value) || 0,
  unit: defaults?.unit || "",
  min: defaults?.min || 0,
  max: defaults?.max || 100,
  timestamp: defaults?.timestamp || new Date().toISOString(),
  status: (simple.status as "normal" | "warning" | "critical") || "normal",
  group: defaults?.group,
  type: defaults?.type,
  parameter: defaults?.parameter
});
