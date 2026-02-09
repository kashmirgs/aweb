import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserList } from '../../components/settings/users';
import { useUserStore, usePermissionStore } from '../../stores';

export function UserListPage() {
  const navigate = useNavigate();
  const { users, isLoading, fetchUsers } = useUserStore();
  const { permissions, isLoading: permLoading, isSuperAdmin } = usePermissionStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Super admin kontrolü
    if (permissions && !isSuperAdmin()) {
      navigate('/settings/agents');
    }
  }, [permissions, isSuperAdmin, navigate]);

  useEffect(() => {
    if (isSuperAdmin()) {
      fetchUsers();
    }
  }, [fetchUsers, isSuperAdmin]);

  // Wait for permissions to load
  if (permLoading || !permissions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Yetkisi yoksa yönlendir
  if (!isSuperAdmin()) {
    return null;
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kullanıcılar</h1>
        <p className="text-gray-500 mt-1">
          Sistem kullanıcılarını yönetin
        </p>
      </div>

      <UserList
        users={users}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
    </div>
  );
}

export default UserListPage;
