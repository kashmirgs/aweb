import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissionStore } from '../../stores/permissionStore';
import { ModelManagement } from '../../components/settings/models';
import { Loader2 } from 'lucide-react';

export function ModelManagementPage() {
  const navigate = useNavigate();
  const { isSuperAdmin, permissions, isLoading } = usePermissionStore();

  useEffect(() => {
    // Redirect if not super admin
    if (permissions && !isSuperAdmin()) {
      navigate('/settings/agents');
    }
  }, [permissions, isSuperAdmin, navigate]);

  if (isLoading || !permissions) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin()) {
    return null;
  }

  return <ModelManagement />;
}
