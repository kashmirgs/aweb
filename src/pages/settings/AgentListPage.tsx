import { useEffect, useState } from 'react';
import { AgentList } from '../../components/settings/agents';
import { useAgentStore, usePermissionStore } from '../../stores';

export function AgentListPage() {
  const { agents, isLoading, fetchAgents } = useAgentStore();
  const { permissions, isLoading: permLoading } = usePermissionStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

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
        <p className="text-gray-500 mt-1">Tüm ajanları yönetin</p>
      </div>

      <AgentList
        agents={agents}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
    </div>
  );
}

export default AgentListPage;
