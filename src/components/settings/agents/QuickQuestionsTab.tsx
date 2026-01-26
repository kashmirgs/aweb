import { useState } from 'react';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { Button } from '../../common/Button';
import { Modal, ConfirmModal } from '../../common/Modal';
import type { ConversationStarter } from '../../../types';

interface QuickQuestionsTabProps {
  starters: ConversationStarter[];
  isLoading: boolean;
  onCreate: (data: { title?: string; prompt: string }) => Promise<void>;
  onUpdate: (starterId: number, data: { title?: string; prompt: string }) => Promise<void>;
  onDelete: (starterId: number) => Promise<void>;
}

interface StarterFormData {
  title: string;
  prompt: string;
}

export function QuickQuestionsTab({
  starters,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
}: QuickQuestionsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStarter, setEditingStarter] = useState<ConversationStarter | null>(null);
  const [formData, setFormData] = useState<StarterFormData>({ title: '', prompt: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [starterToDelete, setStarterToDelete] = useState<ConversationStarter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenModal = (starter?: ConversationStarter) => {
    if (starter) {
      setEditingStarter(starter);
      setFormData({ title: starter.title || '', prompt: starter.prompt });
    } else {
      setEditingStarter(null);
      setFormData({ title: '', prompt: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStarter(null);
    setFormData({ title: '', prompt: '' });
  };

  const handleSave = async () => {
    if (!formData.prompt.trim()) return;

    setIsSaving(true);
    try {
      if (editingStarter) {
        await onUpdate(editingStarter.id, {
          title: formData.title || undefined,
          prompt: formData.prompt,
        });
      } else {
        await onCreate({
          title: formData.title || undefined,
          prompt: formData.prompt,
        });
      }
      handleCloseModal();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (starterToDelete) {
      setIsDeleting(true);
      try {
        await onDelete(starterToDelete.id);
        setDeleteModalOpen(false);
        setStarterToDelete(null);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Hızlı Sorular</h3>
        <Button size="sm" onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4" />
          Yeni Soru Ekle
        </Button>
      </div>

      {starters.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">Henüz hızlı soru eklenmedi</p>
          <p className="text-sm text-gray-400 mt-1">
            Kullanıcıların sohbete başlamasını kolaylaştırmak için hazır sorular ekleyin
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
          {starters.map((starter) => (
            <div
              key={starter.id}
              className="flex items-center gap-3 p-4 hover:bg-gray-50"
            >
              <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
              <div className="flex-1 min-w-0">
                {starter.title && (
                  <p className="font-medium text-gray-900 truncate">{starter.title}</p>
                )}
                <p className="text-sm text-gray-600 truncate">{starter.prompt}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenModal(starter)}
                  className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
                  title="Düzenle"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setStarterToDelete(starter);
                    setDeleteModalOpen(true);
                  }}
                  className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title="Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingStarter ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Başlık (Opsiyonel)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Örn: Ürün Bilgisi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Soru <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Kullanıcının göreceği soru metni"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={handleCloseModal} disabled={isSaving}>
              İptal
            </Button>
            <Button
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!formData.prompt.trim()}
            >
              {editingStarter ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setStarterToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Soruyu Sil"
        message={`"${starterToDelete?.prompt}" sorusunu silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default QuickQuestionsTab;
