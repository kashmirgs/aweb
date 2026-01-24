import apiClient from './client';
import type { Conversation, CreateConversationRequest } from '../types';

export const conversationsApi = {
  async list(): Promise<Conversation[]> {
    const response = await apiClient.get<Conversation[]>('/chat_history');
    return response.data;
  },

  async get(id: number): Promise<Conversation> {
    const response = await apiClient.get<Conversation>(`/chat_history/${id}`);
    return response.data;
  },

  async create(data: CreateConversationRequest): Promise<Conversation> {
    const response = await apiClient.post<{ chat_history_id: number; title: string; bot_id?: number; created_at?: string }>('/chat_history', data);
    // API returns chat_history_id, map to id for consistency
    return {
      id: response.data.chat_history_id,
      title: response.data.title,
      bot_id: data.bot_id,
      created_at: response.data.created_at || new Date().toISOString(),
    };
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/chat_history/${id}`);
  },

  async update(id: number, data: Partial<CreateConversationRequest>): Promise<Conversation> {
    const response = await apiClient.patch<Conversation>(`/chat_history/${id}`, data);
    return response.data;
  },
};

export default conversationsApi;
