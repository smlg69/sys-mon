// types/cctv.ts
export interface CCTVDevice {
  id: string;
  name: string;
  type: string;
  status: "normal" | "warning" | "critical";
  value: string;
  group?: string;
  deviceId?: string;
  deviceName?: string;
  location?: string;
  timestamp?: string;
  description?: string;
  param?: string;
  active?: boolean;
  ipAddress?: string;
  resolution?: string;
  fps?: number;
  storageUsage?: number;
  isOnline?: boolean;
  currentValue?: number;
}

export interface CCTVDataPoint {
  timestamp: string;
  value: number;
  node: string;
  param: string;
}

export interface CCTVMaintenanceTask {
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