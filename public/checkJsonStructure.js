// Скрипт для проверки структуры JSON данных в браузере
async function checkJsonStructure() {
  console.log("=== ПРОВЕРКА СТРУКТУРЫ JSON ДАННЫХ ===");

  try {
    // Проверяем данные с разных эндпоинтов
    const endpoints = [
      "tblDevices",
      "currentValues",
      "devices",
      "equipment",
      "hvac/devices",
    ];

    const baseUrl = window.location.origin;

    for (const endpoint of endpoints) {
      try {
        console.log(`\n--- Проверка эндпоинта: ${endpoint} ---`);
        const response = await fetch(`${baseUrl}/api/${endpoint}`);

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Успешно получены данные с ${endpoint}`);

          // Анализируем структуру
          analyzeStructure(data, endpoint);

          // Если это устройства, выводим несколько примеров
          if (Array.isArray(data) && data.length > 0) {
            console.log("Пример первого элемента:");
            console.log(JSON.stringify(data[0], null, 2));

            // Проверяем наличие HVAC устройств
            const hvacDevices = data.filter((item) => {
              const group = item.group || item.Group || item.GROUP || "";
              return group.toString().toLowerCase().includes("hvac");
            });
            console.log(`HVAC устройств найдено: ${hvacDevices.length}`);

            // Проверяем наличие необходимых полей
            if (data[0]) {
              const requiredFields = [
                "id",
                "name",
                "type",
                "status",
                "value",
                "temperature",
              ];
              const missingFields = requiredFields.filter(
                (field) => !(field in data[0]),
              );

              if (missingFields.length > 0) {
                console.warn(
                  `⚠️ Отсутствуют поля: ${missingFields.join(", ")}`,
                );
                console.log("Доступные поля:", Object.keys(data[0]));
              }
            }
          }
        } else {
          console.log(
            `❌ Не удалось получить данные с ${endpoint}: ${response.status}`,
          );
        }
      } catch (err) {
        console.log(`❌ Ошибка при запросе ${endpoint}:`, err.message);
      }
    }

    // Проверяем WebSocket подключение
    if (window.WS_URL) {
      console.log("\n--- Проверка WebSocket ---");
      console.log(`WebSocket URL: ${window.WS_URL}`);
    } else {
      console.log("\n⚠️ WS_URL не настроен");
    }
  } catch (error) {
    console.error("Ошибка при проверке структуры:", error);
  }
}

function analyzeStructure(data, endpoint) {
  if (Array.isArray(data)) {
    console.log(`Тип: Массив, элементов: ${data.length}`);

    if (data.length > 0) {
      const sample = data[0];
      console.log("Типы полей первого элемента:");

      Object.keys(sample).forEach((key) => {
        const value = sample[key];
        console.log(
          `  ${key}: ${typeof value} (${JSON.stringify(value).substring(0, 50)}...)`,
        );
      });

      // Проверяем типы устройств
      const deviceTypes = [
        ...new Set(data.map((item) => item.type || item.Type || "неизвестно")),
      ];
      console.log(`Типы устройств: ${deviceTypes.join(", ")}`);

      // Проверяем статусы
      const statuses = [
        ...new Set(
          data.map((item) => item.status || item.Status || "неизвестно"),
        ),
      ];
      console.log(`Статусы: ${statuses.join(", ")}`);
    }
  } else if (typeof data === "object" && data !== null) {
    console.log(`Тип: Объект`);

    // Проверяем структуру пагинированного ответа
    if (data.data && Array.isArray(data.data)) {
      console.log(`Пагинированный ответ: ${data.data.length} элементов`);
      console.log(`Всего: ${data.total || "не указано"}`);

      if (data.data.length > 0) {
        analyzeStructure(data.data, `${endpoint}.data`);
      }
    } else {
      console.log("Поля объекта:", Object.keys(data));
    }
  } else {
    console.log(`Тип: ${typeof data}, значение: ${data}`);
  }
}

// Добавляем функцию в глобальную область видимости
window.checkJsonStructure = checkJsonStructure;

// Автоматически запускаем проверку при загрузке страницы
window.addEventListener("load", () => {
  console.log("Для проверки структуры JSON выполните: checkJsonStructure()");

  // Автозапуск (можно отключить)
  // setTimeout(() => {
  //   checkJsonStructure();
  // }, 2000);
});
