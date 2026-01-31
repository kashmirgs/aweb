import apiClient from './client';
import type { Agent, ConversationStarter, AgentCreateRequest, AgentUpdateRequest, AgentFile } from '../types';
import { API_BASE_URL } from '../config/api';

export const agentsApi = {
  async list(): Promise<Agent[]> {
    const response = await apiClient.get<Agent[]>('/chatbot', {
      params: { limit: 100 }
    });
    return response.data;
  },

  async get(id: number): Promise<Agent> {
    const response = await apiClient.get<Agent>(`/chatbot/${id}`);
    return response.data;
  },

  async create(data: AgentCreateRequest): Promise<Agent> {
    const response = await apiClient.post<Agent>('/chatbot', data);
    return response.data;
  },

  async update(id: number, data: AgentUpdateRequest): Promise<Agent> {
    // Try PUT first (some backends don't support PATCH)
    const response = await apiClient.put<Agent>(`/chatbot/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/chatbot/${id}`);
  },

  getImageUrl(id: number, version?: number | string): string {
    const url = `${API_BASE_URL}/chatbot/${id}/image`;
    return version ? `${url}?v=${version}` : url;
  },

  async uploadImage(id: number, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    await apiClient.post(`/chatbot/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // File management
  async listFiles(chatbotId: number): Promise<AgentFile[]> {
    const response = await apiClient.get<AgentFile[]>('/files', {
      params: { chatbot_id: chatbotId },
    });
    return response.data;
  },

  async uploadFile(chatbotId: number, file: File): Promise<AgentFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatbot_id', String(chatbotId));
    const response = await apiClient.post<AgentFile>('/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteFile(_chatbotId: number, fileId: number): Promise<void> {
    await apiClient.delete(`/files/${fileId}`);
  },

  async buildIndex(chatbotId: number): Promise<void> {
    await apiClient.post('/chatbot/build_index', { chatbot_id: chatbotId });
  },

  // Conversation starters
  async getStarters(chatbotId: number): Promise<ConversationStarter[]> {
    const response = await apiClient.get<ConversationStarter[]>('/conversation_starter', {
      params: { chatbot_id: chatbotId },
    });
    return response.data;
  },

  async createStarter(chatbotId: number, data: { title?: string; prompt: string }): Promise<ConversationStarter> {
    const response = await apiClient.post<ConversationStarter>('/conversation_starter', {
      bot_id: chatbotId,  // API expects bot_id, not chatbot_id
      ...data,
    });
    return response.data;
  },

  async updateStarter(starterId: number, data: { title?: string; prompt: string }): Promise<ConversationStarter> {
    const response = await apiClient.put<ConversationStarter>('/conversation_starter', {
      cs_id: starterId,
      ...data,
    });
    return response.data;
  },

  async deleteStarter(starterId: number): Promise<void> {
    await apiClient.delete(`/conversation_starter/${starterId}`);
  },
};

export default agentsApi;
