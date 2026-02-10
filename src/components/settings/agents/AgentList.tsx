import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { Table, Pagination } from '../../common/Table';
import type { Column, SortConfig } from '../../common/Table';
import { Badge } from '../../common/Badge';
import { Button } from '../../common/Button';
import { ConfirmModal } from '../../common/Modal';
import { useState, useMemo, useEffect } from 'react';
import type { Agent } from '../../../types';
import { usePermissionStore, useAgentStore } from '../../../stores';
import { formatDate } from '../../../lib/utils';

interface AgentListProps {
  agents: Agent[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function AgentList({
  agents,
  isLoading,
  searchQuery,
  onSearchChange,
}: AgentListProps) {
  const navigate = useNavigate();
  const { canCreate, canEdit, canDelete } = usePermissionStore();
  const { deleteAgent, isSaving } = useAgentStore();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 30;

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR')) ||
      agent.description?.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR'))
  );

  const sortedAgents = useMemo(() => {
    return [...filteredAgents].sort((a, b) => {
      const key = sortConfig.key as keyof Agent;
      const aVal = a[key];
      const bVal = b[key];

      let comparison = 0;

      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        comparison = aVal === bVal ? 0 : aVal ? -1 : 1;
      } else if (key === 'created_at') {
        // Date string comparison for created_at
        const aDate = aVal ? new Date(aVal as string).getTime() : 0;
        const bDate = bVal ? new Date(bVal as string).getTime() : 0;
        comparison = aDate - bDate;
      } else if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal, 'tr');
      } else {
        comparison = String(aVal ?? '').localeCompare(String(bVal ?? ''), 'tr');
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredAgents, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortConfig]);

  const totalPages = Math.ceil(sortedAgents.length / PAGE_SIZE);
  const paginatedAgents = sortedAgents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleDelete = async () => {
    if (agentToDelete) {
      const success = await deleteAgent(agentToDelete.id);
      if (success) {
        setDeleteModalOpen(false);
        setAgentToDelete(null);
      }
    }
  };

  const columns: Column<Agent>[] = [
    {
      key: 'name',
      header: 'Ajan Adı',
      sortable: true,
      render: (agent) => (
        <div className="font-medium text-gray-900">{agent.name}</div>
      ),
    },
    {
      key: 'description',
      header: 'Açıklama',
      render: (agent) => (
        <div className="text-gray-500 max-w-xs truncate">
          {agent.description || '-'}
        </div>
      ),
    },
    {
      key: 'interactive',
      header: 'İnteraktif',
      sortable: true,
      render: (agent) => (
        <Badge variant={agent.interactive ? 'success' : 'default'}>
          {agent.interactive ? 'Evet' : 'Hayır'}
        </Badge>
      ),
    },
    {
      key: 'active',
      header: 'Durum',
      sortable: true,
      render: (agent) => (
        <Badge variant={agent.active ? 'success' : 'danger'}>
          {agent.active ? 'Aktif' : 'Pasif'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Oluşturulma',
      sortable: true,
      render: (agent) => (
        <span className="text-gray-500">
          {agent.created_at ? formatDate(agent.created_at) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (agent) => (
        <div className="flex items-center gap-2">
          {canEdit(agent.id) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/settings/agents/${agent.id}`);
              }}
              className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
              title="Düzenle"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
          {canDelete(agent.id) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAgentToDelete(agent);
                setDeleteModalOpen(true);
              }}
              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Ajan ara..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {canCreate() && (
            <Button onClick={() => navigate('/settings/agents/new')}>
              <Plus className="h-4 w-4" />
              Ajan Oluştur
            </Button>
          )}
        </div>
      </div>

      <Table
        columns={columns}
        data={paginatedAgents}
        keyExtractor={(agent) => agent.id}
        onRowClick={(agent) => canEdit(agent.id) && navigate(`/settings/agents/${agent.id}`)}
        isLoading={isLoading}
        emptyMessage="Ajan bulunamadı"
        sortConfig={sortConfig}
        onSort={handleSort}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setAgentToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Ajanı Sil"
        message={`"${agentToDelete?.name}" ajanını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
        isLoading={isSaving}
      />
    </div>
  );
}

export default AgentList;
