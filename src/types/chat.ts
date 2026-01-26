import type { MessageAttachment } from './attachment';

export interface Message {
  id?: number;
  role?: 'user' | 'assistant' | 'system';
  sender_role?: 'user' | 'assistant' | 'system';
  content: string;
  chat_history_id?: number;
  created_at?: string;
  bot_reply?: boolean;
  attachments?: MessageAttachment[];
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
  bot_id?: number;
  streaming?: boolean;
}
