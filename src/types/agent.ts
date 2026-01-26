export interface Agent {
  id: number;
  name: string;
  description?: string;
  system_prompt?: string;
  model?: string;
  created_at?: string;
  modified_at?: string;
  interactive?: boolean;
  active?: boolean;
  local_llm_instance_id?: number;
  warning_message?: string;
  theme?: string;
  subtitle?: string;
  index_id?: number;
  chat_history_size?: number;
  index_search_size?: number;
  index_result_distance?: number;
  llm_settings?: LLMSettings;
  index_settings?: IndexSettings;
  created_by?: number;
  modified_by?: number;
}

export interface LLMSettings {
  temperature?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  max_token?: number;
}

export interface IndexSettings {
  chunk_size?: number;
  chunk_overlap?: number;
  index_status?: string;
}

export interface AgentCreateRequest {
  name: string;
  system_prompt?: string;
  description?: string;
  local_llm_instance_id?: number;
  warning_message?: string;
  interactive?: boolean;
  active?: boolean;
  chat_history_size?: number;
  index_search_size?: number;
  index_result_distance?: number;
  llm_settings?: LLMSettings;
  index_settings?: Partial<IndexSettings>;
}

export interface AgentUpdateRequest extends Partial<AgentCreateRequest> {}

export interface ConversationStarter {
  id: number;
  chatbot_id: number;
  prompt: string;
  title?: string;
  created_at?: string;
}

export interface AgentFile {
  id: number;
  chatbot_id: number;
  filename: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  created_at?: string;
}
