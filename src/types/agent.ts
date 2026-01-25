export interface Agent {
  id: number;
  name: string;
  description?: string;
  system_prompt?: string;
  model?: string;
  temperature?: number;
  created_at?: string;
  updated_at?: string;
  interactive?: boolean;
  active?: boolean;
}

export interface ConversationStarter {
  id: number;
  chatbot_id: number;
  prompt: string;
  title?: string;
  created_at?: string;
}
