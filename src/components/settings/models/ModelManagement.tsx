import { useState, useEffect } from 'react';
import { useLocalLlmStore } from '../../../stores/localLlmStore';
import { ModelsTab } from './ModelsTab';
import { InstancesTab } from './InstancesTab';
import { GPUStatusTab } from './GPUStatusTab';
import { cn } from '../../../lib/utils';

type TabType = 'models' | 'instances' | 'gpu';

interface Tab {
  id: TabType;
  label: string;
}

const tabs: Tab[] = [
  { id: 'models', label: 'Modeller' },
  { id: 'instances', label: 'Instancelar' },
  { id: 'gpu', label: 'GPU Durumu' },
];

export function ModelManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('models');
  const {
    fetchModels,
    fetchInstances,
    fetchGPUs,
    fetchGPUsWithInstances,
    startMetricsPolling,
    stopMetricsPolling,
  } = useLocalLlmStore();

  useEffect(() => {
    // Fetch initial data
    fetchModels();
    fetchInstances();
    fetchGPUs();
    fetchGPUsWithInstances();

    // Start metrics polling when on GPU tab
    if (activeTab === 'gpu') {
      startMetricsPolling(5000);
    }

    return () => {
      stopMetricsPolling();
    };
  }, [fetchModels, fetchInstances, fetchGPUs, fetchGPUsWithInstances, startMetricsPolling, stopMetricsPolling, activeTab]);

  useEffect(() => {
    // Start/stop metrics polling based on active tab
    if (activeTab === 'gpu') {
      startMetricsPolling(5000);
    } else {
      stopMetricsPolling();
    }
  }, [activeTab, startMetricsPolling, stopMetricsPolling]);

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Model Yonetimi</h1>
        <p className="text-gray-600 mt-1">Local LLM modellerini yonetin</p>
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
        {activeTab === 'models' && <ModelsTab />}
        {activeTab === 'instances' && <InstancesTab />}
        {activeTab === 'gpu' && <GPUStatusTab />}
      </div>
    </div>
  );
}
