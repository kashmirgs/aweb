import apiClient from './client';
import type { User, CreateUserRequest, UpdateUserRequest } from '../types';
import type { Scope, Group, CreateGroupRequest, UpdateGroupRequest, GroupMember } from '../types/permission';

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

  async getGroup(id: number): Promise<Group> {
    const response = await apiClient.get<Group>(`/admin/groups/${id}`);
    return response.data;
  },

  async createGroup(data: CreateGroupRequest): Promise<Group> {
    const response = await apiClient.post<Group>('/admin/groups', data);
    return response.data;
  },

  async updateGroup(id: number, data: UpdateGroupRequest): Promise<Group> {
    const response = await apiClient.put<Group>(`/admin/groups/${id}`, data);
    return response.data;
  },

  async deleteGroup(id: number): Promise<void> {
    await apiClient.delete(`/admin/groups/${id}`);
  },

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    const response = await apiClient.get<GroupMember[]>(`/admin/groups/${groupId}/members`);
    return response.data;
  },

  async addGroupMember(groupId: number, userId: number): Promise<void> {
    await apiClient.post(`/admin/groups/${groupId}/members`, { user_id: userId });
  },

  async removeGroupMember(groupId: number, userId: number): Promise<void> {
    await apiClient.delete(`/admin/groups/${groupId}/members`, { data: { user_id: userId } });
  },

  async getAllScopes(): Promise<Scope[]> {
    const response = await apiClient.get<Scope[]>('/admin/get_all_scopes');
    return response.data;
  },
};

export default adminApi;
