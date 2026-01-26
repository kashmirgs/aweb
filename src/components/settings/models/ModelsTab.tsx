import { useState } from 'react';
import { Download, Upload, Trash2, Loader2 } from 'lucide-react';
import { useLocalLlmStore } from '../../../stores/localLlmStore';
import { LoadModelModal } from './LoadModelModal';
import { Button } from '../../common/Button';
import { Table, type Column } from '../../common/Table';
import { ConfirmModal } from '../../common/Modal';
import type { LocalLLM } from '../../../types/localLlm';

function formatSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

export function ModelsTab() {
  const {
    models,
    isLoadingModels,
    isSaving,
    error,
    deleteModel,
    downloadModel,
    getInstancesByModelId,
  } = useLocalLlmStore();

  const [selectedModel, setSelectedModel] = useState<LocalLLM | null>(null);
  const [modelToDelete, setModelToDelete] = useState<LocalLLM | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDownload = async (model: LocalLLM) => {
    setDownloadingId(model.id);
    await downloadModel(model.id);
    setDownloadingId(null);
  };

  const handleDelete = async () => {
    if (modelToDelete) {
      await deleteModel(modelToDelete.id);
      setModelToDelete(null);
    }
  };

  const getInstanceCount = (modelId: number) => {
    return getInstancesByModelId(modelId).length;
  };

  const columns: Column<LocalLLM>[] = [
    {
      key: 'model_key',
      header: 'Model Key',
      render: (model) => <span className="font-medium">{model.model_key}</span>,
    },
    {
      key: 'hf_name',
      header: 'HuggingFace Model',
      render: (model) => (
        <span className="text-gray-600 truncate max-w-xs block" title={model.hf_name}>
          {model.hf_name}
        </span>
      ),
    },
    {
      key: 'model_size',
      header: 'Boyut',
      render: (model) => formatSize(model.model_size),
    },
    {
      key: 'max_model_len',
      header: 'Max Context',
      render: (model) => model.max_model_len.toLocaleString(),
    },
    {
      key: 'prompt_format',
      header: 'Format',
      render: (model) => (
        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
          {model.prompt_format}
        </span>
      ),
    },
    {
      key: 'instances',
      header: 'Instance',
      render: (model) => (
        <span className="text-gray-600">{getInstanceCount(model.id)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Islemler',
      className: 'text-right',
      render: (model) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedModel(model);
            }}
            title="Yukle"
          >
            <Upload className="h-4 w-4" />
          </Button>
          {!model.downloaded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(model);
              }}
              disabled={downloadingId === model.id}
              title="Indir"
            >
              {downloadingId === model.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setModelToDelete(model);
            }}
            disabled={getInstanceCount(model.id) > 0}
            title={getInstanceCount(model.id) > 0 ? 'Aktif instance var' : 'Sil'}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
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
        data={models}
        keyExtractor={(model) => model.id}
        isLoading={isLoadingModels}
        emptyMessage="Henuz model tanimlanmamis"
      />

      {/* Load Model Modal */}
      {selectedModel && (
        <LoadModelModal
          model={selectedModel}
          onClose={() => setSelectedModel(null)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!modelToDelete}
        onClose={() => setModelToDelete(null)}
        onConfirm={handleDelete}
        title="Modeli Sil"
        message={`"${modelToDelete?.model_key}" modelini silmek istediginize emin misiniz? Bu islem geri alinamaz.`}
        confirmText="Sil"
        isLoading={isSaving}
        variant="danger"
      />
    </div>
  );
}
