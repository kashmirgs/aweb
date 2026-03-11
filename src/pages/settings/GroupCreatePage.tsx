import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { GroupForm } from '../../components/settings/groups';
import { usePermissionStore } from '../../stores';

export function GroupCreatePage() {
  const navigate = useNavigate();
  const { permissions, isLoading, isSuperAdmin } = usePermissionStore();

  useEffect(() => {
    if (permissions && !isSuperAdmin()) {
      navigate('/settings/agents');
    }
  }, [permissions, isSuperAdmin, navigate]);

  if (isLoading || !permissions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isSuperAdmin()) {
    return null;
  }

  return <GroupForm isNew />;
}

export default GroupCreatePage;
