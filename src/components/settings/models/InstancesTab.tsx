import { useState } from 'react';
import { Play, Square, Trash2, Loader2 } from 'lucide-react';
import { useLocalLlmStore } from '../../../stores/localLlmStore';
import { Button } from '../../common/Button';
import { Table, type Column } from '../../common/Table';
import { ConfirmModal } from '../../common/Modal';
import { cn } from '../../../lib/utils';
import type { LocalLLMInstance } from '../../../types/localLlm';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Bekliyor', color: 'bg-gray-100 text-gray-700' },
  loading: { label: 'Yukleniyor', color: 'bg-blue-100 text-blue-700' },
  loaded: { label: 'Aktif', color: 'bg-green-100 text-green-700' },
  unloading: { label: 'Kaldiriliyor', color: 'bg-yellow-100 text-yellow-700' },
  error: { label: 'Hata', color: 'bg-red-100 text-red-700' },
};

export function InstancesTab() {
  const {
    instances,
    isLoadingInstances,
    isSaving,
    error,
    getModelById,
    loadInstance,
    unloadInstance,
    deleteInstance,
    fetchInstances,
  } = useLocalLlmStore();

  const [instanceToDelete, setInstanceToDelete] = useState<LocalLLMInstance | null>(null);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  const handleLoad = async (instance: LocalLLMInstance) => {
    setActionInProgress(instance.id);
    await loadInstance(instance.id);
    setActionInProgress(null);
    // Refresh after a delay to get updated status
    setTimeout(fetchInstances, 2000);
  };

  const handleUnload = async (instance: LocalLLMInstance) => {
    setActionInProgress(instance.id);
    await unloadInstance(instance.id);
    setActionInProgress(null);
    // Refresh after a delay to get updated status
    setTimeout(fetchInstances, 2000);
  };

  const handleDelete = async () => {
    if (instanceToDelete) {
      await deleteInstance(instanceToDelete.id);
      setInstanceToDelete(null);
    }
  };

  const getStatusInfo = (status?: string) => {
    return statusLabels[status || 'pending'] || statusLabels.pending;
  };

  const columns: Column<LocalLLMInstance>[] = [
    {
      key: 'name',
      header: 'Instance Adi',
      render: (instance) => (
        <span className="font-medium">
          {instance.name || `Instance #${instance.id}`}
        </span>
      ),
    },
    {
      key: 'model',
      header: 'Model',
      render: (instance) => {
        const model = getModelById(instance.local_llm_id);
        return (
          <span className="text-gray-600">
            {model?.model_key || `Model #${instance.local_llm_id}`}
          </span>
        );
      },
    },
    {
      key: 'gpu_ids',
      header: "GPU'lar",
      render: (instance) => (
        <div className="flex flex-wrap gap-1">
          {instance.gpu_ids.map((gpuId) => (
            <span
              key={gpuId}
              className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium"
            >
              GPU {gpuId}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'tensor_parallel_size',
      header: 'Tensor Parallel',
      render: (instance) => instance.tensor_parallel_size,
    },
    {
      key: 'status',
      header: 'Durum',
      render: (instance) => {
        const statusInfo = getStatusInfo(instance.status);
        return (
          <span
            className={cn(
              'px-2 py-1 rounded text-xs font-medium',
              statusInfo.color
            )}
          >
            {statusInfo.label}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Islemler',
      className: 'text-right',
      render: (instance) => {
        const isLoaded = instance.status === 'loaded';
        const isActionable = !['loading', 'unloading'].includes(instance.status || '');
        const isCurrentAction = actionInProgress === instance.id;

        return (
          <div className="flex items-center justify-end gap-2">
            {isLoaded ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnload(instance);
                }}
                disabled={!isActionable || isCurrentAction}
                title="Kaldir"
              >
                {isCurrentAction ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoad(instance);
                }}
                disabled={!isActionable || isCurrentAction}
                title="Yukle"
              >
                {isCurrentAction ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setInstanceToDelete(instance);
              }}
              disabled={isLoaded || !isActionable}
              title={isLoaded ? 'Once kaldirin' : 'Sil'}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <Table
        columns={columns}
        data={instances}
        keyExtractor={(instance) => instance.id}
        isLoading={isLoadingInstances}
        emptyMessage="Henuz instance olusturulmamis"
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!instanceToDelete}
        onClose={() => setInstanceToDelete(null)}
        onConfirm={handleDelete}
        title="Instance Sil"
        message={`"${instanceToDelete?.name || `Instance #${instanceToDelete?.id}`}" instance'ini silmek istediginize emin misiniz?`}
        confirmText="Sil"
        isLoading={isSaving}
        variant="danger"
      />
    </div>
  );
}
