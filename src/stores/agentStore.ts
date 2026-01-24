import { create } from 'zustand';
import type { Agent, ConversationStarter } from '../types';
import { agentsApi } from '../api';

interface AgentState {
  agents: Agent[];
  selectedAgent: Agent | null;
  starters: ConversationStarter[];
  isLoading: boolean;
  error: string | null;

  fetchAgents: () => Promise<void>;
  selectAgent: (agent: Agent | null) => void;
  fetchStarters: (agentId: number) => Promise<void>;
  getAgentImageUrl: (agentId: number) => string;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  selectedAgent: null,
  starters: [],
  isLoading: false,
  error: null,

  fetchAgents: async () => {
    set({ isLoading: true, error: null });
    try {
      const agents = await agentsApi.list();
      set({ agents, isLoading: false });

      // Auto-select first agent if none selected
      if (agents.length > 0) {
        const starters = await agentsApi.getStarters(agents[0].id);
        set({ selectedAgent: agents[0], starters });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch agents';
      set({ error: message, isLoading: false });
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

  fetchStarters: async (agentId: number) => {
    try {
      const starters = await agentsApi.getStarters(agentId);
      set({ starters });
    } catch (error) {
      console.error('Failed to fetch starters:', error);
    }
  },

  getAgentImageUrl: (agentId: number) => {
    return agentsApi.getImageUrl(agentId);
  },
}));

export default useAgentStore;
