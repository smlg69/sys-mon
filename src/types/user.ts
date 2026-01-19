// src/types/user.ts

export interface User {
  id: string | number;
  username?: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
  permissions?: string[];
}

export interface UserCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
}