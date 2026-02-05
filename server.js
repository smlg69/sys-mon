const http = require("http");
const https = require("https");
const url = require("url");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
require("dotenv").config();

// ========== КОНФИГУРАЦИЯ ==========
const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://91.240.87.214:8443";
const BACKEND_TOKEN = process.env.REACT_APP_BACKEND_TOKEN;
const PORT = process.env.REACT_APP_HTTP_PORT || 3000;
const WS_PATH = "/ws";

console.log("🚀 Конфигурация сервера:");
console.log(`  Порт: ${PORT}`);
console.log(`  Бэкенд: ${BACKEND_URL}`);
console.log(`  WebSocket путь: ${WS_PATH}`);

// ========== MIME TYPES ДЛЯ СТАТИЧЕСКИХ ФАЙЛОВ ==========
const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".map": "application/json",
};

// ========== HTTP СЕРВЕР ==========
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;

  console.log(`📨 ${req.method} ${pathname}`);

  // 1. ПРОКСИ ДЛЯ REST API (/rest/*)
  if (pathname.startsWith("/rest")) {
    proxyToBackend(req, res, parsedUrl);
    return;
  }

  // 2. WebSocket upgrade
  if (pathname === WS_PATH && req.headers.upgrade === "websocket") {
    // Обрабатывается в server.on('upgrade')
    return;
  }

  // 3. СТАТИЧЕСКИЕ ФАЙЛЫ ИЗ BUILD
  serveStaticFile(req, res, parsedUrl);
});

// ========== ФУНКЦИЯ ПРОКСИ ==========
function proxyToBackend(req, res, parsedUrl) {
  const backendUrl = new URL(BACKEND_URL);
  const targetPath = parsedUrl.pathname + (parsedUrl.search || "");

  console.log(
    `📤 Прокси: ${parsedUrl.pathname} -> ${backendUrl.origin}${targetPath}`,
  );

  const options = {
    hostname: backendUrl.hostname,
    port: backendUrl.port || 8443,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      Authorization: `Bearer ${BACKEND_TOKEN}`,
      Host: backendUrl.hostname,
    },
    rejectUnauthorized: false,
  };

  // Удаляем нежелательные заголовки
  delete options.headers["content-length"];

  const proxyReq = https.request(options, (proxyRes) => {
    console.log(`📥 Ответ от бэкенда: ${proxyRes.statusCode} ${targetPath}`);

    // Копируем заголовки
    res.writeHead(proxyRes.statusCode, proxyRes.headers);

    // Передаем тело ответа
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    console.error(`❌ Ошибка прокси: ${err.message}`);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Proxy error", details: err.message }));
  });

  // Передаем тело запроса если есть
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    req.pipe(proxyReq);
  } else {
    proxyReq.end();
  }
}

// ========== ФУНКЦИЯ ОТДАЧИ СТАТИЧЕСКИХ ФАЙЛОВ ==========
function serveStaticFile(req, res, parsedUrl) {
  let filePath = parsedUrl.pathname;

  // Если корень или не найден файл - отдаем index.html (SPA)
  if (filePath === "/" || filePath === "") {
    filePath = "/index.html";
  }

  const fullPath = path.join(__dirname, "build", filePath);
  const extname = path.extname(fullPath).toLowerCase();
  const contentType = mimeTypes[extname] || "application/octet-stream";

  fs.readFile(fullPath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        // Файл не найден - отдаем index.html для SPA роутинга
        const indexPath = path.join(__dirname, "build", "index.html");
        fs.readFile(indexPath, (err, data) => {
          if (err) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("404 Not Found");
          } else {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(data, "utf-8");
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
}

// ========== WEBSOCKET СЕРВЕР ==========
const wss = new WebSocket.Server({
  noServer: true,
  path: WS_PATH,
});

// Обработка upgrade для WebSocket
server.on("upgrade", (req, socket, head) => {
  const pathname = url.parse(req.url).pathname;

  if (pathname === WS_PATH) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

// WebSocket логика (из вашего старого файла)
wss.on("connection", (ws, req) => {
  const clientId = Date.now().toString(36);
  console.log(`🔗 [${clientId}] WebSocket подключен`);

  const parsedUrl = url.parse(req.url, true);
  const clientToken = parsedUrl.query.token || BACKEND_TOKEN;

  if (!clientToken) {
    console.warn(`⚠️ [${clientId}] Нет токена`);
    ws.close(1008, "Token required");
    return;
  }

  let pollInterval = null;

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === "SUBSCRIBE" && msg.path) {
        const apiPath = msg.path;
        console.log(`📌 [${clientId}] Подписка: ${apiPath}`);

        if (pollInterval) clearInterval(pollInterval);

        makeBackendRequest(apiPath, clientToken, (error, result) => {
          if (error) {
            console.error(`❌ [${clientId}] Ошибка:`, error);
            ws.send(JSON.stringify({ type: "ERROR", error: error.message }));
          } else {
            ws.send(
              JSON.stringify({ type: "UPDATE", path: apiPath, value: result }),
            );

            pollInterval = setInterval(() => {
              makeBackendRequest(
                apiPath,
                clientToken,
                (pollError, pollData) => {
                  if (!pollError) {
                    ws.send(
                      JSON.stringify({
                        type: "UPDATE",
                        path: apiPath,
                        value: pollData,
                      }),
                    );
                  }
                },
              );
            }, 2000);
          }
        });
      }
    } catch (error) {
      console.error(`❌ [${clientId}] Ошибка:`, error.message);
    }
  });

  ws.on("close", () => {
    console.log(`🔌 [${clientId}] Отключен`);
    if (pollInterval) clearInterval(pollInterval);
  });

  ws.send(
    JSON.stringify({
      type: "CONNECTED",
      message: "WebSocket ready",
      timestamp: new Date().toISOString(),
    }),
  );
});

// ========== ФУНКЦИЯ ЗАПРОСА К БЭКЕНДУ ==========
function makeBackendRequest(apiPath, token, callback) {
  const backendUrl = new URL(BACKEND_URL);

  const options = {
    hostname: backendUrl.hostname,
    port: backendUrl.port || 8443,
    path: apiPath,
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    rejectUnauthorized: false,
  };

  const req = https.request(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      if (res.statusCode === 200) {
        try {
          callback(null, JSON.parse(data));
        } catch (e) {
          callback(new Error("Invalid JSON"), null);
        }
      } else {
        callback(new Error(`HTTP ${res.statusCode}`), null);
      }
    });
  });

  req.on("error", (error) => {
    callback(error, null);
  });

  req.setTimeout(10000, () => {
    req.destroy();
    callback(new Error("Timeout"), null);
  });

  req.end();
}

// ========== ЗАПУСК СЕРВЕРА ==========
server.listen(PORT, () => {
  console.log(`\n✅ Сервер успешно запущен!`);
  console.log(`🌐 React приложение: http://localhost:${PORT}`);
  console.log(`🔗 REST API прокси: http://localhost:${PORT}/rest/*`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}${WS_PATH}`);
  console.log(`📁 Статика из: ${path.join(__dirname, "build")}`);
  console.log(`\n🚀 Готов к работе!\n`);
});

// ========== ОБРАБОТКА ОШИБОК ==========
process.on("uncaughtException", (err) => {
  console.error("❌ Необработанная ошибка:", err);
});

process.on("SIGINT", () => {
  console.log("\n👋 Сервер остановлен");
  process.exit(0);
});
