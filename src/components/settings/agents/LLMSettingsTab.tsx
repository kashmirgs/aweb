import type { Agent } from '../../../types';

interface LLMSettingsTabProps {
  agent: Partial<Agent>;
  onChange: (updates: Partial<Agent>) => void;
}

interface SliderFieldProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  helpText?: string;
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  defaultValue,
  helpText,
}: SliderFieldProps) {
  const currentValue = value ?? defaultValue;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm text-gray-500">{currentValue}</span>
      </div>
      <input
        type="range"
        value={currentValue}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {helpText && <p className="mt-2 text-xs text-gray-500">{helpText}</p>}
    </div>
  );
}

export function LLMSettingsTab({ agent, onChange }: LLMSettingsTabProps) {
  const llmSettings = agent.llm_settings ?? {};

  const handleLLMChange = (field: string, value: number | undefined) => {
    onChange({
      llm_settings: {
        ...llmSettings,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-8">
      <SliderField
        label="Sıcaklık"
        value={llmSettings.temperature}
        onChange={(value) => handleLLMChange('temperature', value)}
        min={0}
        max={2}
        step={0.1}
        defaultValue={0.7}
        helpText="Yanıtların ne kadar yaratıcı olacağını kontrol eder. Düşük değerler daha tutarlı, yüksek değerler daha yaratıcı yanıtlar üretir."
      />

      <SliderField
        label="Top-P"
        value={llmSettings.top_p}
        onChange={(value) => handleLLMChange('top_p', value)}
        min={0}
        max={1}
        step={0.05}
        defaultValue={1}
        helpText="Çekirdek örnekleme parametresi. Daha düşük değerler daha odaklı yanıtlar üretir."
      />

      <SliderField
        label="Bulunma Cezası"
        value={llmSettings.presence_penalty}
        onChange={(value) => handleLLMChange('presence_penalty', value)}
        min={-2}
        max={2}
        step={0.1}
        defaultValue={0}
        helpText="Yeni konulara geçmeyi teşvik eder. Pozitif değerler tekrarı azaltır."
      />

      <SliderField
        label="Tekrar Cezası"
        value={llmSettings.frequency_penalty}
        onChange={(value) => handleLLMChange('frequency_penalty', value)}
        min={-2}
        max={2}
        step={0.1}
        defaultValue={0}
        helpText="Sık kullanılan kelimelerin tekrarını azaltır."
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Maksimum Token
        </label>
        <input
          type="number"
          value={llmSettings.max_token ?? ''}
          onChange={(e) =>
            handleLLMChange(
              'max_token',
              e.target.value ? Number(e.target.value) : undefined
            )
          }
          min={1}
          max={128000}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="4096"
        />
        <p className="mt-1 text-xs text-gray-500">
          Yanıtta kullanılacak maksimum token sayısı
        </p>
      </div>
    </div>
  );
}

export default LLMSettingsTab;
