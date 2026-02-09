import apiClient from './client';
import type { User, CreateUserRequest, UpdateUserRequest } from '../types';
import type { Scope, Group } from '../types/permission';

export const adminApi = {
  async getAllUsers(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/admin/users');
    return response.data;
  },

  async getUser(userId: number): Promise<User> {
    const response = await apiClient.get<User>(`/admin/users/${userId}`);
    return response.data;
  },

  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await apiClient.post<User>('/admin/users', data);
    return response.data;
  },

  async updateUser(data: UpdateUserRequest): Promise<User> {
    const response = await apiClient.put<User>('/admin/users', data);
    return response.data;
  },

  async deleteUser(userId: number): Promise<void> {
    await apiClient.delete(`/admin/users/${userId}`);
  },

  async getAllGroups(): Promise<Group[]> {
    const response = await apiClient.get<Group[]>('/admin/groups');
    return response.data;
  },

  async getAllScopes(): Promise<Scope[]> {
    const response = await apiClient.get<Scope[]>('/admin/get_all_scopes');
    return response.data;
  },
};

export default adminApi;
