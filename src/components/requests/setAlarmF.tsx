// components/requests/setAlarmF.tsx
import React, { useState, useCallback } from "react";

// Интерфейс для ответа API
export interface AlarmResponse {
  success: boolean;
  message?: string;
  timestamp?: string;
  data?: any;
}

export interface SetAlarmResult {
  success: boolean;
  message: string;
  data?: any;
}

/*
 * Функция для отправки тревоги на бэкенд
 * @param parameter - параметр устройства (например, "tm1", "cam1")
 * @param value - значение параметра
 * @param user - пользователь, отправивший тревогу
 * @returns Promise с результатом отправки
 */
export const setAlarmF = async (
  parameter: string,
  value: string,
  user: string,
): Promise<SetAlarmResult> => {
  try {
    const token = localStorage.getItem("access_token");

    if (!token) {
      throw new Error("Токен авторизации не найден");
    }

    const url =
      "/rest/v1/contexts/users.admin.models.workerMS/functions/setAlarmF";

    // Формат как в работающих запросах - массив объектов
    const requestData = [
      {
        parameter,
        value,
        user,
      },
    ];

    console.log("📤 Отправка тревоги:", { parameter, value, user });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Обрабатываем ответ в формате массива или объекта
    const result = Array.isArray(data) && data.length > 0 ? data[0] : data;

    console.log("📥 Ответ сервера:", result);

    return {
      success: result.success !== false,
      message: result.message || "Тревога отправлена",
      data: result,
    };
  } catch (error: any) {
    console.error("❌ Ошибка при отправке тревоги:", error);
    return {
      success: false,
      message: error.message || "Ошибка сети",
    };
  }
};

/**
 * Хук для использования функции setAlarmF в React компонентах
 */
export const useSetAlarmF = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendAlarm = useCallback(
    async (
      parameter: string,
      value: string,
      user: string,
    ): Promise<SetAlarmResult> => {
      setLoading(true);
      setError(null);

      try {
        const result = await setAlarmF(parameter, value, user);

        if (!result.success) {
          setError(result.message);
        }

        return result;
      } catch (err: any) {
        const errorMessage = err.message || "Неизвестная ошибка";
        setError(errorMessage);
        return {
          success: false,
          message: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    sendAlarm,
    loading,
    error,
    resetError: () => setError(null),
  };
};

// Компонент для быстрого использования (опционально)
interface SetAlarmButtonProps {
  parameter: string;
  value: string;
  user: string;
  onSuccess?: (result: SetAlarmResult) => void;
  onError?: (error: string) => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

export const SetAlarmButton: React.FC<SetAlarmButtonProps> = ({
  parameter,
  value,
  user,
  onSuccess,
  onError,
  children,
  disabled = false,
}) => {
  const { sendAlarm, loading } = useSetAlarmF();

  const handleClick = async () => {
    const result = await sendAlarm(parameter, value, user);

    if (result.success && onSuccess) {
      onSuccess(result);
    } else if (!result.success && onError) {
      onError(result.message);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || disabled}
      style={{
        padding: "8px 16px",
        backgroundColor: "#ff4444",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: loading || disabled ? "not-allowed" : "pointer",
        opacity: loading || disabled ? 0.7 : 1,
      }}
    >
      {loading ? "Отправка..." : children || "🚨 Тревога"}
    </button>
  );
};
