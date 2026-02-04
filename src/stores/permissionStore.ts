import { create } from 'zustand';
import type { UserPermissions, LLMModel } from '../types';
import type { LocalLLMInstance } from '../types/localLlm';
import { permissionsApi, llmModelsApi } from '../api';
import { localLlmApi } from '../api/localLlm';
import { useAuthStore } from './authStore';

interface PermissionState {
  permissions: UserPermissions | null;
  llmModels: LLMModel[];
  llmInstances: LocalLLMInstance[];
  isLoading: boolean;
  error: string | null;

  fetchPermissions: () => Promise<void>;
  fetchLLMModels: () => Promise<void>;
  fetchLLMInstances: () => Promise<void>;
  isSuperAdmin: () => boolean;
  canCreate: () => boolean;
  canEdit: (agentId: number) => boolean;
  canDelete: (agentId: number) => boolean;
  getEditableAgentIds: () => number[] | 'all';
  clearPermissions: () => void;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: null,
  llmModels: [],
  llmInstances: [],
  isLoading: false,
  error: null,

  fetchPermissions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await permissionsApi.getUserPermissions() as {
        permissions?: Array<{ chatbot_id: number; scope?: { id?: number; name?: string } }>;
        is_super_admin?: boolean;
      };

      // Get user ID from auth store to check for super admin (user_id === 1)
      const userId = useAuthStore.getState().user?.id;

      // Parse permissions array from API response
      // API returns: { user: {...}, permissions: [{ chatbot_id, scope: { id, name } }] }
      const permissions = response.permissions || [];

      // Scope values from CLAUDE.md:
      // - Scope 1 = admin (global admin)
      // - Scope 2 = agent_admin
      // - Scope 3 = agent_user

      // Extract agent IDs where user is agent_admin (scope 2)
      const adminAgentIds = permissions
        .filter((p: { scope?: { id?: number } }) => p.scope?.id === 2)
        .map((p: { chatbot_id: number }) => p.chatbot_id);

      // Extract agent IDs where user is agent_user (scope 3)
      const userAgentIds = permissions
        .filter((p: { scope?: { id?: number } }) => p.scope?.id === 3)
        .map((p: { chatbot_id: number }) => p.chatbot_id);

      // Check for global admin scope (scope 1)
      const hasAdminScope = permissions.some((p: { scope?: { id?: number } }) => p.scope?.id === 1);

      // User ID 1 is always super admin (per CLAUDE.md), or if they have admin scope
      const isSuperAdmin = userId === 1 || hasAdminScope || response.is_super_admin === true;

      const normalizedPermissions: UserPermissions = {
        is_super_admin: isSuperAdmin,
        admin_agent_ids: adminAgentIds,
        user_agent_ids: userAgentIds,
      };
      set({ permissions: normalizedPermissions, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch permissions';
      const defaultPermissions: UserPermissions = {
        is_super_admin: false,
        admin_agent_ids: [],
        user_agent_ids: [],
      };
      set({ permissions: defaultPermissions, error: message, isLoading: false });
    }
  },

  fetchLLMModels: async () => {
    try {
      const llmModels = await llmModelsApi.list();
      set({ llmModels });
    } catch (error) {
      // LLM models endpoint may not exist - silently fail
      console.warn('LLM models endpoint not available');
      set({ llmModels: [] });
    }
  },

  fetchLLMInstances: async () => {
    try {
      const llmInstances = await localLlmApi.listInstances();
      set({ llmInstances });
    } catch (error) {
      console.warn('LLM instances endpoint not available');
      set({ llmInstances: [] });
    }
  },

  isSuperAdmin: () => {
    const { permissions } = get();
    return permissions?.is_super_admin ?? false;
  },

  canCreate: () => {
    return get().isSuperAdmin();
  },

  canEdit: (agentId: number) => {
    const { permissions } = get();
    if (!permissions) return false;
    return (
      permissions.is_super_admin ||
      (permissions.admin_agent_ids?.includes(agentId) ?? false)
    );
  },

  canDelete: (_agentId: number) => {
    // Only super admin can delete
    const { permissions } = get();
    if (!permissions) return false;
    return permissions.is_super_admin;
  },

  getEditableAgentIds: () => {
    const { permissions } = get();
    if (!permissions) return [];
    if (permissions.is_super_admin) return 'all';
    return permissions.admin_agent_ids ?? [];
  },

  clearPermissions: () => {
    set({ permissions: null, llmModels: [], llmInstances: [], error: null });
  },
}));

export default usePermissionStore;
