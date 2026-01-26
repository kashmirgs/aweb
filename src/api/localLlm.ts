import { apiClient } from './client';
import type {
  LocalLLM,
  LocalLLMInstance,
  LocalLLMInstanceCreate,
  GPU,
  GPUWithInstances,
  GPUMetrics,
  GPUSuggestRequest,
  GPUSuggestResponse,
} from '../types/localLlm';

export const localLlmApi = {
  // Model operations
  async listModels(): Promise<LocalLLM[]> {
    const response = await apiClient.get<LocalLLM[]>('/local_llm');
    return response.data;
  },

  async getModel(id: number): Promise<LocalLLM> {
    const response = await apiClient.get<LocalLLM>(`/local_llm/${id}`);
    return response.data;
  },

  async createModel(data: Omit<LocalLLM, 'id'>): Promise<LocalLLM> {
    const response = await apiClient.post<LocalLLM>('/local_llm', data);
    return response.data;
  },

  async updateModel(id: number, data: Partial<LocalLLM>): Promise<LocalLLM> {
    const response = await apiClient.put<LocalLLM>(`/local_llm/${id}`, data);
    return response.data;
  },

  async deleteModel(id: number): Promise<void> {
    await apiClient.delete(`/local_llm/${id}`);
  },

  async downloadModel(id: number): Promise<void> {
    await apiClient.post(`/local_llm/${id}/download`);
  },

  // Instance operations
  async listInstances(): Promise<LocalLLMInstance[]> {
    const response = await apiClient.get<LocalLLMInstance[]>('/local_llm_instance');
    return response.data;
  },

  async getInstance(id: number): Promise<LocalLLMInstance> {
    const response = await apiClient.get<LocalLLMInstance>(`/local_llm_instance/${id}`);
    return response.data;
  },

  async createInstance(data: LocalLLMInstanceCreate): Promise<LocalLLMInstance> {
    const response = await apiClient.post<LocalLLMInstance>('/local_llm_instance', data);
    return response.data;
  },

  async updateInstance(id: number, data: Partial<LocalLLMInstanceCreate>): Promise<LocalLLMInstance> {
    const response = await apiClient.put<LocalLLMInstance>(`/local_llm_instance/${id}`, data);
    return response.data;
  },

  async deleteInstance(id: number): Promise<void> {
    await apiClient.delete(`/local_llm_instance/${id}`);
  },

  async loadInstance(id: number): Promise<void> {
    await apiClient.post(`/local_llm_instance/${id}/load`);
  },

  async unloadInstance(id: number): Promise<void> {
    await apiClient.post(`/local_llm_instance/${id}/unload`);
  },

  // GPU operations
  async listGPUs(): Promise<GPU[]> {
    const response = await apiClient.get<GPU[]>('/gpu');
    return response.data;
  },

  async getGPUsWithInstances(): Promise<GPUWithInstances[]> {
    const response = await apiClient.get<GPUWithInstances[]>('/gpu/instances');
    return response.data;
  },

  async getGPUMetrics(): Promise<GPUMetrics[]> {
    const response = await apiClient.get<GPUMetrics[]>('/gpu/metrics');
    return response.data;
  },

  async suggestGPU(data: GPUSuggestRequest): Promise<GPUSuggestResponse> {
    const response = await apiClient.post<GPUSuggestResponse>('/gpu/suggest', data);
    return response.data;
  },
};
