// utils/encodingTables.ts

/**
 * Преобразование Windows-1251 → UTF-8 через смещение
 * Windows-1251: 0xC0-0xFF → русские буквы
 * UTF-16 (JavaScript): 0x0410-0x044F → русские буквы
 * Разница: 0x0410 - 0xC0 = 0x0350
 */
export const CP1251_TO_UTF8_OFFSET = 0x0350; // 848 в десятичной

/**
 * Таблица преобразования для нестандартных символов
 */
export const specialCharMap = new Map<number, string>([
  // Windows-1251 → UTF-16 коды
  [0xA8, 'Ё'],   // Ё
  [0xB8, 'ё'],   // ё
  [0x98, 'Є'],   // Украинские и т.д.
  [0x90, 'Ђ'],
  [0x9D, 'ќ'],
]);

/**
 * Функция преобразования одного символа
 */
export function convertCharCp1251ToUtf8(charCode: number): string {
  // Если это специальный символ
  if (specialCharMap.has(charCode)) {
    return specialCharMap.get(charCode)!;
  }
  
  // Русские заглавные буквы: 0xC0-0xDF
  if (charCode >= 0xC0 && charCode <= 0xDF) {
    // 0xC0 (А) → 0x0410 (А)
    return String.fromCharCode(charCode + CP1251_TO_UTF8_OFFSET);
  }
  
  // Русские строчные буквы: 0xE0-0xFF
  if (charCode >= 0xE0 && charCode <= 0xFF) {
    // 0xE0 (а) → 0x0430 (а)
    return String.fromCharCode(charCode + CP1251_TO_UTF8_OFFSET);
  }
  
  // Если не русская буква, возвращаем как есть
  return String.fromCharCode(charCode);
}

/**
 * Таблица для быстрой замены полных слов (оптимизация)
 */
export const commonWordsMap = new Map<string, string>([
  // Статусы
  ['РЎРѕР·РґР°РЅР°', 'Создана'],
  ['Р’ СЂР°Р±РѕС‚Рµ', 'В работе'],
  ['Р—Р°РєСЂС‹С‚Р°', 'Закрыта'],
  // Приоритеты
  ['РЎСЂРµРґРЅРёР№', 'Средний'],
  ['Р’С‹СЃРѕРєРёР№', 'Высокий'],
  ['РќРёР·РєРёР№', 'Низкий'],
  ['РљСЂРёС‚РёС‡РµСЃРєРёР№', 'Критический'],
  // Типы
  ['РћР±СЃР»СѓР¶РёРІР°РЅРёРµ', 'Обслуживание'],
  ['Р—Р°РјРµРЅР°', 'Замена'],
  ['Р РµРјРѕРЅС‚', 'Ремонт'],
  ['РќР°СЃС‚СЂРѕР№РєР°', 'Настройка'],
]);