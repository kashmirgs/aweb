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
    const response = await apiClient.post<Conversation>('/chat_history', data);
    return response.data;
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
