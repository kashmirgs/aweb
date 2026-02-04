import { useState, useEffect } from 'react';
import { Users, UsersRound, Plus, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { Button } from '../../common/Button';
import { ConfirmModal } from '../../common/Modal';
import { AddAuthorizationModal } from './AddAuthorizationModal';
import { permissionsApi } from '../../../api/permissions';
import type { UserAuthorization, GroupAuthorization } from '../../../types/permission';

interface AuthorizationTabProps {
  agentId: number;
}

// Helper function to check if user has agent_admin scope
const isAgentAdmin = (auth: UserAuthorization): boolean => {
  return auth.scopes.some((scope) => scope.id === 2 || scope.name === 'agent_admin');
};

// Helper function to get display name
const getDisplayName = (auth: UserAuthorization): string => {
  const { user } = auth;
  if (user.name && user.surname) {
    return `${user.name} ${user.surname}`;
  }
  if (user.name) {
    return user.name;
  }
  return user.username;
};

// Helper function to get the scope ID to use for deletion
const getScopeIdForDeletion = (auth: UserAuthorization): number => {
  // Return the first scope's ID (agent_admin = 2, agent_user = 3)
  if (auth.scopes.length > 0) {
    return auth.scopes[0].id;
  }
  return isAgentAdmin(auth) ? 2 : 3;
};

export function AuthorizationTab({ agentId }: AuthorizationTabProps) {
  const [userAuthorizations, setUserAuthorizations] = useState<UserAuthorization[]>([]);
  const [groupAuthorizations, setGroupAuthorizations] = useState<GroupAuthorization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<'user' | 'group'>('user');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'user' | 'group';
    id: number;
    name: string;
    scopeId: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAuthorizations = async () => {
    setIsLoading(true);
    try {
      const [users, groups] = await Promise.all([
        permissionsApi.getAgentAuthorizations(agentId),
        permissionsApi.getAgentGroupAuthorizations(agentId),
      ]);
      setUserAuthorizations(users);
      setGroupAuthorizations(groups);
    } catch (error) {
      console.error('Failed to fetch authorizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthorizations();
  }, [agentId]);

  const handleAddUser = () => {
    setAddModalType('user');
    setIsAddModalOpen(true);
  };

  const handleAddGroup = () => {
    setAddModalType('group');
    setIsAddModalOpen(true);
  };

  const handleDeleteUserAuth = (auth: UserAuthorization) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'user',
      id: auth.user.id,
      name: getDisplayName(auth),
      scopeId: getScopeIdForDeletion(auth),
    });
  };

  const handleDeleteGroupAuth = (auth: GroupAuthorization) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'group',
      id: auth.group_id,
      name: auth.group_name,
      scopeId: 3, // Groups typically have agent_user scope
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    try {
      if (deleteConfirm.type === 'user') {
        await permissionsApi.revokePermission(deleteConfirm.id, agentId, deleteConfirm.scopeId);
      } else {
        await permissionsApi.revokeGroupPermission(deleteConfirm.id, agentId, deleteConfirm.scopeId);
      }
      await fetchAuthorizations();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete authorization:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAuthorizationAdded = () => {
    fetchAuthorizations();
    setIsAddModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Users Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Yetkili Kullanıcılar</h3>
          </div>
          <Button size="sm" onClick={handleAddUser}>
            <Plus className="h-4 w-4" />
            Kullanıcı Ekle
          </Button>
        </div>

        {userAuthorizations.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Henüz yetkili kullanıcı bulunmuyor</p>
            <p className="text-sm text-gray-400 mt-1">
              "Kullanıcı Ekle" butonuna tıklayarak yetkilendirme ekleyebilirsiniz
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userAuthorizations.map((auth) => {
                  const isAdmin = isAgentAdmin(auth);
                  const displayName = getDisplayName(auth);
                  return (
                    <tr key={`${auth.user.id}-${isAdmin}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {displayName}
                            </span>
                            {auth.user.email && (
                              <p className="text-xs text-gray-500">{auth.user.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isAdmin
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isAdmin ? (
                            <>
                              <Shield className="h-3 w-3" />
                              Ajan Admin
                            </>
                          ) : (
                            'Kullanıcı'
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDeleteUserAuth(auth)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Yetkiyi Kaldır"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Groups Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Yetkili Gruplar</h3>
          </div>
          <Button size="sm" onClick={handleAddGroup}>
            <Plus className="h-4 w-4" />
            Grup Ekle
          </Button>
        </div>

        {groupAuthorizations.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <UsersRound className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Henüz yetkili grup bulunmuyor</p>
            <p className="text-sm text-gray-400 mt-1">
              "Grup Ekle" butonuna tıklayarak grup yetkilendirmesi ekleyebilirsiniz
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grup
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {groupAuthorizations.map((auth) => (
                  <tr key={auth.group_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <UsersRound className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {auth.group_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDeleteGroupAuth(auth)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Yetkiyi Kaldır"
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
      </div>

      {/* Add Authorization Modal */}
      <AddAuthorizationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAuthorizationAdded}
        agentId={agentId}
        type={addModalType}
        existingUserIds={userAuthorizations.map((a) => a.user.id)}
        existingGroupIds={groupAuthorizations.map((a) => a.group_id)}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={confirmDelete}
          title="Yetkiyi Kaldır"
          message={`"${deleteConfirm.name}" ${
            deleteConfirm.type === 'user' ? 'kullanıcısının' : 'grubunun'
          } bu ajana erişim yetkisini kaldırmak istediğinizden emin misiniz?`}
          confirmText="Kaldır"
          cancelText="İptal"
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}

export default AuthorizationTab;
