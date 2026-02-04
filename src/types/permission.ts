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

export interface UserAuthorizationUser {
  id: number;
  username: string;
  email: string;
  name?: string;
  surname?: string;
  department?: string;
  phone?: string;
  foreign_id?: string;
  created_at?: string;
}

export interface UserAuthorizationScope {
  id: number;
  name: string;
  description?: string;
  via_group: boolean;
}

export interface UserAuthorization {
  agent_id: number;
  user: UserAuthorizationUser;
  scopes: UserAuthorizationScope[];
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

export interface Scope {
  id: number;
  name: string;
  description?: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  external_id?: string;
}
