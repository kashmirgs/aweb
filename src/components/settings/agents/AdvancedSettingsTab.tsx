import { useState } from 'react';
import type { Agent } from '../../../types';
import { Button } from '../../common/Button';
import { useAgentStore } from '../../../stores/agentStore';

interface AdvancedSettingsTabProps {
  agent: Partial<Agent>;
  onChange: (updates: Partial<Agent>) => void;
}

interface NumberFieldProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  helpText?: string;
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  helpText,
}: NumberFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : undefined)
        }
        min={min}
        max={max}
        step={step}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        placeholder={placeholder}
      />
      {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
    </div>
  );
}

export function AdvancedSettingsTab({
  agent,
  onChange,
}: AdvancedSettingsTabProps) {
  const [isIndexing, setIsIndexing] = useState(false);
  const { buildIndex } = useAgentStore();
  const indexSettings = agent.index_settings ?? {};

  const handleReindex = async () => {
    if (!agent.id) return;
    setIsIndexing(true);
    try {
      await buildIndex(agent.id);
    } finally {
      setIsIndexing(false);
    }
  };

  const handleIndexChange = (field: string, value: number | undefined) => {
    onChange({
      index_settings: {
        ...indexSettings,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NumberField
          label="Sohbet Geçmişi Boyutu"
          value={agent.chat_history_size}
          onChange={(value) => onChange({ chat_history_size: value })}
          min={0}
          max={100}
          placeholder="10"
          helpText="Sohbette saklanacak maksimum mesaj sayısı"
        />

        <NumberField
          label="Dizin Arama Boyutu"
          value={agent.index_search_size}
          onChange={(value) => onChange({ index_search_size: value })}
          min={1}
          max={100}
          placeholder="5"
          helpText="Arama sonuçlarında döndürülecek maksimum belge sayısı"
        />

        <NumberField
          label="İndeks Sonuç Mesafesi"
          value={agent.index_result_distance}
          onChange={(value) => onChange({ index_result_distance: value })}
          min={0}
          max={2}
          step={0.1}
          placeholder="0.5"
          helpText="Arama sonuçları için maksimum mesafe eşiği"
        />

        <NumberField
          label="Chunk Boyutu"
          value={indexSettings.chunk_size}
          onChange={(value) => handleIndexChange('chunk_size', value)}
          min={100}
          max={10000}
          step={100}
          placeholder="1000"
          helpText="Belge parçalama için karakter sayısı"
        />

        <NumberField
          label="Chunk Overlap"
          value={indexSettings.chunk_overlap}
          onChange={(value) => handleIndexChange('chunk_overlap', value)}
          min={0}
          max={1000}
          step={50}
          placeholder="200"
          helpText="Parçalar arası örtüşme karakter sayısı"
        />
      </div>

      {/* Re-index button */}
      {agent.id && (
        <div className="pt-4 border-t">
          <Button
            onClick={handleReindex}
            isLoading={isIndexing}
            disabled={isIndexing}
            variant="secondary"
          >
            {isIndexing ? 'İndeksleniyor...' : 'Tekrar İndeksle'}
          </Button>
          <p className="text-xs text-gray-500 mt-1">
            Dokümanları yeniden indeksler
          </p>
        </div>
      )}
    </div>
  );
}

export default AdvancedSettingsTab;
