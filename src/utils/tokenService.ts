// utils/tokenService.ts
interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class TokenService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly EXPIRES_KEY = 'token_expires';
  private readonly USER_KEY = 'user_data';

  setTokens(accessToken: string, refreshToken: string, expiresIn = 3600): void {
    const expiresAt = Date.now() + expiresIn * 1000;
    
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.EXPIRES_KEY, expiresAt.toString());
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  isTokenValid(): boolean {
    const expiresAt = localStorage.getItem(this.EXPIRES_KEY);
    if (!expiresAt) return false;
    
    return Date.now() < parseInt(expiresAt, 10);
  }

  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.EXPIRES_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  async refreshToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      // API для обновления токена
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.setTokens(data.accessToken, data.refreshToken, data.expiresIn);
      return data.accessToken;
    } catch (error) {
      this.clearTokens();
      return null;
    }
  }

  // Для безопасного хранения пользователя
  setUserData(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUserData(): any {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }
}

export const tokenService = new TokenService();