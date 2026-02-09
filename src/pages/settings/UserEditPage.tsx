import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { UserForm } from '../../components/settings/users';
import { usePermissionStore } from '../../stores';

export function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { permissions, isLoading, isSuperAdmin } = usePermissionStore();

  const userId = id ? Number(id) : undefined;

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

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Geçersiz kullanıcı ID</p>
      </div>
    );
  }

  if (!isSuperAdmin()) {
    return null;
  }

  return <UserForm userId={userId} />;
}

export default UserEditPage;
