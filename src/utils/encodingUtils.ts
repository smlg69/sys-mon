/**
 * Утилиты для работы с кодировками
 */

// Основная функция декодирования текста из CP1251/Windows-1251
export function decodeCp1251(text: string): string {
  if (!text || typeof text !== 'string') {
    return text || '';
  }
  
  // Если текст уже нормальный (содержит кириллицу без кракозябров)
  if (/[А-Яа-яЁё]/.test(text) && !/РЎ|Рў|Р Р|Р›|Рњ|Рќ/.test(text)) {
    return text;
  }
  
  try {
    return decodeCp1251TextDecoder(text);
  } catch (error) {
    console.warn('TextDecoder не сработал, пробуем ручное декодирование:', error);
    return decodeCp1251Manual(text);
  }
}

// Использование TextDecoder API (самый правильный способ)
function decodeCp1251TextDecoder(text: string): string {
  // Проверяем наличие TextDecoder
  if (typeof TextDecoder === 'undefined') {
    throw new Error('TextDecoder не поддерживается');
  }
  
  // Преобразуем строку в массив байтов
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i) & 0xFF;
  }
  
  // Пробуем разные кодировки
  const encodings = ['windows-1251', 'cp1251', 'koi8-r', 'iso-8859-5'];
  
  for (const encoding of encodings) {
    try {
      const decoder = new TextDecoder(encoding);
      const decoded = decoder.decode(bytes);
      
      // Проверяем результат - ищем явные признаки неправильного декодирования
      if (!hasCp1251Gibberish(decoded) && decoded !== text) {
        return decoded;
      }
    } catch (e) {
      // Пробуем следующую кодировку
      continue;
    }
  }
  
  throw new Error('Не удалось декодировать с помощью TextDecoder');
}

// Ручное декодирование CP1251
function decodeCp1251Manual(text: string): string {
  let result = '';
  
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    
    // Таблица соответствия CP1251 → UTF-16 для кириллических символов
    if (code >= 0xC0 && code <= 0xDF) {
      // Заглавные буквы А-Я (без Ё)
      result += String.fromCharCode(code + 0x350);
    } else if (code >= 0xE0 && code <= 0xFF) {
      // Строчные буквы а-я (без ё)
      result += String.fromCharCode(code + 0x350);
    } else if (code === 0xA8) {
      // Ё
      result += 'Ё';
    } else if (code === 0xB8) {
      // ё
      result += 'ё';
    } else {
      // Оставляем другие символы как есть
      result += text[i];
    }
  }
  
  return result;
}

// Проверка на наличие "кракозябров" от двойного декодирования
function hasCp1251Gibberish(text: string): boolean {
  // Паттерны кракозябров, которые появляются при двойном декодировании
  const gibberishPatterns = [
    /РЎ/g, /Рў/g, /Р Р/g, /Р›/g, /Рњ/g, /Рќ/g,
    /СЂ/g, /С‚/g, /С /g, /С›/g, /Сњ/g, /Сќ/g
  ];
  
  return gibberishPatterns.some(pattern => pattern.test(text));
}

// Альтернативный метод: декодирование через Base64 (если сервер может отдавать в таком виде)
export function decodeBase64(text: string): string {
  try {
    return atob(text);
  } catch (error) {
    console.error('Ошибка декодирования Base64:', error);
    return text;
  }
}

// Универсальная функция декодирования с автоматическим определением
export function autoDecode(text: string): string {
  if (!text) return '';
  
  // Если это похоже на кракозябры от двойного декодирования UTF-8 как CP1251
  if (isDoubleEncoded(text)) {
    return fixDoubleEncoding(text);
  }
  
  // Пробуем стандартное декодирование
  return decodeCp1251(text);
}

// Проверка на двойное кодирование (UTF-8 → CP1251 → UTF-8)
function isDoubleEncoded(text: string): boolean {
  return /Ð|Ñ|Ð|Ñ/.test(text) || 
         /Â|Ã|Ä|Å/.test(text) ||
         /[À-Ïà-ï]/.test(text);
}

// Исправление двойного кодирования
function fixDoubleEncoding(text: string): string {
  try {
    // Преобразуем в байты из текущей строки
    const utf8Bytes = new TextEncoder().encode(text);
    
    // Интерпретируем эти байты как CP1251 и декодируем обратно
    const decoder = new TextDecoder('windows-1251');
    const intermediate = decoder.decode(utf8Bytes);
    
    // Теперь intermediate содержит однократно закодированный UTF-8
    // Преобразуем снова в байты и декодируем как UTF-8
    const finalBytes = new TextEncoder().encode(intermediate);
    return new TextDecoder('utf-8').decode(finalBytes);
  } catch (error) {
    console.error('Ошибка исправления двойного кодирования:', error);
    return text;
  }
}