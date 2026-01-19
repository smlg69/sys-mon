// src/hooks/useUsers.ts
import { useState } from 'react';

interface CreateUserData {
  userName: string;
  password: string;
  role: string;
}

interface User extends CreateUserData {
  id: string;
  email?: string;
  phone?: string;
  department?: string;
  isActive: boolean;
  // ... другие поля
}

export const useUsers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = async (userData: CreateUserData): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Ошибка при создании пользователя');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Ошибка при обновлении пользователя');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createUser,
    updateUser,
    loading,
    error,
  };
};