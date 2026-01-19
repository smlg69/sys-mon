// server/websocket-proxy.js
const WebSocket = require('ws');
const https = require('https');
require('dotenv').config();

const WS_PORT = process.env.REACT_APP_WS_PORT;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const WS_URL = process.env.REACT_APP_WS_URL;
const BACKEND_TOKEN = process.env.REACT_APP_BACKEND_TOKEN;
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT; 
const HOSTNAME = process.env.REACT_APP_HOSTNAME; 


const wss = new WebSocket.Server({ 
  port: `${WS_PORT}`,
  perMessageDeflate: false
});

console.log(`🚀 WebSocket Proxy запущен на ${WS_URL}`);
console.log(`🎯 Бэкенд: ${BACKEND_URL}`);
console.log(`🔐 Токен загружен: ${BACKEND_TOKEN ? 'Да' : 'Нет'}`);

function makeBackendRequest(path, token, callback) {
  const options = {
    hostname: `${HOSTNAME}`,
    port: `${BACKEND_PORT}`,
    path: path,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    rejectUnauthorized: false
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const jsonData = JSON.parse(data);
          callback(null, jsonData);
        } catch (error) {
          callback(new Error('Invalid JSON'), null);
        }
      } else {
        callback(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 100)}`), null);
      }
    });
  });
  
  req.on('error', (error) => {
    callback(error, null);
  });
  
  req.setTimeout(10000, () => {
    req.destroy();
    callback(new Error('Timeout'), null);
  });
  
  req.end();
}

wss.on('connection', (ws, req) => {
  const clientId = Date.now();
  console.log(`🔗 [${clientId}] Клиент подключился`);
  
  // Извлекаем токен из URL или используем серверный токен
  const url = new URL(req.url, `ws://${req.headers.host}`);
  const clientToken = url.searchParams.get('token') || BACKEND_TOKEN;
  
  let pollInterval = null;
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      
      if (msg.type === 'SUBSCRIBE') {
        const path = msg.path;
        console.log(`📌 [${clientId}] Подписка на: ${path}`);
        
        // Очищаем предыдущий интервал
        if (pollInterval) {
          clearInterval(pollInterval);
        }
        
        // Первый запрос
        makeBackendRequest(path, clientToken, (error, initialData) => {
          if (error) {
            console.error(`❌ [${clientId}] Ошибка:`, error.message);
            ws.send(JSON.stringify({
              type: 'ERROR',
              error: error.message
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'UPDATE',
              path: path,
              value: initialData
            }));
            
            // Опрос каждые 2 секунды
            pollInterval = setInterval(() => {
              makeBackendRequest(path, clientToken, (pollError, pollData) => {
                if (!pollError) {
                  ws.send(JSON.stringify({
                    type: 'UPDATE',
                    path: path,
                    value: pollData
                  }));
                }
              });
            }, 2000);
          }
        });
      }
      
    } catch (error) {
      console.error(`❌ [${clientId}] Ошибка парсинга:`, error.message);
    }
  });
  
  ws.on('close', () => {
    console.log(`🔌 [${clientId}] Клиент отключился`);
    if (pollInterval) {
      clearInterval(pollInterval);
    }
  });
});