import { useState, useMemo, useCallback, useEffect } from 'react';
import { Table, Pagination } from '../../common/Table';
import type { Column, SortConfig } from '../../common/Table';
import { Modal } from '../../common/Modal';
import type { AuditLog } from '../../../types/log';
import { useLogStore } from '../../../stores/logStore';
import { cn } from '../../../lib/utils';

const PAGE_SIZE = 25;

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-100 text-green-800',
  POST: 'bg-blue-100 text-blue-800',
  PUT: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
};

function statusColor(code: number): string {
  if (code >= 200 && code < 300) return 'bg-green-100 text-green-800';
  if (code >= 400 && code < 500) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function AuditLogsTab() {
  const { auditLogs, auditPage, auditTotal, isAuditLoading, auditError, fetchAuditLogs } = useLogStore();

  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pathSearch, setPathSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const buildFilters = useCallback(() => {
    const f: Record<string, string | number> = {};
    if (methodFilter) f.method = methodFilter;
    if (pathSearch) f.path = pathSearch;
    if (dateFrom) f.from = dateFrom;
    if (dateTo) f.to = dateTo + 'T23:59:59';
    if (userIdFilter) f.user_id = Number(userIdFilter);
    return f;
  }, [methodFilter, pathSearch, dateFrom, dateTo, userIdFilter]);

  // Re-fetch from page 1 when server-side filters change
  useEffect(() => {
    fetchAuditLogs(1, buildFilters());
  }, [buildFilters, fetchAuditLogs]);

  // Status filter stays client-side (backend only supports exact status_code)
  const sorted = useMemo(() => {
    let result = [...auditLogs];
    if (statusFilter === '2xx') {
      result = result.filter(l => l.status_code >= 200 && l.status_code < 300);
    } else if (statusFilter === 'error') {
      result = result.filter(l => l.status_code >= 400);
    }
    result.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof AuditLog];
      const bVal = b[sortConfig.key as keyof AuditLog];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [auditLogs, statusFilter, sortConfig]);

  const totalPages = Math.ceil(auditTotal / PAGE_SIZE);

  const handlePageChange = useCallback((page: number) => {
    fetchAuditLogs(page, buildFilters());
  }, [fetchAuditLogs, buildFilters]);

  const handleSort = (key: string) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'desc' }
    );
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'created_at',
      header: 'Tarih',
      sortable: true,
      render: (item) => formatDate(item.created_at),
    },
    {
      key: 'http_method',
      header: 'Metod',
      sortable: true,
      render: (item) => (
        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', METHOD_COLORS[item.http_method] || 'bg-gray-100 text-gray-800')}>
          {item.http_method}
        </span>
      ),
    },
    {
      key: 'path',
      header: 'Path',
      sortable: true,
      render: (item) => <span className="font-mono text-xs">{item.path}</span>,
    },
    {
      key: 'status_code',
      header: 'Durum',
      sortable: true,
      render: (item) => (
        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', statusColor(item.status_code))}>
          {item.status_code}
        </span>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP',
      sortable: true,
      render: (item) => item.ip_address,
    },
    {
      key: 'user_id',
      header: 'Kullanıcı',
      sortable: true,
      render: (item) => item.user_id ?? '-',
    },
  ];

  if (auditError) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>Hata: {auditError}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">HTTP Metod</label>
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          >
            <option value="">Tümü</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Durum</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          >
            <option value="">Tümü</option>
            <option value="2xx">Başarılı (2xx)</option>
            <option value="error">Hata (4xx-5xx)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Path</label>
          <input
            type="text"
            value={pathSearch}
            onChange={e => setPathSearch(e.target.value)}
            placeholder="Path ara..."
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Başlangıç</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Bitiş</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Kullanıcı ID</label>
          <input
            type="text"
            value={userIdFilter}
            onChange={e => setUserIdFilter(e.target.value)}
            placeholder="Kullanıcı ID..."
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-28"
          />
        </div>
        <div className="ml-auto text-xs text-gray-500 self-center">
          Toplam: {auditTotal.toLocaleString('tr-TR')} kayıt
        </div>
      </div>

      <Table
        columns={columns}
        data={sorted}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => setSelectedLog(item)}
        isLoading={isAuditLoading}
        emptyMessage="Denetim kaydı bulunamadı"
        sortConfig={sortConfig}
        onSort={handleSort}
      />

      <Pagination
        currentPage={auditPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Denetim Kaydı Detayı"
        size="xl"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tarih</label>
                <p className="text-sm">{formatDate(selectedLog.created_at)}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">HTTP Metod</label>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', METHOD_COLORS[selectedLog.http_method] || 'bg-gray-100 text-gray-800')}>
                  {selectedLog.http_method}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Path</label>
                <p className="text-sm font-mono">{selectedLog.path}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Durum Kodu</label>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', statusColor(selectedLog.status_code))}>
                  {selectedLog.status_code}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">IP Adresi</label>
                <p className="text-sm">{selectedLog.ip_address}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Kullanıcı ID</label>
                <p className="text-sm">{selectedLog.user_id ?? '-'}</p>
              </div>
            </div>

            {selectedLog.query_params && Object.keys(selectedLog.query_params).length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Query Params</label>
                <pre className="text-xs bg-gray-50 rounded p-3 overflow-auto max-h-40 border border-gray-200">
                  {JSON.stringify(selectedLog.query_params, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.request_body && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Request Body</label>
                <pre className="text-xs bg-gray-50 rounded p-3 overflow-auto max-h-40 border border-gray-200">
                  {selectedLog.request_body}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
