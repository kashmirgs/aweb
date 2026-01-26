import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AgentForm } from '../../components/settings/agents';
import { usePermissionStore } from '../../stores';

export function AgentCreatePage() {
  const navigate = useNavigate();
  const { canCreate, permissions, isLoading } = usePermissionStore();

  useEffect(() => {
    if (permissions && !canCreate()) {
      navigate('/settings/agents');
    }
  }, [permissions, canCreate, navigate]);

  if (isLoading || !permissions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!canCreate()) {
    return null;
  }

  return <AgentForm isNew />;
}

export default AgentCreatePage;
