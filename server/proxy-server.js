// proxy-server.js
const WebSocket = require("ws");
const http = require("http");
require("dotenv").config();

// Безопасное получение порта с очисткой от мусора
const getCleanPort = () => {
  const portFromEnv = process.env.REACT_APP_PROXY_PORT || "9080";
  const cleanPort = portFromEnv.replace(/[^0-9]/g, "");
  const port = parseInt(cleanPort, 10);

  if (isNaN(port) || port < 1 || port > 65535) {
    console.warn(`⚠️ Некорректный порт: "${portFromEnv}", использую 9080`);
    return 9080;
  }

  return port;
};

const PROXY_PORT = process.env.REACT_APP_WS_PORT;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const WS_URL = process.env.REACT_APP_WS_URL;
const BACKEND_TOKEN = process.env.REACT_APP_BACKEND_TOKEN;
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT;
const HOSTNAME = process.env.REACT_APP_HOSTNAME;

console.log("=".repeat(60));
console.log("🚀 WebSocket Proxy Server");
console.log("=".repeat(60));
console.log(`📡 Listening port: ${PROXY_PORT}`);
console.log(`🎯 Target WebSocket: ${WS_URL}`);
console.log(`🔗 Proxy endpoint: ws://localhost:${PROXY_PORT}/ws`);
console.log("=".repeat(60));

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(
      JSON.stringify({
        status: "ok",
        service: "websocket-proxy",
        version: "1.0.0",
        proxyPort: PROXY_PORT,
        targetWs: WS_URL,
        clientUrl: `ws://localhost:${PROXY_PORT}/ws`,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      }),
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      error: "Not found",
      availableEndpoints: ["/health", "/ws"],
    }),
  );
});

const wss = new WebSocket.Server({
  server: server,
  path: "/ws",
});

wss.on("connection", (clientWs, request) => {
  const connectionId = Date.now().toString(36).toUpperCase();
  const clientIp = request.socket.remoteAddress;

  console.log(`\n🔗 [${connectionId}] New client connected from ${clientIp}`);

  // Извлекаем токен из URL
  let token = null;
  try {
    const url = new URL(request.url, `ws://${request.headers.host}`);
    token = url.searchParams.get("token");
  } catch (error) {
    console.log(`   ⚠️ [${connectionId}] Can't parse URL: ${request.url}`);
  }

  // Формируем URL для подключения к бэкенду
  let targetUrl = WS_URL;
  if (token) {
    targetUrl +=
      (WS_URL.includes("?") ? "&" : "?") + `token=${encodeURIComponent(token)}`;
  }

  console.log(`   📍 Target: ${targetUrl}`);

  // Таймаут для подключения к бэкенду
  let connectTimeout = setTimeout(() => {
    console.log(`   ⏰ [${connectionId}] Connection timeout to backend`);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: "ERROR",
          error: "Connection timeout to backend server",
          connectionId: connectionId,
        }),
      );
      clientWs.close(1008, "Backend connection timeout");
    }
  }, 10000); // 10 секунд таймаут

  // Создаем подключение к бэкенду
  const targetWs = new WebSocket(targetUrl, {
    perMessageDeflate: false,
    headers: {
      Origin: "http://localhost:3000",
      "User-Agent": "WebSocket-Proxy/1.0",
    },
  });

  targetWs.on("open", () => {
    clearTimeout(connectTimeout);
    console.log(`   ✅ [${connectionId}] Successfully connected to backend`);

    // Отправляем подтверждение клиенту
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: "PROXY_CONNECTED",
          message: "Proxy connection established",
          proxy: `localhost:${PROXY_PORT}`,
          target: WS_URL.replace("ws://", ""),
          connectionId: connectionId,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  });

  // Пересылка сообщений от клиента к бэкенду
  clientWs.on("message", (message) => {
    if (targetWs.readyState === WebSocket.OPEN) {
      try {
        const msgStr = message.toString();
        console.log(
          `   📤 [${connectionId}] Client -> Backend (${msgStr.length} chars)`,
        );
        targetWs.send(msgStr);
      } catch (error) {
        console.error(`   ❌ [${connectionId}] Send error:`, error.message);
      }
    } else {
      console.log(
        `   ⚠️ [${connectionId}] Can't forward, backend not connected`,
      );
    }
  });

  // Пересылка сообщений от бэкенда к клиенту
  targetWs.on("message", (message) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      try {
        const msgStr = message.toString();
        console.log(
          `   📥 [${connectionId}] Backend -> Client (${msgStr.length} chars)`,
        );
        clientWs.send(msgStr);
      } catch (error) {
        console.error(`   ❌ [${connectionId}] Forward error:`, error.message);
      }
    }
  });

  targetWs.on("error", (error) => {
    clearTimeout(connectTimeout);
    console.error(
      `   ❌ [${connectionId}] Backend connection error:`,
      error.message,
    );

    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: "ERROR",
          error: `Backend connection failed: ${error.message}`,
          connectionId: connectionId,
        }),
      );
      // Используем безопасный код ошибки
      try {
        clientWs.close(1006, "Backend connection failed");
      } catch (closeError) {
        // Игнорируем ошибки при закрытии
      }
    }
  });

  clientWs.on("error", (error) => {
    console.error(`   ❌ [${connectionId}] Client error:`, error.message);
  });

  targetWs.on("close", (code, reason) => {
    clearTimeout(connectTimeout);
    console.log(
      `   🔌 [${connectionId}] Backend closed: ${code} ${reason || ""}`,
    );

    if (clientWs.readyState === WebSocket.OPEN) {
      try {
        clientWs.close(code || 1006, reason || "Backend disconnected");
      } catch (error) {
        // Игнорируем ошибки при закрытии
      }
    }
  });

  clientWs.on("close", (code, reason) => {
    clearTimeout(connectTimeout);
    console.log(
      `   🔌 [${connectionId}] Client closed: ${code} ${reason || ""}`,
    );

    if (targetWs.readyState === WebSocket.OPEN) {
      try {
        targetWs.close(code || 1000, reason || "Client disconnected");
      } catch (error) {
        // Игнорируем ошибки при закрытии
      }
    }
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Port ${PROXY_PORT} is already in use`);
    console.log("💡 Try one of these solutions:");
    console.log("   1. Use a different port in .env file");
    console.log("   2. Kill the process using port", PROXY_PORT);
    console.log("   3. Wait a few minutes and try again");
  } else if (error.code === "EACCES") {
    console.error(`❌ Permission denied for port ${PROXY_PORT}`);
    console.log("💡 Try:");
    console.log("   1. Use a port above 1024 (e.g., 8080, 9080, 3001)");
    console.log("   2. Run as administrator (not recommended)");
  } else {
    console.error("❌ Server error:", error.message);
  }
  process.exit(1);
});

server.listen(PROXY_PORT, "0.0.0.0", () => {
  console.log(`\n✅ Proxy server is running`);
  console.log(`   🔗 Health check: http://localhost:${PROXY_PORT}/health`);
  console.log(`   🔗 WebSocket: ws://localhost:${PROXY_PORT}/ws`);
  console.log(`   🎯 Forwarding to: ${WS_URL}`);
  console.log(`\n🔄 Waiting for connections...\n`);
  console.log("=".repeat(60));
});

// Graceful shutdown
const shutdown = () => {
  console.log("\n👋 Shutting down proxy server...");
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.close(1001, "Server shutdown");
    }
  });

  setTimeout(() => {
    wss.close(() => {
      console.log("✅ WebSocket server closed");
      server.close(() => {
        console.log("✅ HTTP server closed");
        process.exit(0);
      });
    });
  }, 1000);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
