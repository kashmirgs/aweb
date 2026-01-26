export interface LocalLLM {
  id: number;
  model_key: string;
  hf_name: string;
  max_model_len: number;
  model_size: number;
  prompt_format: string;
  downloaded?: boolean;
}

export interface LocalLLMInstance {
  id: number;
  local_llm_id: number;
  gpu_ids: number[];
  name?: string;
  tensor_parallel_size: number;
  max_model_len_override?: number;
  status?: 'pending' | 'loading' | 'loaded' | 'unloading' | 'error';
  runtime_state?: string;  // "READY", "LOADING", "STOPPED", etc. from API
  local_llm?: LocalLLM;
}

export interface LocalLLMInstanceCreate {
  local_llm_id: number;
  gpu_ids: number[];
  name?: string;
  tensor_parallel_size: number;
  max_model_len_override?: number;
}

export interface GPU {
  id: number;
  name: string;
  memory_total: number;
  memory_used: number;
  memory_free: number;
  utilization?: number;
}

export interface GPUWithInstances extends GPU {
  instances: LocalLLMInstance[];
}

export interface GPUMetrics {
  gpu_id: number;
  memory_used: number;
  memory_total: number;
  utilization: number;
  temperature?: number;
}

export interface GPUSuggestRequest {
  model_size: number;
  tensor_parallel_size?: number;
}

export interface GPUSuggestResponse {
  suggested_gpu_ids: number[];
  reason?: string;
}
