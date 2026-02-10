import { create } from 'zustand';
import type { User } from '../types';
import { authApi } from '../api';
import axios from 'axios';

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK') {
      return 'Sunucuya bağlanılamadı. Lütfen bağlantınızı kontrol edin.';
    }
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 404) return 'Kullanıcı adı veya şifre hatalı';
      if (status === 403) return 'Erişim reddedildi';
      if (status >= 500) return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      return error.response.data?.detail || error.response.data?.message || 'Giriş başarısız';
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Beklenmeyen bir hata oluştu';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  userImageVersion: number;

  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
  setUser: (user: User) => void;
  incrementUserImageVersion: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  error: null,
  userImageVersion: Date.now(),

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(username, password);
      localStorage.setItem('access_token', response.access_token);

      const user = await authApi.getMe();

      set({
        token: response.access_token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error: unknown) {
      set({
        error: getErrorMessage(error),
        isLoading: false,
        isAuthenticated: false,
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return false;
    }

    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true });
      return true;
    } catch {
      localStorage.removeItem('access_token');
      set({ isAuthenticated: false, user: null, token: null });
      return false;
    }
  },

  clearError: () => set({ error: null }),

  setUser: (user: User) => set({ user }),

  incrementUserImageVersion: () => set({ userImageVersion: Date.now() }),
}));

export default useAuthStore;
