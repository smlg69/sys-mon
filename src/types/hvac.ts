// types/hvac.ts
import { SelectChangeEvent } from "@mui/material";

// Базовые типы данных
export interface HVACDevice {
  id: string;
  name: string;
  type: string;
  status: "normal" | "warning" | "critical";
  value: string;
  temperature?: number;
  group?: string;
  deviceId?: string;
  deviceName?: string;
  location?: string;
  timestamp?: string;
  description: string;
  param?: string;
  active?: boolean;
  dislocation?: string;
}

export interface TemperatureDataPoint {
  timestamp: string;
  temperature: number;
  node: string;
}

export interface HVACMaintenanceTask {
  id: string;
  task: string;
  taskDate: string;
  action: string;
  type: string;
  device: string;
  user: string;
  realDate: string | null;
}

export interface HTFResponseItem {
  vUpdateTime: string;
  vValue: Array<{
    [key: string]: string | number;
    volumeDate: string;
    id: string;
  }>;
}

export interface TblValuesItem {
  param?: string;
  name?: string;
  id?: string;
  value?: string | number;
  data?: string | number;
  val?: string | number;
  timestamp?: string;
  time?: string;
  created_at?: string;
  unit?: string;
  [key: string]: any;
}

export interface HTFDataPoint {
  timestamp: string;
  value: number;
  param: string;
}