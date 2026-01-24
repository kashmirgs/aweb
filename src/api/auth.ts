import apiClient from './client';
import type { AuthResponse, User, Permission } from '../types';

export const authApi = {
  async login(username: string, password: string): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await apiClient.post<AuthResponse>('/auth/token', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  async getPermissions(): Promise<Permission[]> {
    const response = await apiClient.get<Permission[]>('/auth/permissions/me');
    return response.data;
  },
};

export default authApi;
