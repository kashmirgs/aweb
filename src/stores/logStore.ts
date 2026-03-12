import { create } from 'zustand';
import type { AuditLog, ExceptionLog, PaginatedResponse } from '../types/log';
import { logsApi } from '../api/logs';

const PAGE_SIZE = 25;

interface LogState {
  auditLogs: AuditLog[];
  auditPage: number;
  auditTotal: number;
  isAuditLoading: boolean;
  auditError: string | null;

  exceptionLogs: ExceptionLog[];
  exceptionPage: number;
  exceptionTotal: number;
  isExceptionLoading: boolean;
  exceptionError: string | null;

  fetchAuditLogs: (page?: number, filters?: Record<string, string | number>) => Promise<void>;
  fetchExceptionLogs: (page?: number, filters?: Record<string, string | number>) => Promise<void>;
}

function extractPage<T>(data: unknown): PaginatedResponse<T> {
  const resp = data as PaginatedResponse<T>;
  if (resp && Array.isArray(resp.items)) {
    return resp;
  }
  // Fallback: if API returns plain array
  if (Array.isArray(data)) {
    return { items: data as T[], page: 1, page_size: data.length, total: data.length, has_next: false };
  }
  return { items: [], page: 1, page_size: PAGE_SIZE, total: 0, has_next: false };
}

export const useLogStore = create<LogState>((set) => ({
  auditLogs: [],
  auditPage: 1,
  auditTotal: 0,
  isAuditLoading: false,
  auditError: null,

  exceptionLogs: [],
  exceptionPage: 1,
  exceptionTotal: 0,
  isExceptionLoading: false,
  exceptionError: null,

  fetchAuditLogs: async (page = 1, filters: Record<string, string | number> = {}) => {
    set({ isAuditLoading: true, auditError: null });
    try {
      const data = await logsApi.getAuditLogs({ page, page_size: PAGE_SIZE, ...filters });
      const result = extractPage<AuditLog>(data);
      set({
        auditLogs: result.items,
        auditPage: result.page,
        auditTotal: result.total,
        isAuditLoading: false,
      });
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } };
      const message = axiosError.response
        ? `Sunucu hatası: ${axiosError.response.status}`
        : error instanceof Error ? error.message : 'Denetim kayıtları yüklenemedi';
      set({ auditError: message, isAuditLoading: false });
    }
  },

  fetchExceptionLogs: async (page = 1, filters: Record<string, string | number> = {}) => {
    set({ isExceptionLoading: true, exceptionError: null });
    try {
      const data = await logsApi.getExceptionLogs({ page, page_size: PAGE_SIZE, ...filters });
      const result = extractPage<ExceptionLog>(data);
      set({
        exceptionLogs: result.items,
        exceptionPage: result.page,
        exceptionTotal: result.total,
        isExceptionLoading: false,
      });
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } };
      const message = axiosError.response
        ? `Sunucu hatası: ${axiosError.response.status}`
        : error instanceof Error ? error.message : 'Hata kayıtları yüklenemedi';
      set({ exceptionError: message, isExceptionLoading: false });
    }
  },
}));
