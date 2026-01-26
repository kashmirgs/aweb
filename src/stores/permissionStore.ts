import { create } from 'zustand';
import type { UserPermissions, LLMModel } from '../types';
import { permissionsApi, llmModelsApi } from '../api';

interface PermissionState {
  permissions: UserPermissions | null;
  llmModels: LLMModel[];
  isLoading: boolean;
  error: string | null;

  fetchPermissions: () => Promise<void>;
  fetchLLMModels: () => Promise<void>;
  isSuperAdmin: () => boolean;
  canCreate: () => boolean;
  canEdit: (agentId: number) => boolean;
  canDelete: (agentId: number) => boolean;
  clearPermissions: () => void;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: null,
  llmModels: [],
  isLoading: false,
  error: null,

  fetchPermissions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await permissionsApi.getUserPermissions();

      // Parse the API response structure
      // API returns: { user: {...}, permissions: [{ chatbot_id, scope: { name }, via_group }] }
      const permissionsList = (response as unknown as { permissions?: Array<{ chatbot_id: number | null; scope: { name: string } }> })?.permissions ?? [];

      // Check if user is super admin (scope.name === "admin" with chatbot_id === null)
      const isSuperAdmin = permissionsList.some(
        (p) => p.scope?.name === 'admin' && p.chatbot_id === null
      );

      // Get agent IDs where user is agent_admin
      const adminAgentIds = permissionsList
        .filter((p) => p.scope?.name === 'agent_admin' && p.chatbot_id !== null)
        .map((p) => p.chatbot_id as number);

      // Get agent IDs where user has regular access
      const userAgentIds = permissionsList
        .filter((p) => p.scope?.name === 'user' && p.chatbot_id !== null)
        .map((p) => p.chatbot_id as number);

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

  clearPermissions: () => {
    set({ permissions: null, llmModels: [], error: null });
  },
}));

export default usePermissionStore;
