export interface AuditLog {
  id: number;
  created_at: string;
  user_id: number | null;
  event_type: string;
  http_method: string;
  path: string;
  query_params: Record<string, unknown> | null;
  status_code: number;
  ip_address: string;
  request_id: string;
  request_body: string | null;
  extra: Record<string, unknown> | null;
}

export interface ExceptionLog {
  id: number;
  created_at: string;
  user_id: number | null;
  http_method: string;
  path: string;
  ip_address: string;
  query_params: Record<string, unknown> | null;
  request_body: string | null;
  exception_type: string;
  exception_message: string;
  stack_trace: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
}
