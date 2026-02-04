import apiClient from './client';
import type { UserPermissions, LLMModel, UserAuthorization, GroupAuthorization } from '../types';

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

  async grantPermission(userId: number, chatbotId: number, scopeId: number): Promise<void> {
    await apiClient.post('/auth/permissions', {
      user_id: userId,
      chatbot_id: chatbotId,
      scope_id: scopeId,
    });
  },

  async revokePermission(userId: number, chatbotId: number, scopeId: number): Promise<void> {
    await apiClient.delete('/auth/permissions', {
      data: {
        user_id: userId,
        chatbot_id: chatbotId,
        scope_id: scopeId,
      },
    });
  },

  async getAgentAuthorizations(agentId: number): Promise<UserAuthorization[]> {
    const response = await apiClient.get<UserAuthorization[]>(`/auth/permissions/agent/${agentId}`);
    return response.data;
  },

  async grantGroupPermission(groupId: number, chatbotId: number, scopeId: number): Promise<void> {
    await apiClient.post('/auth/permissions/groups', {
      group_id: groupId,
      chatbot_id: chatbotId,
      scope_id: scopeId,
    });
  },

  async revokeGroupPermission(groupId: number, chatbotId: number, scopeId: number): Promise<void> {
    await apiClient.delete('/auth/permissions/groups', {
      data: {
        group_id: groupId,
        chatbot_id: chatbotId,
        scope_id: scopeId,
      },
    });
  },

  async getAgentGroupAuthorizations(agentId: number): Promise<GroupAuthorization[]> {
    const response = await apiClient.get<GroupAuthorization[]>(`/auth/permissions/groups/${agentId}`);
    return response.data;
  },
};

export const llmModelsApi = {
  async list(): Promise<LLMModel[]> {
    const response = await apiClient.get<LLMModel[]>('/llm_models');
    return response.data;
  },
};

export default permissionsApi;
