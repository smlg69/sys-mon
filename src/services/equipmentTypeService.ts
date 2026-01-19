import { apiClient } from "../api/client";

export interface EquipmentType {
  id: string;
  type: string; // "датчик", "клапан", "насос", "тепловой узел"
  group: string; // "hkх", "access", "cctv"
  parameter: string; // "температура", "давление", "расход"
  displayName: string; // Делаем обязательным
  unit: string; // Делаем обязательным
  backendField: string; // Делаем обязательным
}

class EquipmentTypeService {
  private equipmentTypes: EquipmentType[] = [];
  private nodeMappings: Map<string, EquipmentType> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log("🔄 Загрузка типов оборудования...");
      
      const response = await apiClient.post("/getTypesF", [
        { group: "hkх" } // Или другой фильтр для ЖКХ
      ]);
      
      if (response && Array.isArray(response)) {
        this.equipmentTypes = response.map((item: any) => ({
          id: item.id,
          type: item.type || "",
          group: item.group || "",
          parameter: item.parameter || "",
          displayName: this.generateDisplayName(item),
          unit: this.getUnitByParameter(item.parameter),
          backendField: this.generateBackendField(item),
        }));
        
        console.log(`✅ Загружено ${this.equipmentTypes.length} типов оборудования`);
        this.createNodeMappings();
        this.initialized = true;
      }
    } catch (error) {
      console.error("❌ Ошибка загрузки типов оборудования:", error);
      this.setDefaultTypes();
    }
  }

private generateDisplayName(item: { type: string; parameter: string }): string {
  const typeNames: Record<string, string> = {
    "датчик": "Датчик",
    "тепловой узел": "Тепловой узел",
    "клапан": "Клапан",
    "насос": "Насос",
    "котел": "Котел",
    "вентиляция": "Вентиляция",
    "щит": "Щит"
  };

  const paramNames: Record<string, string> = {
    "температура": "температуры",
    "давление": "давления",
    "расход воды": "расхода воды",
    "расход воздуха": "расхода воздуха",
    "влажность": "влажности",
    "мощность": "мощности"
  };

  const typeName = typeNames[item.type] || item.type;
  const paramName = paramNames[item.parameter] || item.parameter;
  
  return `${typeName} ${paramName}`;
}

  private generateBackendField(item: any): string {
    // Генерируем поле для запроса данных на основе типа и параметра
    const typeMap: Record<string, string> = {
      "тепловой узел": "tu",
      "датчик температуры": "t",
      "датчик": "t",
      "давление": "pressure",
      "расход воды": "flowWater",
      "расход воздуха": "flowAir"
    };

    const baseField = typeMap[item.type] || typeMap[item.parameter] || item.parameter.toLowerCase();
    
    // Добавляем номер если есть в id
    const match = item.id?.match(/\d+/);
    const number = match ? match[0] : "1";
    
    return `${baseField}${number}`;
  }

  private getUnitByParameter(parameter: string): string {
    const units: Record<string, string> = {
      "температура": "°C",
      "давление": "бар",
      "расход воды": "м³/ч",
      "расход воздуха": "м³/ч",
      "влажность": "%",
      "мощность": "кВт"
    };
    return units[parameter] || "";
  }

  private createNodeMappings(): void {
  // Сопоставляем узлы на схеме с типами оборудования
  const mappings: Record<string, EquipmentType> = {
    "boiler2": this.findEquipmentType("котел", "температура"),
    "pump1": this.findEquipmentType("насос", "давление"),
    "pump2": this.findEquipmentType("насос", "давление"),
    "vent5": this.findEquipmentType("вентиляция", "расход воздуха"),
    "vent6": this.findEquipmentType("вентиляция", "температура"),
    "shield3": this.findEquipmentType("щит", "мощность"),
    "shield4": this.findEquipmentType("щит", "мощность"),
    "sensor14": this.findEquipmentType("датчик", "температура"),
    "sensor15": this.findEquipmentType("датчик", "температура"),
  };

  Object.entries(mappings).forEach(([nodeId, equipmentType]) => {
    this.nodeMappings.set(nodeId, equipmentType);
    console.log(`🔗 Узел "${nodeId}" -> ${equipmentType.displayName}`);
  });
}

  private findEquipmentType(type: string, parameter: string): EquipmentType {
  const found = this.equipmentTypes.find(item => 
    item.type.includes(type) && item.parameter.includes(parameter)
  );
  
  if (found) {
    return found;
  }
  
  // Если не нашли, создаем тип по умолчанию
  return this.createDefaultEquipmentType(type, parameter);
}

  private createDefaultEquipmentType(type: string, parameter: string): EquipmentType {
  const backendField = this.generateBackendField({ type, parameter });
  
  return {
    id: `default_${type}_${parameter}_${Date.now()}`,
    type,
    group: "hkх",
    parameter,
    displayName: this.generateDisplayName({ type, parameter }),
    unit: this.getUnitByParameter(parameter),
    backendField,
  };
}

  private setDefaultTypes(): void {
    // Типы по умолчанию
    this.equipmentTypes = [
      { id: "1", type: "тепловой узел", group: "hkх", parameter: "температура", displayName: "Тепловой узел температуры", unit: "°C", backendField: "tu1" },
      { id: "2", type: "насос", group: "hkх", parameter: "давление", displayName: "Насос давления", unit: "бар", backendField: "pressure1" },
      { id: "3", type: "вентиляция", group: "hkх", parameter: "расход воздуха", displayName: "Вентиляция расхода воздуха", unit: "м³/ч", backendField: "flowAir1" },
      { id: "4", type: "датчик", group: "hkх", parameter: "температура", displayName: "Датчик температуры", unit: "°C", backendField: "t1" },
      { id: "5", type: "котел", group: "hkх", parameter: "температура", displayName: "Котел температуры", unit: "°C", backendField: "tu2" },
      { id: "6", type: "щит", group: "hkх", parameter: "мощность", displayName: "Щит мощности", unit: "кВт", backendField: "power1" },
    ];
    
    this.createNodeMappings();
    this.initialized = true;
    console.log("✅ Используются типы оборудования по умолчанию");
  }

  getEquipmentTypeForNode(nodeId: string): EquipmentType | null {
  const nodeMap: Record<string, string> = {
    'boiler2': 'tu1',
    'pump1': 'tu2', 
    'pump2': 'tu3',
    'vent5': 'tu4',
    'vent6': 'tu5',
    'shield3': 'tu6',
    'shield4': 'tu7',
    'sensor14': 'tu8',
    'sensor15': 'tu9',
  };
  
  const backendField = nodeMap[nodeId];
  if (!backendField) return null;
  
  return this.getEquipmentByBackendField(backendField);
}

getEquipmentByBackendField(field: string): EquipmentType | null {
  return this.equipmentTypes.find(type => type.backendField === field) || null;
}

  getAllEquipmentTypes(): EquipmentType[] {
    return this.equipmentTypes;
  }

  getEquipmentTypesByGroup(group: string): EquipmentType[] {
    return this.equipmentTypes.filter(item => item.group === group);
  }
}

export const equipmentTypeService = new EquipmentTypeService();