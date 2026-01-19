export interface Equipment {
  id: string;
  name: string;
  type: string;
  status: string;
  location: string;
}

export interface EquipmentParameter {
  name: string;
  value: string;
  status: string;
}

export interface MaintenanceSchedule {
  id: string;
  equipmentId: string;
  type: string;
  plannedDate: string;
  status: string;
}