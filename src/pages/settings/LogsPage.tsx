import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissionStore } from '../../stores';
import { AuditLogsTab, ExceptionLogsTab } from '../../components/settings/logs';
import { cn } from '../../lib/utils';

type TabType = 'audit' | 'exception';

interface Tab {
  id: TabType;
  label: string;
}

const tabs: Tab[] = [
  { id: 'audit', label: 'Denetim Kayıtları' },
  { id: 'exception', label: 'Hata Kayıtları' },
];

export function LogsPage() {
  const navigate = useNavigate();
  const { permissions, isLoading: permLoading, isSuperAdmin } = usePermissionStore();
  const [activeTab, setActiveTab] = useState<TabType>('audit');

  useEffect(() => {
    if (permissions && !isSuperAdmin()) {
      navigate('/settings/agents', { replace: true });
    }
  }, [permissions, isSuperAdmin, navigate]);

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
        <h1 className="text-2xl font-bold text-gray-900">Kayıtlar</h1>
        <p className="text-gray-600 mt-1">Sistem denetim ve hata kayıtlarını görüntüleyin</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'audit' && <AuditLogsTab />}
        {activeTab === 'exception' && <ExceptionLogsTab />}
      </div>
    </div>
  );
}

export default LogsPage;
