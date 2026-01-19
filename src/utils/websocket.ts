// Заглушка для WebSocket - можно удалить или реализовать позже
class WebSocketClient {
  connect() {
    console.log('WebSocket заглушка: подключение не реализовано');
  }
  
  on() {
    console.log('WebSocket заглушка: обработчик событий не реализован');
  }
  
  send() {
    console.log('WebSocket заглушка: отправка сообщений не реализована');
  }
  
  disconnect() {
    console.log('WebSocket заглушка: отключение не реализовано');
  }
}

export const websocketClient = new WebSocketClient();