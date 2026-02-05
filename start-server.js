const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
require('dotenv').config();

// ========== КОНФИГУРАЦИЯ ==========
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://91.240.87.214:8443';
const BACKEND_TOKEN = process.env.REACT_APP_BACKEND_TOKEN;
const PORT = process.env.REACT_APP_WS_PORT || 9443; // Используем порт 9443
const HTTP_PORT = process.env.REACT_APP_HTTP_PORT || 3000; // Для статики

console.log('🚀 Запуск сервера с WebSocket на порту', PORT);

// ========== СЕРВЕР ДЛЯ СТАТИКИ (HTTP) ==========
const staticServer = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;
  
  // 1. ПРОКСИ ДЛЯ REST API
  if (pathname.startsWith('/rest')) {
    proxyToBackend(req, res, parsedUrl);
    return;
  }
  
  // 2. СТАТИЧЕСКИЕ ФАЙЛЫ
  serveStaticFile(req, res, parsedUrl);
});

// ========== WEBSOCKET СЕРВЕР НА ПОРТУ 9443 ==========
const wsServer = http.createServer((req, res) => {
  // Этот сервер только для WebSocket upgrade
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running');
});

const wss = new WebSocket.Server({ 
  server: wsServer,
  path: '/'
});

// ========== ФУНКЦИИ ==========
function proxyToBackend(req, res, parsedUrl) {
  const backendUrl = new URL(BACKEND_URL);
  const targetPath = parsedUrl.pathname + (parsedUrl.search || '');
  
  const options = {
    hostname: backendUrl.hostname,
    port: backendUrl.port || 8443,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      'Authorization': `Bearer ${BACKEND_TOKEN}`,
      'Host': backendUrl.hostname
    },
    rejectUnauthorized: false
  };
  
  delete options.headers['content-length'];
  
  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('❌ Ошибка прокси:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error' }));
  });
  
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    req.pipe(proxyReq);
  } else {
    proxyReq.end();
  }
}

function serveStaticFile(req, res, parsedUrl) {
  let filePath = parsedUrl.pathname === '/' ? '/index.html' : parsedUrl.pathname;
  const fullPath = path.join(__dirname, 'build', filePath);
  
  fs.readFile(fullPath, (error, content) => {
    if (error) {
      // Для SPA - отдаем index.html
      fs.readFile(path.join(__dirname, 'build', 'index.html'), (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        }
      });
    } else {
      const ext = path.extname(fullPath);
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      res.end(content);
    }
  });
}

// ========== WEBSOCKET ЛОГИКА ==========
wss.on('connection', (ws, req) => {
  console.log('🔗 WebSocket подключен:', req.url);
  
  const parsedUrl = url.parse(req.url, true);
  const token = parsedUrl.query.token || BACKEND_TOKEN;
  
  if (!token) {
    ws.close(1008, 'Token required');
    return;
  }
  
  let pollInterval = null;
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      
      if (msg.type === 'SUBSCRIBE' && msg.path) {
        console.log('📌 Подписка на:', msg.path);
        
        if (pollInterval) clearInterval(pollInterval);
        
        // Запрос к бэкенду
        const backendUrl = new URL(BACKEND_URL);
        const options = {
          hostname: backendUrl.hostname,
          port: backendUrl.port || 8443,
          path: msg.path,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          rejectUnauthorized: false
        };
        
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              ws.send(JSON.stringify({
                type: 'UPDATE',
                path: msg.path,
                value: JSON.parse(data)
              }));
            }
          });
        });
        
        req.on('error', () => {});
        req.end();
        
        // Периодический опрос
        pollInterval = setInterval(() => {
          const pollReq = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              if (res.statusCode === 200) {
                ws.send(JSON.stringify({
                  type: 'UPDATE',
                  path: msg.path,
                  value: JSON.parse(data)
                }));
              }
            });
          });
          pollReq.on('error', () => {});
          pollReq.end();
        }, 2000);
      }
      
    } catch (error) {
      console.error('❌ Ошибка WebSocket:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket отключен');
    if (pollInterval) clearInterval(pollInterval);
  });
  
  ws.send(JSON.stringify({ 
    type: 'CONNECTED', 
    message: 'WebSocket ready' 
  }));
});

// ========== ЗАПУСК СЕРВЕРОВ ==========
staticServer.listen(HTTP_PORT, () => {
  console.log(`✅ HTTP сервер: http://localhost:${HTTP_PORT}`);
  console.log(`🔗 REST API: http://localhost:${HTTP_PORT}/rest/*`);
});

wsServer.listen(PORT, () => {
  console.log(`✅ WebSocket сервер: ws://localhost:${PORT}`);
  console.log(`🎯 Бэкенд: ${BACKEND_URL}`);
});