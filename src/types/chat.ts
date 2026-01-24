export interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  chat_history_id?: number;
  created_at?: string;
}

export interface Conversation {
  id: number;
  title: string;
  bot_id: number;
  user_id?: number;
  created_at: string;
  updated_at?: string;
  messages?: Message[];
}

export interface CreateConversationRequest {
  title: string;
  bot_id: number;
}

export interface SendMessageRequest {
  content: string;
  chat_history_id: number;
  streaming?: boolean;
}
