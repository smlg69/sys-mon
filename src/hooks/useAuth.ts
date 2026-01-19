// hooks/useAuth.ts
import { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { apiLogin, logout } from '../store/authSlice'; // apiLogin вместо login

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);
  const [localLoading, setLocalLoading] = useState(false);

  const login = useCallback(async (credentials: { username: string; password: string }) => {
    setLocalLoading(true);
    try {
      const result = await dispatch(apiLogin(credentials));
      return result;
    } finally {
      setLocalLoading(false);
    }
  }, [dispatch]);

  const logoutUser = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || localLoading,
    error,
    login,
    logout: logoutUser,
  };
};