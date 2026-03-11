import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, UserPlus } from 'lucide-react';
import { Button } from '../../common/Button';
import { useGroupStore } from '../../../stores';
import type { GroupMember } from '../../../types/permission';
import { AddGroupMemberModal } from './AddGroupMemberModal';

interface GroupFormProps {
  groupId?: number;
  isNew?: boolean;
}

export function GroupForm({ groupId, isNew = false }: GroupFormProps) {
  const navigate = useNavigate();
  const {
    currentGroup,
    members,
    isLoading,
    isSaving,
    error,
    fetchGroup,
    fetchMembers,
    createGroup,
    updateGroup,
    addMember,
    removeMember,
    clearError,
  } = useGroupStore();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    external_id: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);

  useEffect(() => {
    if (!isNew && groupId) {
      fetchGroup(groupId);
      fetchMembers(groupId);
    }
  }, [groupId, isNew, fetchGroup, fetchMembers]);

  useEffect(() => {
    if (currentGroup && !isNew) {
      setFormData({
        name: currentGroup.name || '',
        description: currentGroup.description || '',
        external_id: currentGroup.external_id || '',
      });
    }
  }, [currentGroup, isNew]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Grup adı zorunludur';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    clearError();
    if (!validate()) return;

    if (isNew) {
      const group = await createGroup({
        name: formData.name,
        description: formData.description || undefined,
        external_id: formData.external_id || undefined,
      });
      if (group) {
        navigate(`/settings/groups/${group.id}`);
      }
    } else if (groupId) {
      const group = await updateGroup(groupId, {
        name: formData.name,
        description: formData.description || undefined,
        external_id: formData.external_id || undefined,
      });
      if (group) {
        navigate('/settings/groups');
      }
    }
  };

  const handleAddMember = async (userId: number) => {
    if (groupId) {
      await addMember(groupId, userId);
    }
  };

  const handleRemoveMember = async (member: GroupMember) => {
    if (groupId) {
      await removeMember(groupId, member.id);
    }
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
              onClick={() => navigate('/settings/groups')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isNew ? 'Yeni Grup Oluştur' : formData.name || 'Grup Düzenle'}
              </h1>
              {!isNew && currentGroup?.created_at && (
                <p className="text-sm text-gray-500">
                  Oluşturulma: {new Date(currentGroup.created_at).toLocaleDateString('tr-TR')}
                </p>
              )}
            </div>
          </div>
          <Button onClick={handleSave} isLoading={isSaving} disabled={isNew && !formData.name}>
            <Save className="h-4 w-4" />
            {isNew ? 'Oluştur' : 'Kaydet'}
          </Button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-6">
              {/* Grup Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grup Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    validationErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Grup adı"
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.name}</p>
                )}
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Grup açıklaması"
                  rows={3}
                />
              </div>

              {/* External ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  External ID
                </label>
                <input
                  type="text"
                  value={formData.external_id}
                  onChange={(e) => handleChange('external_id', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Harici sistem ID'si"
                />
              </div>
            </div>
          </div>

          {/* Üye Yönetimi - sadece düzenleme modunda */}
          {!isNew && groupId && (
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Üyeler ({members.length})
                </h2>
                <Button
                  variant="secondary"
                  onClick={() => setAddMemberModalOpen(true)}
                >
                  <UserPlus className="h-4 w-4" />
                  Üye Ekle
                </Button>
              </div>

              {members.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Bu grupta henüz üye bulunmuyor
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Kullanıcı Adı
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          E-posta
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Ad Soyad
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          İşlem
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {members.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {member.username}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {member.email}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {[member.name, member.surname].filter(Boolean).join(' ') || '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleRemoveMember(member)}
                              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              title="Üyeyi Çıkar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <AddGroupMemberModal
                isOpen={addMemberModalOpen}
                onClose={() => setAddMemberModalOpen(false)}
                onAdd={handleAddMember}
                existingMemberIds={members.map((m) => m.id)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GroupForm;
