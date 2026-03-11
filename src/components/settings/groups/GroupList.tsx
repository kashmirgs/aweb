import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { Table, Pagination } from '../../common/Table';
import type { Column, SortConfig } from '../../common/Table';
import { Button } from '../../common/Button';
import { ConfirmModal } from '../../common/Modal';
import { useState, useMemo, useEffect } from 'react';
import type { Group } from '../../../types/permission';
import { useGroupStore } from '../../../stores';
import { formatDate } from '../../../lib/utils';

interface GroupListProps {
  groups: Group[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function GroupList({
  groups,
  isLoading,
  searchQuery,
  onSearchChange,
}: GroupListProps) {
  const navigate = useNavigate();
  const { deleteGroup, isSaving } = useGroupStore();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 20;

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR')) ||
      group.description?.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR')) ||
      group.external_id?.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR'))
  );

  const sortedGroups = useMemo(() => {
    return [...filteredGroups].sort((a, b) => {
      const key = sortConfig.key as keyof Group;
      const aVal = a[key];
      const bVal = b[key];

      let comparison = 0;

      if (key === 'created_at') {
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
  }, [filteredGroups, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortConfig]);

  const totalPages = Math.ceil(sortedGroups.length / PAGE_SIZE);
  const paginatedGroups = sortedGroups.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleDelete = async () => {
    if (groupToDelete) {
      const success = await deleteGroup(groupToDelete.id);
      if (success) {
        setDeleteModalOpen(false);
        setGroupToDelete(null);
      }
    }
  };

  const columns: Column<Group>[] = [
    {
      key: 'name',
      header: 'Grup Adı',
      sortable: true,
      render: (group) => (
        <div className="font-medium text-gray-900">{group.name}</div>
      ),
    },
    {
      key: 'description',
      header: 'Açıklama',
      render: (group) => (
        <div className="text-gray-500">{group.description || '-'}</div>
      ),
    },
    {
      key: 'external_id',
      header: 'External ID',
      render: (group) => (
        <div className="text-gray-500">{group.external_id || '-'}</div>
      ),
    },
    {
      key: 'created_at',
      header: 'Oluşturulma',
      sortable: true,
      render: (group) => (
        <span className="text-gray-500">
          {group.created_at ? formatDate(group.created_at) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (group) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/settings/groups/${group.id}`);
            }}
            className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
            title="Düzenle"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setGroupToDelete(group);
              setDeleteModalOpen(true);
            }}
            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            title="Sil"
          >
            <Trash2 className="h-4 w-4" />
          </button>
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
            placeholder="Grup ara..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Button onClick={() => navigate('/settings/groups/new')}>
            <Plus className="h-4 w-4" />
            Grup Oluştur
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        data={paginatedGroups}
        keyExtractor={(group) => group.id}
        onRowClick={(group) => navigate(`/settings/groups/${group.id}`)}
        isLoading={isLoading}
        emptyMessage="Grup bulunamadı"
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
          setGroupToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Grubu Sil"
        message={`"${groupToDelete?.name}" grubunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
        isLoading={isSaving}
      />
    </div>
  );
}

export default GroupList;
