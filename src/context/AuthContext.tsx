import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  requestPasswordReset: (emailOrUsername: string) => Promise<{ success: boolean; message?: string; error?: string; email?: string; code?: string }>;
  confirmPasswordReset: (email: string, code: string, newPass: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  isLoginModalOpen: boolean;
  loginModalMessage: string;
  openLoginModal: (message?: string) => void;
  closeLoginModal: () => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'airdrop_admin_token';
const USER_KEY = 'airdrop_admin_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });
  
  const [user, setUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMessage, setLoginModalMessage] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const isAuthenticated = !!token && !!user;

  // Verify token on mount if stored
  useEffect(() => {
    if (token) {
      fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          } else {
            // Token expired or invalid
            logout();
          }
        })
        .catch(() => {
          // Keep local state if server offline temporarily
        });
    }
  }, [token]);

  const getAuthHeaders = (): Record<string, string> => {
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  };

  const login = async (identifier: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password: pass }),
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setIsLoginModalOpen(false);
        setLoginModalMessage('');
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Неверный логин или пароль' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Ошибка сети при авторизации' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setIsProfileModalOpen(false);
  };

  const requestPasswordReset = async (emailOrUsername: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername }),
      });
      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          message: data.message,
          email: data.email,
          code: data.code,
        };
      } else {
        return { success: false, error: data.error || 'Ошибка запроса восстановления' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Ошибка подключения к серверу' };
    }
  };

  const confirmPasswordReset = async (email: string, code: string, newPass: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword: newPass }),
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || 'Не удалось сбросить пароль' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Ошибка сброса пароля' };
    }
  };

  const changePassword = async (currentPass: string, newPass: string) => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
      const data = await res.json();
      if (data.success) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || 'Ошибка изменения пароля' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Ошибка сети' };
    }
  };

  const openLoginModal = (message?: string) => {
    if (message) setLoginModalMessage(message);
    else setLoginModalMessage('');
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setLoginModalMessage('');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        login,
        logout,
        requestPasswordReset,
        confirmPasswordReset,
        changePassword,
        isLoginModalOpen,
        loginModalMessage,
        openLoginModal,
        closeLoginModal,
        isProfileModalOpen,
        setIsProfileModalOpen,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
