import React, { createContext, useContext, useEffect, useState } from 'react';

interface OfflineUser {
  email: string;
}

interface AuthContextType {
  user: OfflineUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  getPasswordHint: () => string;
}

const OFFLINE_USER_KEY = 'belemplay-offline-user';
const OFFLINE_PASSWORD_KEY = 'belemplay-offline-password';
const DEFAULT_PASSWORD = 'belem123';
const DEFAULT_EMAIL = 'offline@belemplay.local';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<OfflineUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(OFFLINE_USER_KEY);
      if (storedUser) {
        const parsed = JSON.parse(storedUser) as OfflineUser;
        setUser(parsed);
      }
    } catch (error) {
      console.warn('Não foi possível carregar usuário offline:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const persistUser = (offlineUser: OfflineUser | null) => {
    try {
      if (offlineUser) {
        localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(offlineUser));
      } else {
        localStorage.removeItem(OFFLINE_USER_KEY);
      }
    } catch (error) {
      console.warn('Falha ao persistir usuário offline:', error);
    }
  };

  const login = async (email: string, password: string) => {
    const trimmedEmail = email.trim() || DEFAULT_EMAIL;
    const storedPassword = localStorage.getItem(OFFLINE_PASSWORD_KEY) ?? DEFAULT_PASSWORD;

    if (password !== storedPassword) {
      const error = new Error('Senha incorreta');
      (error as any).code = 'auth/wrong-password';
      throw error;
    }

    const offlineUser: OfflineUser = { email: trimmedEmail };
    setUser(offlineUser);
    persistUser(offlineUser);
  };

  const logout = async () => {
    setUser(null);
    persistUser(null);
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    const storedPassword = localStorage.getItem(OFFLINE_PASSWORD_KEY) ?? DEFAULT_PASSWORD;
    if (storedPassword !== currentPassword) {
      const error = new Error('Senha atual inválida');
      (error as any).code = 'auth/wrong-password';
      throw error;
    }

    try {
      localStorage.setItem(OFFLINE_PASSWORD_KEY, newPassword);
    } catch (error) {
      console.warn('Falha ao atualizar senha offline:', error);
      throw error;
    }
  };

  const getPasswordHint = () => localStorage.getItem(OFFLINE_PASSWORD_KEY) ?? DEFAULT_PASSWORD;

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    updatePassword,
    getPasswordHint,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}