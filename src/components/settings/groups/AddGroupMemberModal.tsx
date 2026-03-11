import { useState, useEffect, useMemo } from 'react';
import { Search, User as UserIcon } from 'lucide-react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { adminApi } from '../../../api/admin';
import type { User } from '../../../types';

interface AddGroupMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (userId: number) => Promise<void>;
  existingMemberIds: number[];
}

export function AddGroupMemberModal({
  isOpen,
  onClose,
  onAdd,
  existingMemberIds,
}: AddGroupMemberModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedId(null);
      setError(null);
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const usersData = await adminApi.getAllUsers();
      setUsers(usersData);
    } catch {
      setError('Kullanıcılar yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLocaleLowerCase('tr-TR');
    return users.filter(
      (user) =>
        !existingMemberIds.includes(user.id) &&
        (user.username.toLocaleLowerCase('tr-TR').includes(query) ||
          user.email?.toLocaleLowerCase('tr-TR').includes(query) ||
          user.name?.toLocaleLowerCase('tr-TR').includes(query) ||
          user.surname?.toLocaleLowerCase('tr-TR').includes(query))
    );
  }, [users, searchQuery, existingMemberIds]);

  const handleAdd = async () => {
    if (!selectedId) return;
    setIsSaving(true);
    setError(null);
    try {
      await onAdd(selectedId);
      onClose();
    } catch {
      setError('Üye eklenirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Üye Ekle"
      size="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Kullanıcı ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery
                ? 'Aramanızla eşleşen kullanıcı bulunamadı'
                : 'Eklenecek kullanıcı bulunamadı'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const isSelected = selectedId === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => setSelectedId(user.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-primary-50 border-l-4 border-primary' : ''
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.username}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {[user.email, [user.name, user.surname].filter(Boolean).join(' ')].filter(Boolean).join(' - ')}
                      </p>
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

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            İptal
          </Button>
          <Button onClick={handleAdd} disabled={!selectedId} isLoading={isSaving}>
            Ekle
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default AddGroupMemberModal;
