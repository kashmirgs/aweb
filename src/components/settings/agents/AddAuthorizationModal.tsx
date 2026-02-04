import { useState, useEffect, useMemo } from 'react';
import { Search, User as UserIcon, UsersRound, Shield } from 'lucide-react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { adminApi } from '../../../api/admin';
import { permissionsApi } from '../../../api/permissions';
import type { User } from '../../../types';
import type { Group, Scope } from '../../../types/permission';

interface AddAuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  agentId: number;
  type: 'user' | 'group';
  existingUserIds: number[];
  existingGroupIds: number[];
}

export function AddAuthorizationModal({
  isOpen,
  onClose,
  onSuccess,
  agentId,
  type,
  existingUserIds,
  existingGroupIds,
}: AddAuthorizationModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedScopeId, setSelectedScopeId] = useState<number>(3);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedId(null);
      setSelectedScopeId(1);
      setError(null);
      fetchData();
    }
  }, [isOpen, type]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [scopesData] = await Promise.all([
        adminApi.getAllScopes(),
      ]);
      setScopes(scopesData);

      if (type === 'user') {
        const usersData = await adminApi.getAllUsers();
        setUsers(usersData);
      } else {
        const groupsData = await adminApi.getAllGroups();
        setGroups(groupsData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Veriler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (type === 'user') {
      return users.filter(
        (user) =>
          !existingUserIds.includes(user.id) &&
          (user.username.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.name?.toLowerCase().includes(query))
      );
    } else {
      return groups.filter(
        (group) =>
          !existingGroupIds.includes(group.id) &&
          group.name.toLowerCase().includes(query)
      );
    }
  }, [type, users, groups, searchQuery, existingUserIds, existingGroupIds]);

  const handleSave = async () => {
    if (!selectedId) return;

    setIsSaving(true);
    setError(null);
    try {
      if (type === 'user') {
        await permissionsApi.grantPermission(selectedId, agentId, selectedScopeId);
      } else {
        await permissionsApi.grantGroupPermission(selectedId, agentId, selectedScopeId);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save authorization:', error);
      setError('Yetkilendirme kaydedilirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const getScopeName = (scopeId: number): string => {
    const scope = scopes.find((s) => s.id === scopeId);
    if (scope) return scope.name;
    return scopeId === 3 ? 'Kullanıcı' : scopeId === 2 ? 'Ajan Admin' : `Scope ${scopeId}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'user' ? 'Kullanıcı Ekle' : 'Grup Ekle'}
      size="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={type === 'user' ? 'Kullanıcı ara...' : 'Grup ara...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* List */}
        <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery
                ? 'Aramanızla eşleşen sonuç bulunamadı'
                : type === 'user'
                ? 'Eklenecek kullanıcı bulunamadı'
                : 'Eklenecek grup bulunamadı'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(filteredItems as (User | Group)[]).map((item) => {
                const isUser = 'username' in item;
                const itemId = item.id;
                const isSelected = selectedId === itemId;

                return (
                  <button
                    key={itemId}
                    onClick={() => setSelectedId(itemId)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-primary-50 border-l-4 border-primary' : ''
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        isUser ? 'bg-primary-100' : 'bg-green-100'
                      }`}
                    >
                      {isUser ? (
                        <UserIcon className="h-5 w-5 text-primary" />
                      ) : (
                        <UsersRound className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {isUser ? (item as User).username : (item as Group).name}
                      </p>
                      {isUser && (item as User).email && (
                        <p className="text-xs text-gray-500 truncate">
                          {(item as User).email}
                        </p>
                      )}
                      {!isUser && (item as Group).description && (
                        <p className="text-xs text-gray-500 truncate">
                          {(item as Group).description}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Scope Selection (only for users) */}
        {type === 'user' && selectedId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol Seçin
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedScopeId(3)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  selectedScopeId === 3
                    ? 'border-primary bg-primary-50 text-primary'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <UserIcon className="h-4 w-4" />
                <span className="font-medium">Kullanıcı</span>
              </button>
              <button
                onClick={() => setSelectedScopeId(2)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  selectedScopeId === 2
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Shield className="h-4 w-4" />
                <span className="font-medium">Ajan Admin</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedScopeId === 3
                ? 'Kullanıcı, bu ajanı sadece görüntüleyebilir ve kullanabilir.'
                : 'Ajan Admin, bu ajanın ayarlarını düzenleyebilir ve yetkilendirmelerini yönetebilir.'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={!selectedId} isLoading={isSaving}>
            Ekle
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default AddAuthorizationModal;
