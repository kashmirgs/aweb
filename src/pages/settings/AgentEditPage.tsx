import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AgentForm } from '../../components/settings/agents';
import { usePermissionStore } from '../../stores';

export function AgentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canEdit, permissions, isLoading } = usePermissionStore();

  const agentId = id ? Number(id) : undefined;

  useEffect(() => {
    if (permissions && agentId && !canEdit(agentId)) {
      navigate('/settings/agents');
    }
  }, [permissions, agentId, canEdit, navigate]);

  if (isLoading || !permissions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!agentId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Geçersiz ajan ID</p>
      </div>
    );
  }

  return <AgentForm agentId={agentId} />;
}

export default AgentEditPage;
