// types/access.ts
export interface AccessDevice {
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
  onlineUsers?: number;
  batteryLevel?: number;
  isOnline?: boolean;
}

export interface ActivityDataPoint {
  timestamp: string;
  value: number;
  type: string;
}

export interface AccessMaintenanceTask {
  id: string;
  task: string;
  taskDate: string;
  action: string;
  type: string;
  device: string;
  user: string;
  realDate: string | null;
}