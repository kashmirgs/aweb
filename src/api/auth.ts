import apiClient from './client';
import type { AuthResponse, User, Permission, UpdateUserRequest } from '../types';
import { API_BASE_URL } from '../config/api';

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

  async changePassword(password: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/user/change_password', {
      password,
      new_password: newPassword,
    });
  },

  async updateProfile(data: UpdateUserRequest): Promise<User> {
    const response = await apiClient.put<User>('/admin/users', data);
    return response.data;
  },

  getUserImageUrl(version?: number | string): string {
    const url = `${API_BASE_URL}/users/image`;
    return version != null ? `${url}?v=${version}` : url;
  },

  async uploadUserImage(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    await apiClient.post('/users/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default authApi;
