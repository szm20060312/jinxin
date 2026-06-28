// ============================================================
// Auth Hook —— 《晋·信》
// 纯云端认证（Edge Functions + KV Storage + PBKDF2）
// ============================================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  getCurrentUser,
  cloudRegister,
  cloudLogin,
  cloudLogout,
} from '../utils/accountManager';
import { audioManager } from '../utils/audioManager';

export interface AuthContextValue {
  user: string | null;
  login: (username: string, password: string) => Promise<{ success: true } | { success: false; error: string }>;
  register: (username: string, password: string) => Promise<{ success: true } | { success: false; error: string }>;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(() => getCurrentUser());

  const login = useCallback(async (username: string, password: string) => {
    const trimmed = username.trim();
    const result = await cloudLogin(trimmed, password);
    if (result.success) {
      setUser(trimmed);
      return { success: true as const };
    }
    return { success: false as const, error: result.error || '登录失败' };
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const trimmed = username.trim();
    const result = await cloudRegister(trimmed, password);
    if (result.success) {
      const loginResult = await cloudLogin(trimmed, password);
      if (loginResult.success) setUser(trimmed);
      return { success: true as const };
    }
    return { success: false as const, error: result.error || '注册失败' };
  }, []);

  const logout = useCallback(() => {
    audioManager.stop();
    cloudLogout();
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    login,
    register,
    logout,
    isLoggedIn: user !== null,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用');
  }
  return ctx;
}
