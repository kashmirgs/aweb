import { useState, useEffect } from 'react';
import { Loader2, Cpu } from 'lucide-react';
import { useLocalLlmStore } from '../../../stores/localLlmStore';
import { localLlmApi } from '../../../api/localLlm';
import { Button } from '../../common/Button';
import { Modal } from '../../common/Modal';
import { cn } from '../../../lib/utils';
import type { LocalLLM } from '../../../types/localLlm';

interface LoadModelModalProps {
  model: LocalLLM;
  onClose: () => void;
}

export function LoadModelModal({ model, onClose }: LoadModelModalProps) {
  const { gpus, fetchGPUs, createInstance, loadInstance, isSaving, error, clearError } = useLocalLlmStore();

  const [name, setName] = useState(`${model.model_key}-instance`);
  const [selectedGPUs, setSelectedGPUs] = useState<number[]>([]);
  const [tensorParallelSize, setTensorParallelSize] = useState(1);
  const [maxModelLenOverride, setMaxModelLenOverride] = useState<number | undefined>(undefined);
  const [suggestedGPUs, setSuggestedGPUs] = useState<number[]>([]);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  useEffect(() => {
    clearError();
    fetchGPUs();
    loadSuggestion();
  }, [fetchGPUs, clearError]);

  const loadSuggestion = async () => {
    setIsLoadingSuggestion(true);
    try {
      const response = await localLlmApi.suggestGPU({
        model_size: model.model_size,
        tensor_parallel_size: tensorParallelSize,
      });
      setSuggestedGPUs(response.suggested_gpu_ids);
      if (response.suggested_gpu_ids.length > 0 && selectedGPUs.length === 0) {
        setSelectedGPUs(response.suggested_gpu_ids);
        setTensorParallelSize(response.suggested_gpu_ids.length);
      }
    } catch {
      // Ignore suggestion errors
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleGPUToggle = (gpuId: number) => {
    setSelectedGPUs((prev) => {
      if (prev.includes(gpuId)) {
        return prev.filter((id) => id !== gpuId);
      }
      return [...prev, gpuId];
    });
  };

  const handleSubmit = async () => {
    if (selectedGPUs.length === 0) return;

    const instance = await createInstance({
      local_llm_id: model.id,
      gpu_ids: selectedGPUs,
      name: name || undefined,
      tensor_parallel_size: tensorParallelSize,
      max_model_len_override: maxModelLenOverride,
    });

    if (instance) {
      // Automatically load the instance
      await loadInstance(instance.id);
      onClose();
    }
  };

  const formatMemory = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Model Yukle - ${model.model_key}`} size="lg">
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        {/* Instance Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instance Adi
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="ornek: llama3-instance"
          />
        </div>

        {/* GPU Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              GPU Secimi
            </label>
            {isLoadingSuggestion && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Oneri yukleniyor...
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {gpus.map((gpu) => {
              const isSelected = selectedGPUs.includes(gpu.id);
              const isSuggested = suggestedGPUs.includes(gpu.id);
              const memoryUsedPercent = (gpu.memory_used / gpu.memory_total) * 100;

              return (
                <button
                  key={gpu.id}
                  type="button"
                  onClick={() => handleGPUToggle(gpu.id)}
                  className={cn(
                    'p-3 border rounded-lg text-left transition-all',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : isSuggested
                      ? 'border-green-300 bg-green-50 hover:border-green-400'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className={cn('h-4 w-4', isSelected ? 'text-primary' : 'text-gray-400')} />
                    <span className="font-medium text-sm">{gpu.name}</span>
                    {isSuggested && (
                      <span className="ml-auto text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                        Onerilen
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Bellek</span>
                      <span>{formatMemory(gpu.memory_free)} bos</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          memoryUsedPercent > 80 ? 'bg-red-500' : memoryUsedPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
                        )}
                        style={{ width: `${memoryUsedPercent}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedGPUs.length > 0 && (
            <p className="mt-2 text-sm text-gray-500">
              {selectedGPUs.length} GPU secildi
            </p>
          )}
        </div>

        {/* Tensor Parallel Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tensor Parallel Size
          </label>
          <select
            value={tensorParallelSize}
            onChange={(e) => setTensorParallelSize(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {[1, 2, 4, 8].map((size) => (
              <option key={size} value={size}>
                {size} GPU
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Model kac GPU&apos;ya dagitilacak. Genellikle secilen GPU sayisi ile esit olmali.
          </p>
        </div>

        {/* Max Model Length Override */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Context Length (Opsiyonel)
          </label>
          <input
            type="number"
            value={maxModelLenOverride ?? ''}
            onChange={(e) => setMaxModelLenOverride(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder={`Varsayilan: ${model.max_model_len.toLocaleString()}`}
          />
          <p className="mt-1 text-xs text-gray-500">
            Bellek tasarrufu icin daha dusuk bir deger girebilirsiniz.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose}>
            Iptal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedGPUs.length === 0 || isSaving}
            isLoading={isSaving}
          >
            Yukle
          </Button>
        </div>
      </div>
    </Modal>
  );
}
