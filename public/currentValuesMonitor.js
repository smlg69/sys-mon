// Скрипт для анализа текущей структуры currentValues
function analyzeCurrentValuesStructure(data) {
  console.log('=== АНАЛИЗ СТРУКТУРЫ CURRENTVALUES ===');
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log('❌ Нет данных');
    return;
  }
  
  const mainData = data[0];
  console.log('Основные разделы данных:');
  
  Object.keys(mainData).forEach(category => {
    const categoryData = mainData[category];
    console.log(`\n📁 ${category.toUpperCase()}:`);
    
    if (Array.isArray(categoryData) && categoryData.length > 0) {
      const item = categoryData[0];
      console.log(`   Элементов: ${categoryData.length}`);
      console.log(`   Поля: ${Object.keys(item).join(', ')}`);
      
      // Показываем пример значений
      console.log('   Пример значений:');
      Object.entries(item).forEach(([key, value]) => {
        if (key !== 'volumeDate' && key !== 'id') {
          console.log(`     ${key}: ${value}`);
        }
      });
    }
  });
  
  // Анализ HVAC-релевантных данных
  console.log('\n🎯 HVAC-РЕЛЕВАНТНЫЕ ДАННЫЕ:');
  
  const hvacCategories = ['temperature', 'pressure', 'flowWater', 'flowAir'];
  hvacCategories.forEach(category => {
    if (mainData[category]) {
      const items = mainData[category];
      console.log(`\n🌡️  ${category}:`);
      
      if (Array.isArray(items) && items.length > 0) {
        const item = items[0];
        Object.entries(item).forEach(([key, value]) => {
          if (key.startsWith('t') || key.startsWith('p') || key.startsWith('fw') || key.startsWith('fa')) {
            const unit = category === 'temperature' ? '°C' : 
                        category === 'pressure' ? 'bar' : 
                        category === 'flowWater' ? 'м³/ч' : 'м³/ч';
            console.log(`   ${key}: ${value} ${unit}`);
          }
        });
      }
    }
  });
  
  // Создаем flat структуру для удобства
  console.log('\n📋 ПЛОСКАЯ СТРУКТУРА (для использования в коде):');
  
  const flatData = [];
  Object.keys(mainData).forEach(category => {
    const items = mainData[category];
    
    if (Array.isArray(items)) {
      items.forEach(item => {
        Object.entries(item).forEach(([key, value]) => {
          if (key !== 'volumeDate' && key !== 'id' && key !== 'id') {
            flatData.push({
              param: key,
              value: value,
              category: category,
              timestamp: item.volumeDate || new Date().toISOString(),
              unit: getUnitByCategoryAndParam(category, key)
            });
          }
        });
      });
    }
  });
  
  console.log(`Всего flat записей: ${flatData.length}`);
  console.log('Примеры flat записей:');
  flatData.slice(0, 10).forEach(item => {
    console.log(`  ${item.param}: ${item.value} ${item.unit} (${item.category})`);
  });
  
  return flatData;
}

function getUnitByCategoryAndParam(category, param) {
  switch(category) {
    case 'temperature':
      return '°C';
    case 'pressure':
      return 'bar';
    case 'flowWater':
    case 'flowAir':
      return 'м³/ч';
    case 'power':
      return 'kW';
    case 'srvCpu':
    case 'srvRam':
      return '%';
    case 'flowHuman':
      return 'чел';
    default:
      return '';
  }
}

// Функция для получения значения по параметру
function getValueByParam(data, param) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;
  
  const mainData = data[0];
  
  for (const category in mainData) {
    const items = mainData[category];
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item[param] !== undefined) {
          return {
            value: item[param],
            category: category,
            timestamp: item.volumeDate,
            unit: getUnitByCategoryAndParam(category, param)
          };
        }
      }
    }
  }
  
  return null;
}

// Функция для мониторинга изменений
class WSDataMonitor {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.data = null;
    this.callbacks = [];
    
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.onData = this.onData.bind(this);
  }
  
  connect() {
    if (this.ws) {
      console.log('WebSocket уже подключен');
      return;
    }
    
    console.log(`Подключение к WebSocket: ${this.wsUrl}`);
    this.ws = new WebSocket(this.wsUrl);
    
    this.ws.onopen = () => {
      console.log('✅ WebSocket подключен');
      
      // Подписка на переменную
      const subscribeMsg = {
        action: 'subscribe',
        variable: '/rest/v1/contexts/users.admin.models.workerLimsN/variables/currentValues'
      };
      
      this.ws.send(JSON.stringify(subscribeMsg));
      console.log('📡 Подписка отправлена');
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.data = data;
        console.log('📥 Получены новые данные:', new Date().toLocaleTimeString());
        
        // Вызываем коллбеки
        this.callbacks.forEach(callback => callback(data));
        
        // Автоматический анализ
        analyzeCurrentValuesStructure(data);
      } catch (error) {
        console.error('Ошибка парсинга данных:', error);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket ошибка:', error);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket отключен');
      this.ws = null;
    };
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      console.log('WebSocket отключен');
    }
  }
  
  onData(callback) {
    this.callbacks.push(callback);
  }
  
  getCurrentData() {
    return this.data;
  }
  
  getParamValue(param) {
    if (!this.data) return null;
    return getValueByParam(this.data, param);
  }
}

// Глобальные утилиты
window.analyzeCurrentValues = analyzeCurrentValuesStructure;
window.getValueByParam = getValueByParam;

// Автоматическое создание монитора
const wsUrl = 'ws://localhost:9443';
window.wsMonitor = new WSDataMonitor(wsUrl);

console.log('=== УТИЛИТЫ ДЛЯ РАБОТЫ С ДАННЫМИ ===');
console.log('Доступные функции:');
console.log('1. window.wsMonitor.connect() - подключиться к WebSocket');
console.log('2. window.wsMonitor.disconnect() - отключиться');
console.log('3. window.wsMonitor.getParamValue("t1") - получить значение параметра');
console.log('4. window.analyzeCurrentValues(data) - проанализировать структуру');
console.log('5. window.getValueByParam(data, "t1") - получить значение из данных');