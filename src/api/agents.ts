import apiClient from './client';
import type { Agent, ConversationStarter } from '../types';

const API_BASE_URL = 'http://10.10.0.149:3000';

export const agentsApi = {
  async list(): Promise<Agent[]> {
    const response = await apiClient.get<Agent[]>('/chatbot');
    return response.data;
  },

  async get(id: number): Promise<Agent> {
    const response = await apiClient.get<Agent>(`/chatbot/${id}`);
    return response.data;
  },

  getImageUrl(id: number): string {
    const token = localStorage.getItem('access_token');
    return `${API_BASE_URL}/chatbot/${id}/image?token=${token}`;
  },

  async getStarters(chatbotId: number): Promise<ConversationStarter[]> {
    const response = await apiClient.get<ConversationStarter[]>('/conversation_starter', {
      params: { chatbot_id: chatbotId },
    });
    return response.data;
  },
};

export default agentsApi;
