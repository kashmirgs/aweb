import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileText, Settings, MessageSquare, Bot, Sliders, Shield } from 'lucide-react';
import { Button } from '../../common/Button';
import { Tabs } from '../../common/Tabs';
import type { Tab } from '../../common/Tabs';
import { GeneralSettingsTab } from './GeneralSettingsTab';
import { AdvancedSettingsTab } from './AdvancedSettingsTab';
import { LLMSettingsTab } from './LLMSettingsTab';
import { FilesTab } from './FilesTab';
import { QuickQuestionsTab } from './QuickQuestionsTab';
import { AuthorizationTab } from './AuthorizationTab';
import { useAgentStore, usePermissionStore } from '../../../stores';
import type { Agent, AgentCreateRequest, AgentUpdateRequest } from '../../../types';

interface AgentFormProps {
  agentId?: number;
  isNew?: boolean;
}

type SidebarTab = 'files' | 'settings' | 'quick-questions' | 'authorization';
type SettingsSubTab = 'general' | 'advanced' | 'llm';

const baseSidebarTabs: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
  { id: 'files', label: 'Dosyalar', icon: <FileText className="h-5 w-5" /> },
  { id: 'settings', label: 'Ayarlar', icon: <Settings className="h-5 w-5" /> },
  { id: 'quick-questions', label: 'Hızlı Sorular', icon: <MessageSquare className="h-5 w-5" /> },
];

const authorizationTab = { id: 'authorization' as SidebarTab, label: 'Yetkilendirme', icon: <Shield className="h-5 w-5" /> };

const settingsSubTabs: Tab[] = [
  { id: 'general', label: 'Genel', icon: <Bot className="h-4 w-4" /> },
  { id: 'advanced', label: 'Gelişmiş', icon: <Settings className="h-4 w-4" /> },
  { id: 'llm', label: 'LLM Ayarları', icon: <Sliders className="h-4 w-4" /> },
];

export function AgentForm({ agentId, isNew = false }: AgentFormProps) {
  const navigate = useNavigate();
  const {
    currentAgent,
    starters,
    files,
    isLoading,
    isSaving,
    error,
    fetchAgent,
    createAgent,
    updateAgent,
    uploadImage,
    fetchStarters,
    createStarter,
    updateStarter,
    deleteStarter,
    fetchFiles,
    uploadFile,
    deleteFile,
    buildIndex,
    clearError,
  } = useAgentStore();
  const { llmModels, llmInstances, fetchLLMModels, fetchLLMInstances, canEdit } = usePermissionStore();

  const hasEditPermission = agentId ? canEdit(agentId) : false;
  const sidebarTabs = hasEditPermission
    ? [...baseSidebarTabs, authorizationTab]
    : baseSidebarTabs;

  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('settings');
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsSubTab>('general');
  const [formData, setFormData] = useState<Partial<Agent>>({
    name: '',
    system_prompt: '',
    description: '',
    interactive: true,
    active: true,
  });
  const [, setHasChanges] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);

  useEffect(() => {
    fetchLLMModels();
    fetchLLMInstances();

    if (!isNew && agentId) {
      fetchAgent(agentId);
      fetchStarters(agentId);
      fetchFiles(agentId);
    }
  }, [agentId, isNew, fetchAgent, fetchStarters, fetchFiles, fetchLLMModels, fetchLLMInstances]);

  useEffect(() => {
    if (currentAgent && !isNew) {
      setFormData(currentAgent);
    }
  }, [currentAgent, isNew]);

  const handleChange = (updates: Partial<Agent>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    clearError();

    const imageFile = (formData as unknown as { _imageFile?: File })._imageFile;
    const dataToSave = { ...formData };
    delete (dataToSave as unknown as { _imageFile?: File })._imageFile;

    if (isNew) {
      const agent = await createAgent(dataToSave as AgentCreateRequest);
      if (agent) {
        if (imageFile) {
          await uploadImage(agent.id, imageFile);
        }
        navigate(`/settings/agents/${agent.id}`);
      }
    } else if (agentId) {
      const agent = await updateAgent(agentId, dataToSave as AgentUpdateRequest);
      if (agent && imageFile) {
        await uploadImage(agent.id, imageFile);
        // Force image refresh by incrementing version
        setImageVersion(v => v + 1);
        // Store'dan güncel agent'ı al ve formData'yı güncelle (görsel URL'ini yenilemek için)
        const updatedAgent = useAgentStore.getState().currentAgent;
        if (updatedAgent) {
          // _imageFile'ı temizleyerek yeni yüklenen görselin fetch edilmesini sağla
          setFormData({ ...updatedAgent });
        }
      }
      if (agent) {
        setHasChanges(false);
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    if (agentId) {
      await uploadFile(agentId, file);
    }
  };

  const handleFileDelete = async (fileId: number) => {
    if (agentId) {
      await deleteFile(agentId, fileId);
    }
  };

  const handleUploadComplete = async () => {
    if (agentId) {
      await buildIndex(agentId);
    }
  };

  const handleStarterCreate = async (data: { title?: string; prompt: string }) => {
    if (agentId) {
      await createStarter(agentId, data);
    }
  };

  const handleStarterUpdate = async (starterId: number, data: { title?: string; prompt: string }) => {
    await updateStarter(starterId, data);
  };

  const handleStarterDelete = async (starterId: number) => {
    await deleteStarter(starterId);
  };

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/settings/agents')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isNew ? 'Yeni Ajan Oluştur' : formData.name || 'Ajan Düzenle'}
              </h1>
              {!isNew && currentAgent?.created_at && (
                <p className="text-sm text-gray-500">
                  Oluşturulma: {new Date(currentAgent.created_at).toLocaleDateString('tr-TR')}
                </p>
              )}
            </div>
          </div>
          {(isNew || activeSidebarTab === 'settings') && (
            <Button onClick={handleSave} isLoading={isSaving} disabled={isNew && !formData.name}>
              <Save className="h-4 w-4" />
              {isNew ? 'Oluştur' : 'Kaydet'}
            </Button>
          )}
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {!isNew && (
          <div className="w-56 bg-white border-r border-gray-200 p-4">
            <nav className="space-y-1">
              {sidebarTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSidebarTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSidebarTab === tab.id
                      ? 'bg-primary-50 text-primary'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            {(isNew || activeSidebarTab === 'settings') && (
              <div className="bg-white rounded-lg shadow p-6">
                <Tabs
                  tabs={settingsSubTabs}
                  activeTab={activeSettingsTab}
                  onChange={(id) => setActiveSettingsTab(id as SettingsSubTab)}
                  variant="pills"
                  className="mb-6"
                />

                {activeSettingsTab === 'general' && (
                  <GeneralSettingsTab
                    agent={formData}
                    onChange={handleChange}
                    llmModels={llmModels}
                    llmInstances={llmInstances}
                    imageVersion={imageVersion}
                  />
                )}
                {activeSettingsTab === 'advanced' && (
                  <AdvancedSettingsTab agent={formData} onChange={handleChange} />
                )}
                {activeSettingsTab === 'llm' && (
                  <LLMSettingsTab agent={formData} onChange={handleChange} />
                )}
              </div>
            )}

            {!isNew && activeSidebarTab === 'files' && (
              <div className="bg-white rounded-lg shadow p-6">
                <FilesTab
                  files={files}
                  isLoading={false}
                  onUpload={handleFileUpload}
                  onDelete={handleFileDelete}
                  onUploadComplete={handleUploadComplete}
                />
              </div>
            )}

            {!isNew && activeSidebarTab === 'quick-questions' && (
              <div className="bg-white rounded-lg shadow p-6">
                <QuickQuestionsTab
                  starters={starters}
                  isLoading={false}
                  onCreate={handleStarterCreate}
                  onUpdate={handleStarterUpdate}
                  onDelete={handleStarterDelete}
                />
              </div>
            )}

            {!isNew && activeSidebarTab === 'authorization' && agentId && hasEditPermission && (
              <div className="bg-white rounded-lg shadow p-6">
                <AuthorizationTab agentId={agentId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentForm;
