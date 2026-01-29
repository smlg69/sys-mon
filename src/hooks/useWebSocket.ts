// hooks/useWebSocket.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseWebSocketProps {
  url?: string;
  onMessage?: (data: any) => void;
  onError?: (error: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnect?: boolean;
  reconnectInterval?: number;
}

export const useWebSocket = ({
  url,
  onMessage,
  onError,
  onOpen,
  onClose,
  reconnect = true,
  reconnectInterval = 5000
}: UseWebSocketProps) => {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (!url) {
      console.warn('WebSocket URL не указан');
      return;
    }

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket подключен');
        setConnected(true);
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (error) {
          console.error('Ошибка парсинга WebSocket сообщения:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket ошибка:', error);
        onError?.(error);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket отключен');
        setConnected(false);
        onClose?.();

        if (reconnect) {
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
        }
      };
    } catch (error) {
      console.error('❌ Ошибка создания WebSocket:', error);
      onError?.(error);
    }
  }, [url, onMessage, onError, onOpen, onClose, reconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setConnected(false);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connected,
    disconnect,
    connect
  };
};