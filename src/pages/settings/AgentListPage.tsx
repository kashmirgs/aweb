import { useEffect, useState, useMemo } from 'react';
import { AgentList } from '../../components/settings/agents';
import { useAgentStore, usePermissionStore } from '../../stores';

export function AgentListPage() {
  const { agents, isLoading, fetchAgents } = useAgentStore();
  const { permissions, isLoading: permLoading, isSuperAdmin } = usePermissionStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Filter agents based on user permissions
  const editableAgents = useMemo(() => {
    if (!permissions) return [];
    if (permissions.is_super_admin) return agents;
    const editableIds = permissions.admin_agent_ids ?? [];
    return agents.filter(agent => editableIds.includes(agent.id));
  }, [agents, permissions]);

  // Wait for permissions to load
  if (permLoading || !permissions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ajanlar</h1>
        <p className="text-gray-500 mt-1">
          {isSuperAdmin() ? 'Tüm ajanları yönetin' : 'Yönetici olduğunuz ajanlar'}
        </p>
      </div>

      <AgentList
        agents={editableAgents}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
    </div>
  );
}

export default AgentListPage;
