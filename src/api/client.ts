// api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

const VARIABLES = process.env.REACT_APP_VARIABLES;
//const FUNCTIONS = process.env.REACT_APP_FUNCTIONS;

class ApiClient {
  private client: AxiosInstance;
  private defaultBaseURL: string;

  constructor() {
    this.defaultBaseURL =
      //"/rest/v1/contexts/users.admin.models.workerLimsN/variables/";
      `${VARIABLES}`;
      //`${FUNCTIONS}`;
      
      //REACT_APP_BACKEND_URL=https://91.240.87.214:8443
    this.client = axios.create({
      baseURL:
        process.env.NODE_ENV === "development"
          ? "https://91.240.87.214:8443"
          : "",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Accept: "application/json; charset=utf-8",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor для добавления токена
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Отладка
        console.log("📤 Отправка запроса:", {
          method: config.method,
          url: config.url,
          baseURL: config.baseURL,
        });

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor для обработки ошибок
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log("✅ Получен ответ:", {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      async (error) => {
        console.error("❌ Ошибка запроса:", {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
        });

        if (error.response?.status === 401) {
          // Токен истек
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          localStorage.removeItem("token_expiry");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  public setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem("access_token", accessToken);
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }
    this.setupInterceptors(); // Обновляем интерцепторы
  }

  // Основные методы с поддержкой разных baseURL
  public async get<T>(
    url: string,
    config?: AxiosRequestConfig & { baseURL?: string }
  ): Promise<T> {
    const finalConfig = {
      ...config,
      baseURL: config?.baseURL || this.defaultBaseURL,
    };
    const response = await this.client.get<T>(url, finalConfig);
    return response.data;
  }

  public async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { baseURL?: string }
  ): Promise<T> {
    const finalConfig = {
      ...config,
      baseURL: config?.baseURL || this.defaultBaseURL,
    };

    console.log("🔍 POST запрос детали:", {
      url,
      fullUrl: finalConfig.baseURL + url,
      data,
      headers: this.client.defaults.headers,
    });

    const response = await this.client.post<T>(url, data, finalConfig);
    return response.data;
  }

  public async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { baseURL?: string }
  ): Promise<T> {
    const finalConfig = {
      ...config,
      baseURL: config?.baseURL || this.defaultBaseURL,
    };
    const response = await this.client.put<T>(url, data, finalConfig);
    return response.data;
  }

  public async delete<T>(
    url: string,
    config?: AxiosRequestConfig & { baseURL?: string }
  ): Promise<T> {
    const finalConfig = {
      ...config,
      baseURL: config?.baseURL || this.defaultBaseURL,
    };
    const response = await this.client.delete<T>(url, finalConfig);
    return response.data;
  }

  // Специальный метод для работы с windows-1251 кодировкой
  // api/client.ts - обновленный postWithDecoding метод
  public async postWithDecoding(
    url: string,
    data?: any,
    encoding = "windows-1251"
  ): Promise<any> {
    try {
      const response = await this.client.post<ArrayBuffer>(url, data, {
        baseURL: this.defaultBaseURL,
        responseType: "arraybuffer",
      });

      const decoder = new TextDecoder(encoding);
      const decodedText = decoder.decode(response.data);
      return JSON.parse(decodedText);
    } catch (error: any) {
      console.error("❌ Ошибка при запросе с декодированием:", error);

      // Если есть response с ArrayBuffer, декодируем его
      if (error.response && error.response.data instanceof ArrayBuffer) {
        try {
          const decoder = new TextDecoder(encoding);
          const decodedError = decoder.decode(error.response.data);
          console.error("📄 Декодированная ошибка сервера:", decodedError);

          // Пробуем распарсить как JSON
          try {
            const errorJson = JSON.parse(decodedError);
            console.error("📄 JSON ошибки:", errorJson);
            throw new Error(`Server error: ${JSON.stringify(errorJson)}`);
          } catch (jsonError) {
            // Если не JSON, бросаем текст как есть
            throw new Error(`Server error: ${decodedError}`);
          }
        } catch (decodeError) {
          console.error(
            "❌ Не удалось декодировать ошибку сервера:",
            decodeError
          );
        }
      }

      throw error;
    }
  }
}

export const apiClient = new ApiClient();
