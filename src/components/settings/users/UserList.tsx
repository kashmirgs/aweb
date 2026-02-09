import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { Table } from '../../common/Table';
import type { Column, SortConfig } from '../../common/Table';
import { Button } from '../../common/Button';
import { ConfirmModal } from '../../common/Modal';
import { useState, useMemo } from 'react';
import type { User } from '../../../types';
import { useUserStore } from '../../../stores';
import { formatDate } from '../../../lib/utils';

interface UserListProps {
  users: User[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function UserList({
  users,
  isLoading,
  searchQuery,
  onSearchChange,
}: UserListProps) {
  const navigate = useNavigate();
  const { deleteUser, isSaving } = useUserStore();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'username', direction: 'asc' });

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.surname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const key = sortConfig.key as keyof User;
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
  }, [filteredUsers, sortConfig]);

  const handleDelete = async () => {
    if (userToDelete) {
      const success = await deleteUser(userToDelete.id);
      if (success) {
        setDeleteModalOpen(false);
        setUserToDelete(null);
      }
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'username',
      header: 'Kullanıcı Adı',
      sortable: true,
      render: (user) => (
        <div className="font-medium text-gray-900">{user.username}</div>
      ),
    },
    {
      key: 'email',
      header: 'E-posta',
      sortable: true,
      render: (user) => (
        <div className="text-gray-500">{user.email}</div>
      ),
    },
    {
      key: 'name',
      header: 'Ad Soyad',
      render: (user) => (
        <div className="text-gray-500">
          {[user.name, user.surname].filter(Boolean).join(' ') || '-'}
        </div>
      ),
    },
    {
      key: 'department_name',
      header: 'Departman',
      render: (user) => (
        <div className="text-gray-500">{user.department_name || '-'}</div>
      ),
    },
    {
      key: 'created_at',
      header: 'Oluşturulma',
      sortable: true,
      render: (user) => (
        <span className="text-gray-500">
          {user.created_at ? formatDate(user.created_at) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (user) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/settings/users/${user.id}`);
            }}
            className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
            title="Düzenle"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          {user.id !== 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setUserToDelete(user);
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
            placeholder="Kullanıcı ara..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Button onClick={() => navigate('/settings/users/new')}>
            <Plus className="h-4 w-4" />
            Kullanıcı Oluştur
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        data={sortedUsers}
        keyExtractor={(user) => user.id}
        onRowClick={(user) => navigate(`/settings/users/${user.id}`)}
        isLoading={isLoading}
        emptyMessage="Kullanıcı bulunamadı"
        sortConfig={sortConfig}
        onSort={handleSort}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Kullanıcıyı Sil"
        message={`"${userToDelete?.username}" kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
        isLoading={isSaving}
      />
    </div>
  );
}

export default UserList;
