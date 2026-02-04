import { create } from 'zustand';
import type { Agent, ConversationStarter, AgentCreateRequest, AgentUpdateRequest, AgentFile } from '../types';
import { agentsApi, permissionsApi } from '../api';
import { useAuthStore } from './authStore';

interface AgentState {
  agents: Agent[];
  selectedAgent: Agent | null;
  currentAgent: Agent | null;
  starters: ConversationStarter[];
  files: AgentFile[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchAgents: () => Promise<void>;
  fetchAgent: (id: number) => Promise<Agent | null>;
  createAgent: (data: AgentCreateRequest) => Promise<Agent | null>;
  updateAgent: (id: number, data: AgentUpdateRequest) => Promise<Agent | null>;
  deleteAgent: (id: number) => Promise<boolean>;
  uploadImage: (id: number, file: File) => Promise<boolean>;
  selectAgent: (agent: Agent | null) => void;
  setCurrentAgent: (agent: Agent | null) => void;
  fetchStarters: (agentId: number) => Promise<void>;
  createStarter: (agentId: number, data: { title?: string; prompt: string }) => Promise<ConversationStarter | null>;
  updateStarter: (starterId: number, data: { title?: string; prompt: string }) => Promise<ConversationStarter | null>;
  deleteStarter: (starterId: number) => Promise<boolean>;
  fetchFiles: (agentId: number) => Promise<void>;
  uploadFile: (agentId: number, file: File) => Promise<AgentFile | null>;
  deleteFile: (agentId: number, fileId: number) => Promise<boolean>;
  buildIndex: (agentId: number) => Promise<void>;
  getAgentImageUrl: (agentId: number) => string;
  getInteractiveAgents: () => Agent[];
  getAgentById: (id: number) => Agent | undefined;
  clearError: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  selectedAgent: null,
  currentAgent: null,
  starters: [],
  files: [],
  isLoading: false,
  isSaving: false,
  error: null,

  fetchAgents: async () => {
    set({ isLoading: true, error: null });
    try {
      const agents = await agentsApi.list();
      set({ agents, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch agents';
      set({ error: message, isLoading: false });
    }
  },

  fetchAgent: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const agent = await agentsApi.get(id);
      set({ currentAgent: agent, isLoading: false });
      return agent;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch agent';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  createAgent: async (data: AgentCreateRequest) => {
    set({ isSaving: true, error: null });
    try {
      const agent = await agentsApi.create(data);

      // Grant agent_admin permission to the creator (scope_id: 2)
      // This is a workaround for backend not showing chatbots to super_admin without explicit permission
      const user = useAuthStore.getState().user;
      if (user?.id) {
        try {
          await permissionsApi.grantPermission(user.id, agent.id, 2);
        } catch (permError) {
          console.warn('Failed to grant permission:', permError);
        }
      }

      set((state) => ({
        agents: [...state.agents, agent],
        isSaving: false,
      }));
      return agent;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create agent';
      set({ error: message, isSaving: false });
      return null;
    }
  },

  updateAgent: async (id: number, data: AgentUpdateRequest) => {
    set({ isSaving: true, error: null });
    try {
      const agent = await agentsApi.update(id, data);
      set((state) => ({
        agents: state.agents.map((a) => (a.id === id ? agent : a)),
        currentAgent: state.currentAgent?.id === id ? agent : state.currentAgent,
        isSaving: false,
      }));
      return agent;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update agent';
      set({ error: message, isSaving: false });
      return null;
    }
  },

  deleteAgent: async (id: number) => {
    set({ isSaving: true, error: null });
    try {
      await agentsApi.delete(id);
      set((state) => ({
        agents: state.agents.filter((a) => a.id !== id),
        currentAgent: state.currentAgent?.id === id ? null : state.currentAgent,
        isSaving: false,
      }));
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete agent';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  uploadImage: async (id: number, file: File) => {
    try {
      await agentsApi.uploadImage(id, file);
      // Refetch agent to get updated modified_at for cache busting
      const agent = await agentsApi.get(id);
      set((state) => ({
        currentAgent: state.currentAgent?.id === id ? agent : state.currentAgent,
        agents: state.agents.map((a) => (a.id === id ? agent : a)),
      }));
      return true;
    } catch (error) {
      console.error('Failed to upload image:', error);
      return false;
    }
  },

  selectAgent: (agent) => {
    set({ selectedAgent: agent, starters: [] });
    if (agent) {
      agentsApi.getStarters(agent.id).then((starters) => {
        set({ starters });
      });
    }
  },

  setCurrentAgent: (agent) => {
    set({ currentAgent: agent });
  },

  fetchStarters: async (agentId: number) => {
    try {
      const starters = await agentsApi.getStarters(agentId);
      set({ starters });
    } catch (error) {
      console.error('Failed to fetch starters:', error);
    }
  },

  createStarter: async (agentId: number, data: { title?: string; prompt: string }) => {
    try {
      const starter = await agentsApi.createStarter(agentId, data);
      set((state) => ({ starters: [...state.starters, starter] }));
      return starter;
    } catch (error) {
      console.error('Failed to create starter:', error);
      return null;
    }
  },

  updateStarter: async (starterId: number, data: { title?: string; prompt: string }) => {
    try {
      const starter = await agentsApi.updateStarter(starterId, data);
      set((state) => ({
        starters: state.starters.map((s) => (s.id === starterId ? starter : s)),
      }));
      return starter;
    } catch (error) {
      console.error('Failed to update starter:', error);
      return null;
    }
  },

  deleteStarter: async (starterId: number) => {
    try {
      await agentsApi.deleteStarter(starterId);
      set((state) => ({
        starters: state.starters.filter((s) => s.id !== starterId),
      }));
      return true;
    } catch (error) {
      console.error('Failed to delete starter:', error);
      return false;
    }
  },

  fetchFiles: async (agentId: number) => {
    try {
      const files = await agentsApi.listFiles(agentId);
      set({ files });
    } catch (error) {
      console.error('Failed to fetch files:', error);
      set({ files: [] });
    }
  },

  uploadFile: async (agentId: number, file: File) => {
    try {
      const agentFile = await agentsApi.uploadFile(agentId, file);
      set((state) => ({ files: [...state.files, agentFile] }));
      // Trigger index building after successful upload
      get().buildIndex(agentId);
      return agentFile;
    } catch (error) {
      console.error('Failed to upload file:', error);
      return null;
    }
  },

  deleteFile: async (agentId: number, fileId: number) => {
    try {
      await agentsApi.deleteFile(agentId, fileId);
      set((state) => ({
        files: state.files.filter((f) => f.id !== fileId),
      }));
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  },

  buildIndex: async (agentId: number) => {
    try {
      await agentsApi.buildIndex(agentId);
    } catch (error) {
      console.error('Index build failed:', error);
    }
  },

  getAgentImageUrl: (agentId: number) => {
    // Use agent's modified_at for cache busting
    const { agents, currentAgent } = get();
    const agent = currentAgent?.id === agentId ? currentAgent : agents.find(a => a.id === agentId);
    const version = agent?.modified_at ? new Date(agent.modified_at).getTime() : undefined;
    return agentsApi.getImageUrl(agentId, version);
  },

  getInteractiveAgents: (): Agent[] => {
    return get().agents.filter((agent: Agent) => agent.interactive !== false);
  },

  getAgentById: (id: number): Agent | undefined => {
    return get().agents.find((agent: Agent) => agent.id === id);
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useAgentStore;
