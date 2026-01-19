// src/types/index.ts
export * from './equipment';
export * from './user';

export enum SystemType {
  ACCESS = 'access',
  CCTV = 'cctv',
  HVAC = 'hvac'
}

export enum EquipmentType {
  CONTROLLER = 'controller',
  READER = 'reader',
  LOCK = 'lock',
  CAMERA = 'camera',
  RECORDER = 'recorder',
  SERVER = 'server',
  PUMP = 'pump',
  VALVE = 'valve',
  SENSOR = 'sensor'
}

export enum StatusType {
  NORMAL = 'normal',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

export type Equipment = any;
export type EquipmentParameter = any;
export type MaintenanceSchedule = any;