import { create } from 'zustand';
import type { User, CreateUserRequest, UpdateUserRequest } from '../types';
import { adminApi } from '../api';

interface UserState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchUsers: () => Promise<void>;
  fetchUser: (id: number) => Promise<User | null>;
  createUser: (data: CreateUserRequest) => Promise<User | null>;
  updateUser: (data: UpdateUserRequest) => Promise<User | null>;
  deleteUser: (id: number) => Promise<boolean>;
  clearError: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  currentUser: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const users = await adminApi.getAllUsers();
      set({ users, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Kullanıcılar yüklenemedi';
      set({ error: message, isLoading: false });
    }
  },

  fetchUser: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const user = await adminApi.getUser(id);
      set({ currentUser: user, isLoading: false });
      return user;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Kullanıcı yüklenemedi';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  createUser: async (data: CreateUserRequest) => {
    set({ isSaving: true, error: null });
    try {
      const user = await adminApi.createUser(data);
      set((state) => ({
        users: [...state.users, user],
        isSaving: false,
      }));
      return user;
    } catch (error: unknown) {
      let message = 'Kullanıcı oluşturulamadı';
      if (error instanceof Error) {
        const status = (error as any).response?.status;
        if (status === 409) {
          message = 'Bu kullanıcı adı zaten kullanılıyor';
        } else {
          message = error.message;
        }
      }
      set({ error: message, isSaving: false });
      return null;
    }
  },

  updateUser: async (data: UpdateUserRequest) => {
    set({ isSaving: true, error: null });
    try {
      const user = await adminApi.updateUser(data);
      set((state) => ({
        users: state.users.map((u) => (u.id === data.id ? user : u)),
        currentUser: state.currentUser?.id === data.id ? user : state.currentUser,
        isSaving: false,
      }));
      return user;
    } catch (error: unknown) {
      let message = 'Kullanıcı güncellenemedi';
      if (error instanceof Error) {
        const status = (error as any).response?.status;
        if (status === 409) {
          message = 'Bu kullanıcı adı zaten kullanılıyor';
        } else {
          message = error.message;
        }
      }
      set({ error: message, isSaving: false });
      return null;
    }
  },

  deleteUser: async (id: number) => {
    set({ isSaving: true, error: null });
    try {
      await adminApi.deleteUser(id);
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        currentUser: state.currentUser?.id === id ? null : state.currentUser,
        isSaving: false,
      }));
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Kullanıcı silinemedi';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useUserStore;
