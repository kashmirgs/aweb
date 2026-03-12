import { useState, useMemo, useCallback, useEffect } from 'react';
import { Table, Pagination } from '../../common/Table';
import type { Column, SortConfig } from '../../common/Table';
import { Modal } from '../../common/Modal';
import type { ExceptionLog } from '../../../types/log';
import { useLogStore } from '../../../stores/logStore';
import { cn } from '../../../lib/utils';

const PAGE_SIZE = 25;

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-100 text-green-800',
  POST: 'bg-blue-100 text-blue-800',
  PUT: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
};

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

export function ExceptionLogsTab() {
  const { exceptionLogs, exceptionPage, exceptionTotal, isExceptionLoading, exceptionError, fetchExceptionLogs } = useLogStore();

  const [typeSearch, setTypeSearch] = useState('');
  const [pathSearch, setPathSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });
  const [selectedLog, setSelectedLog] = useState<ExceptionLog | null>(null);

  const buildFilters = useCallback(() => {
    const f: Record<string, string | number> = {};
    if (typeSearch) f.exception_type = typeSearch;
    if (pathSearch) f.path = pathSearch;
    if (dateFrom) f.from = dateFrom;
    if (dateTo) f.to = dateTo + 'T23:59:59';
    if (userIdFilter) f.user_id = Number(userIdFilter);
    return f;
  }, [typeSearch, pathSearch, dateFrom, dateTo, userIdFilter]);

  // Re-fetch from page 1 when filters change
  useEffect(() => {
    fetchExceptionLogs(1, buildFilters());
  }, [buildFilters, fetchExceptionLogs]);

  const sorted = useMemo(() => {
    const result = [...exceptionLogs];
    result.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof ExceptionLog];
      const bVal = b[sortConfig.key as keyof ExceptionLog];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [exceptionLogs, sortConfig]);

  const totalPages = Math.ceil(exceptionTotal / PAGE_SIZE);

  const handlePageChange = useCallback((page: number) => {
    fetchExceptionLogs(page, buildFilters());
  }, [fetchExceptionLogs, buildFilters]);

  const handleSort = (key: string) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'desc' }
    );
  };

  const columns: Column<ExceptionLog>[] = [
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
      key: 'exception_type',
      header: 'Hata Tipi',
      sortable: true,
      render: (item) => (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
          {item.exception_type}
        </span>
      ),
    },
    {
      key: 'exception_message',
      header: 'Mesaj',
      sortable: false,
      render: (item) => (
        <span className="text-xs text-gray-600" title={item.exception_message}>
          {item.exception_message.length > 80
            ? item.exception_message.slice(0, 80) + '...'
            : item.exception_message}
        </span>
      ),
    },
    {
      key: 'user_id',
      header: 'Kullanıcı',
      sortable: true,
      render: (item) => item.user_id ?? '-',
    },
  ];

  if (exceptionError) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>Hata: {exceptionError}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Hata Tipi</label>
          <input
            type="text"
            value={typeSearch}
            onChange={e => setTypeSearch(e.target.value)}
            placeholder="Hata tipi ara..."
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          />
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
          Toplam: {exceptionTotal.toLocaleString('tr-TR')} kayıt
        </div>
      </div>

      <Table
        columns={columns}
        data={sorted}
        keyExtractor={(item) => item.id}
        onRowClick={(item) => setSelectedLog(item)}
        isLoading={isExceptionLoading}
        emptyMessage="Hata kaydı bulunamadı"
        sortConfig={sortConfig}
        onSort={handleSort}
      />

      <Pagination
        currentPage={exceptionPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Hata Detayı"
        size="xl"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hata Tipi</label>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  {selectedLog.exception_type}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tarih</label>
                <p className="text-sm">{formatDate(selectedLog.created_at)}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Path</label>
                <p className="text-sm font-mono">{selectedLog.path}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">HTTP Metod</label>
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', METHOD_COLORS[selectedLog.http_method] || 'bg-gray-100 text-gray-800')}>
                  {selectedLog.http_method}
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

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Mesaj</label>
              <p className="text-sm text-gray-900">{selectedLog.exception_message}</p>
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

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Stack Trace</label>
              <pre className="text-xs bg-gray-900 text-green-400 rounded p-3 overflow-auto max-h-96 border border-gray-700">
                {selectedLog.stack_trace}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
