// hooks/usePolling.ts
import { useEffect, useRef } from 'react';

interface UsePollingProps {
  active: boolean;
  interval: number;
  callback: () => void | Promise<void>;
  immediate?: boolean;
}

export const usePolling = ({
  active,
  interval,
  callback,
  immediate = false
}: UsePollingProps) => {
  const intervalRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    const executeCallback = async () => {
      try {
        await callbackRef.current();
      } catch (error) {
        console.error('Ошибка в polling callback:', error);
      }
    };

    if (immediate) {
      executeCallback();
    }

    intervalRef.current = setInterval(executeCallback, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [active, interval, immediate]);
};