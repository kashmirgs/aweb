export interface UserPermissions {
  is_super_admin: boolean;
  admin_agent_ids: number[];
  user_agent_ids: number[];
}

export interface GroupAuthorization {
  id: number;
  group_id: number;
  group_name: string;
  chatbot_id: number;
  created_at?: string;
}

export interface UserAuthorization {
  id: number;
  user_id: number;
  username: string;
  chatbot_id: number;
  is_admin: boolean;
  created_at?: string;
}

export interface LLMModel {
  id: number;
  name: string;
  model_id: string;
  description?: string;
  created_at?: string;
}

export interface AgentFile {
  id: number;
  chatbot_id?: number;
  filename?: string;
  name?: string;
  file_size?: number;
  size?: number;
  file_type?: string;
  type?: string;
  status?: 'pending' | 'processing' | 'ready' | 'error' | string;
  created_at?: string;
}
