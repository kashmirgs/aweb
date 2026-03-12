import apiClient from './client';
import type { AuditLog, ExceptionLog, PaginatedResponse } from '../types/log';

interface LogParams {
  page?: number;
  page_size?: number;
  method?: string;
  status_code?: number;
  path?: string;
  from?: string;
  to?: string;
  user_id?: number;
  exception_type?: string;
}

export const logsApi = {
  getAuditLogs: (params: LogParams = {}) =>
    apiClient.get<PaginatedResponse<AuditLog>>('/logs/audit', { params }).then(r => r.data),
  getExceptionLogs: (params: LogParams = {}) =>
    apiClient.get<PaginatedResponse<ExceptionLog>>('/logs/exceptions', { params }).then(r => r.data),
};
