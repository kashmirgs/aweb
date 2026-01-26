import { create } from 'zustand';
import { localLlmApi } from '../api/localLlm';
import type {
  LocalLLM,
  LocalLLMInstance,
  LocalLLMInstanceCreate,
  GPU,
  GPUWithInstances,
  GPUMetrics,
} from '../types/localLlm';

interface LocalLlmState {
  // Data
  models: LocalLLM[];
  instances: LocalLLMInstance[];
  gpus: GPU[];
  gpusWithInstances: GPUWithInstances[];
  gpuMetrics: GPUMetrics[];

  // Loading states
  isLoadingModels: boolean;
  isLoadingInstances: boolean;
  isLoadingGPUs: boolean;
  isLoadingMetrics: boolean;
  isSaving: boolean;

  // Error
  error: string | null;

  // Polling
  metricsPollingInterval: ReturnType<typeof setInterval> | null;

  // Model actions
  fetchModels: () => Promise<void>;
  deleteModel: (id: number) => Promise<boolean>;
  downloadModel: (id: number) => Promise<boolean>;

  // Instance actions
  fetchInstances: () => Promise<void>;
  createInstance: (data: LocalLLMInstanceCreate) => Promise<LocalLLMInstance | null>;
  deleteInstance: (id: number) => Promise<boolean>;
  loadInstance: (id: number) => Promise<boolean>;
  unloadInstance: (id: number) => Promise<boolean>;

  // GPU actions
  fetchGPUs: () => Promise<void>;
  fetchGPUsWithInstances: () => Promise<void>;
  fetchGPUMetrics: () => Promise<void>;
  startMetricsPolling: (intervalMs?: number) => void;
  stopMetricsPolling: () => void;

  // Helpers
  getModelById: (id: number) => LocalLLM | undefined;
  getInstancesByModelId: (modelId: number) => LocalLLMInstance[];

  // Utility
  clearError: () => void;
}

export const useLocalLlmStore = create<LocalLlmState>((set, get) => ({
  // Initial state
  models: [],
  instances: [],
  gpus: [],
  gpusWithInstances: [],
  gpuMetrics: [],
  isLoadingModels: false,
  isLoadingInstances: false,
  isLoadingGPUs: false,
  isLoadingMetrics: false,
  isSaving: false,
  error: null,
  metricsPollingInterval: null,

  // Model actions
  fetchModels: async () => {
    set({ isLoadingModels: true, error: null });
    try {
      const models = await localLlmApi.listModels();
      set({ models, isLoadingModels: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Model listesi alinamadi';
      set({ error: message, isLoadingModels: false });
    }
  },

  deleteModel: async (id: number) => {
    set({ isSaving: true, error: null });
    try {
      await localLlmApi.deleteModel(id);
      const models = get().models.filter((m) => m.id !== id);
      set({ models, isSaving: false });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Model silinemedi';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  downloadModel: async (id: number) => {
    set({ isSaving: true, error: null });
    try {
      await localLlmApi.downloadModel(id);
      // Refresh models to get updated download status
      await get().fetchModels();
      set({ isSaving: false });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Model indirilemedi';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  // Instance actions
  fetchInstances: async () => {
    set({ isLoadingInstances: true, error: null });
    try {
      const instances = await localLlmApi.listInstances();
      set({ instances, isLoadingInstances: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Instance listesi alinamadi';
      set({ error: message, isLoadingInstances: false });
    }
  },

  createInstance: async (data: LocalLLMInstanceCreate) => {
    set({ isSaving: true, error: null });
    try {
      const instance = await localLlmApi.createInstance(data);
      const instances = [...get().instances, instance];
      set({ instances, isSaving: false });
      return instance;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Instance olusturulamadi';
      set({ error: message, isSaving: false });
      return null;
    }
  },

  deleteInstance: async (id: number) => {
    set({ isSaving: true, error: null });
    try {
      await localLlmApi.deleteInstance(id);
      const instances = get().instances.filter((i) => i.id !== id);
      set({ instances, isSaving: false });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Instance silinemedi';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  loadInstance: async (id: number) => {
    set({ isSaving: true, error: null });
    try {
      await localLlmApi.loadInstance(id);
      // Update local state to reflect loading status
      const instances = get().instances.map((i) =>
        i.id === id ? { ...i, status: 'loading' as const } : i
      );
      set({ instances, isSaving: false });
      // Refresh instances to get actual status
      setTimeout(() => get().fetchInstances(), 1000);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Instance yuklenemedi';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  unloadInstance: async (id: number) => {
    set({ isSaving: true, error: null });
    try {
      await localLlmApi.unloadInstance(id);
      // Update local state to reflect unloading status
      const instances = get().instances.map((i) =>
        i.id === id ? { ...i, status: 'unloading' as const } : i
      );
      set({ instances, isSaving: false });
      // Refresh instances to get actual status
      setTimeout(() => get().fetchInstances(), 1000);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Instance kaldirilamadi';
      set({ error: message, isSaving: false });
      return false;
    }
  },

  // GPU actions
  fetchGPUs: async () => {
    set({ isLoadingGPUs: true, error: null });
    try {
      const gpus = await localLlmApi.listGPUs();
      set({ gpus, isLoadingGPUs: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GPU listesi alinamadi';
      set({ error: message, isLoadingGPUs: false });
    }
  },

  fetchGPUsWithInstances: async () => {
    set({ isLoadingGPUs: true, error: null });
    try {
      const gpusWithInstances = await localLlmApi.getGPUsWithInstances();
      set({ gpusWithInstances, isLoadingGPUs: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GPU detaylari alinamadi';
      set({ error: message, isLoadingGPUs: false });
    }
  },

  fetchGPUMetrics: async () => {
    set({ isLoadingMetrics: true });
    try {
      const gpuMetrics = await localLlmApi.getGPUMetrics();
      set({ gpuMetrics, isLoadingMetrics: false });
    } catch (error) {
      // Don't set error for metrics polling failures
      set({ isLoadingMetrics: false });
    }
  },

  startMetricsPolling: (intervalMs = 5000) => {
    // Stop existing polling first
    get().stopMetricsPolling();

    // Fetch immediately
    get().fetchGPUMetrics();

    // Start polling
    const interval = setInterval(() => {
      get().fetchGPUMetrics();
    }, intervalMs);

    set({ metricsPollingInterval: interval });
  },

  stopMetricsPolling: () => {
    const { metricsPollingInterval } = get();
    if (metricsPollingInterval) {
      clearInterval(metricsPollingInterval);
      set({ metricsPollingInterval: null });
    }
  },

  // Helpers
  getModelById: (id: number) => {
    return get().models.find((m) => m.id === id);
  },

  getInstancesByModelId: (modelId: number) => {
    return get().instances.filter((i) => i.local_llm_id === modelId);
  },

  // Utility
  clearError: () => set({ error: null }),
}));
