import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GroupList } from '../../components/settings/groups';
import { useGroupStore, usePermissionStore } from '../../stores';

export function GroupListPage() {
  const navigate = useNavigate();
  const { groups, isLoading, fetchGroups } = useGroupStore();
  const { permissions, isLoading: permLoading, isSuperAdmin } = usePermissionStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (permissions && !isSuperAdmin()) {
      navigate('/settings/agents');
    }
  }, [permissions, isSuperAdmin, navigate]);

  useEffect(() => {
    if (isSuperAdmin()) {
      fetchGroups();
    }
  }, [fetchGroups, isSuperAdmin]);

  if (permLoading || !permissions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isSuperAdmin()) {
    return null;
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Grupları</h1>
        <p className="text-gray-500 mt-1">
          Kullanıcı gruplarını yönetin
        </p>
      </div>

      <GroupList
        groups={groups}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
    </div>
  );
}

export default GroupListPage;
