import apiClient from './client';
import type { User } from '../types';
import type { Scope, Group } from '../types/permission';

export const adminApi = {
  async getAllUsers(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/admin/users');
    return response.data;
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
