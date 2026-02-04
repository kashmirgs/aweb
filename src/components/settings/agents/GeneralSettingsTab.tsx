import { useRef, useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { Toggle } from '../../common/Toggle';
import { Button } from '../../common/Button';
import type { Agent, LLMModel } from '../../../types';
import type { LocalLLMInstance } from '../../../types/localLlm';
import apiClient from '../../../api/client';

interface GeneralSettingsTabProps {
  agent: Partial<Agent>;
  onChange: (updates: Partial<Agent>) => void;
  llmModels: LLMModel[];
  llmInstances?: LocalLLMInstance[];
  imageVersion?: number;
}

export function GeneralSettingsTab({
  agent,
  onChange,
  llmModels: _llmModels,
  llmInstances = [],
  imageVersion = 0,
}: GeneralSettingsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const imageSrcRef = useRef<string | null>(null);

  // Fetch agent image through apiClient (with auth headers)
  useEffect(() => {
    let isMounted = true;

    // Eski blob URL'i temizle
    if (imageSrcRef.current) {
      URL.revokeObjectURL(imageSrcRef.current);
      imageSrcRef.current = null;
    }
    // Yeni görsel fetch edilirken eski görseli gösterme
    setImageSrc(null);

    const fetchImage = async () => {
      if (!agent.id) {
        return;
      }

      try {
        const response = await apiClient.get(`/chatbot/${agent.id}/image`, {
          responseType: 'blob',
        });
        if (isMounted && response.data && response.data.size > 0) {
          const blobUrl = URL.createObjectURL(response.data);
          imageSrcRef.current = blobUrl;
          setImageSrc(blobUrl);
        }
      } catch {
        // Görsel yoksa sessizce devam et
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [agent.id, agent.modified_at, imageVersion]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange({ _imageFile: file } as unknown as Partial<Agent>);
    }
  };

  return (
    <div className="space-y-6">
      {/* Agent Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ajan Adı <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={agent.name || ''}
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Ajan adını girin"
        />
      </div>

      {/* System Prompt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sistem Yönergesi
        </label>
        <textarea
          value={agent.system_prompt || ''}
          onChange={(e) => onChange({ system_prompt: e.target.value })}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          placeholder="Sistem yönergesini girin..."
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Açıklama
        </label>
        <textarea
          value={agent.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          placeholder="Ajan açıklamasını girin..."
        />
      </div>

      {/* LLM Instance */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Yerel LLM Modeli
        </label>
        <select
          value={agent.local_llm_instance_id || ''}
          onChange={(e) =>
            onChange({
              local_llm_instance_id: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
        >
          <option value="">Model seçin</option>
          {llmInstances.map((instance) => (
            <option key={instance.id} value={instance.id}>
              {instance.name || instance.local_llm?.hf_name || `Instance #${instance.id}`}
            </option>
          ))}
        </select>
      </div>

      {/* Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Görsel
        </label>
        <div className="flex items-start gap-4">
          {(imageSrc || (agent as unknown as { _imageFile?: File })._imageFile) && (
            <div className="relative">
              <img
                src={
                  (agent as unknown as { _imageFile?: File })._imageFile
                    ? URL.createObjectURL((agent as unknown as { _imageFile?: File })._imageFile!)
                    : imageSrc!
                }
                alt={agent.name || 'Agent'}
                className="w-20 h-20 rounded-lg object-cover border border-gray-200"
              />
              <button
                type="button"
                onClick={() => onChange({ _imageFile: undefined } as unknown as Partial<Agent>)}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Görsel Yükle
            </Button>
            <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF (max 2MB)</p>
          </div>
        </div>
      </div>

      {/* Warning Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Uyarı Mesajı
        </label>
        <input
          type="text"
          value={agent.warning_message || ''}
          onChange={(e) => onChange({ warning_message: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Kullanıcılara gösterilecek uyarı mesajı"
        />
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-8">
        <Toggle
          checked={agent.interactive ?? true}
          onChange={(checked) => onChange({ interactive: checked })}
          label="İnteraktif mi"
        />
        <Toggle
          checked={agent.active ?? true}
          onChange={(checked) => onChange({ active: checked })}
          label="Aktif"
        />
      </div>
    </div>
  );
}

export default GeneralSettingsTab;
