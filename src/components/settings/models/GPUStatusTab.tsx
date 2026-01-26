import { useEffect } from 'react';
import { Cpu, Thermometer, Activity, HardDrive, Loader2 } from 'lucide-react';
import { useLocalLlmStore } from '../../../stores/localLlmStore';
import { cn } from '../../../lib/utils';

function formatMemory(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} GB`;
}

export function GPUStatusTab() {
  const {
    gpusWithInstances,
    gpuMetrics,
    isLoadingGPUs,
    fetchGPUsWithInstances,
    getModelById,
  } = useLocalLlmStore();

  useEffect(() => {
    fetchGPUsWithInstances();
  }, [fetchGPUsWithInstances]);

  const getMetricsForGPU = (gpuId: number) => {
    return gpuMetrics.find((m) => m.gpu_id === gpuId);
  };

  if (isLoadingGPUs) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (gpusWithInstances.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        GPU bulunamadi
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gpusWithInstances.map((gpu) => {
          const metrics = getMetricsForGPU(gpu.id);
          const memoryUsed = metrics?.memory_used ?? gpu.memory_used;
          const memoryTotal = metrics?.memory_total ?? gpu.memory_total;
          const utilization = metrics?.utilization ?? gpu.utilization ?? 0;
          const temperature = metrics?.temperature;
          const memoryPercent = (memoryUsed / memoryTotal) * 100;

          return (
            <div
              key={gpu.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Cpu className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{gpu.name}</h3>
                  <p className="text-sm text-gray-500">GPU {gpu.id}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-4">
                {/* Memory Usage */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <HardDrive className="h-4 w-4" />
                      Bellek Kullanimi
                    </span>
                    <span className="text-sm font-medium">
                      {formatMemory(memoryUsed)} / {formatMemory(memoryTotal)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        memoryPercent > 90
                          ? 'bg-red-500'
                          : memoryPercent > 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      )}
                      style={{ width: `${memoryPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {memoryPercent.toFixed(1)}% kullaniliyor
                  </p>
                </div>

                {/* GPU Utilization */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Activity className="h-4 w-4" />
                      GPU Kullanimi
                    </span>
                    <span className="text-sm font-medium">{utilization}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        utilization > 90
                          ? 'bg-red-500'
                          : utilization > 70
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      )}
                      style={{ width: `${utilization}%` }}
                    />
                  </div>
                </div>

                {/* Temperature */}
                {temperature !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Thermometer className="h-4 w-4" />
                      Sicaklik
                    </span>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        temperature > 80
                          ? 'text-red-600'
                          : temperature > 65
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      )}
                    >
                      {temperature}°C
                    </span>
                  </div>
                )}
              </div>

              {/* Loaded Instances */}
              {gpu.instances && gpu.instances.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Yuklu Instance&apos;lar
                  </h4>
                  <div className="space-y-2">
                    {gpu.instances.map((instance) => {
                      const model = getModelById(instance.local_llm_id);
                      return (
                        <div
                          key={instance.id}
                          className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1"
                        >
                          <span className="text-gray-700">
                            {instance.name || `Instance #${instance.id}`}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {model?.model_key || `Model #${instance.local_llm_id}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No instances */}
              {(!gpu.instances || gpu.instances.length === 0) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-400 text-center">
                    Yuklu instance yok
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
