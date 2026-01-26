import apiClient from './client';
import type { UserPermissions, LLMModel } from '../types';

export const permissionsApi = {
  async getUserPermissions(): Promise<UserPermissions> {
    const response = await apiClient.get<UserPermissions>('/auth/permissions/me');
    return response.data;
  },

  async checkAgentAdminAccess(agentId: number): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions();
      return (
        permissions.is_super_admin ||
        permissions.admin_agent_ids.includes(agentId)
      );
    } catch {
      return false;
    }
  },
};

export const llmModelsApi = {
  async list(): Promise<LLMModel[]> {
    const response = await apiClient.get<LLMModel[]>('/llm_models');
    return response.data;
  },
};

export default permissionsApi;
