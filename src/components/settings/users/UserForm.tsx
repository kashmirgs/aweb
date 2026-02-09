import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, ShieldCheck } from 'lucide-react';
import { Button } from '../../common/Button';
import { useUserStore, useAuthStore } from '../../../stores';
import { permissionsApi } from '../../../api/permissions';
import type { UserPermissionEntry } from '../../../api/permissions';
import type { User, CreateUserRequest, UpdateUserRequest } from '../../../types';

interface UserFormProps {
  userId?: number;
  isNew?: boolean;
}

export function UserForm({ userId, isNew = false }: UserFormProps) {
  const navigate = useNavigate();
  const {
    currentUser,
    isLoading,
    isSaving,
    error,
    fetchUser,
    createUser,
    updateUser,
    clearError,
  } = useUserStore();

  const [formData, setFormData] = useState<Partial<User> & { password?: string }>({
    username: '',
    email: '',
    password: '',
    name: '',
    surname: '',
    department_name: '',
    phone: '',
    foreign_id: '',
    ad_user: false,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Permission management state
  const currentAuthUser = useAuthStore((s) => s.user);
  const isCurrentUserSuperAdmin = currentAuthUser?.id === 1;
  const [userPermissions, setUserPermissions] = useState<UserPermissionEntry[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [adminToggleValue, setAdminToggleValue] = useState<boolean | null>(null);

  const isSuperAdmin = userId === 1;
  const isGlobalAdminFromApi = userPermissions.some(
    (p) => p.chatbot_id === null && p.scope.id === 1
  );
  const isGlobalAdmin = adminToggleValue ?? isGlobalAdminFromApi;

  const loadPermissions = useCallback(async () => {
    if (!userId || isNew) return;
    setPermissionsLoading(true);
    try {
      const data = await permissionsApi.getUserPermissionsById(userId);
      setUserPermissions(data.permissions || []);
      setAdminToggleValue(null);
    } catch {
      // ignore
    } finally {
      setPermissionsLoading(false);
    }
  }, [userId, isNew]);

  useEffect(() => {
    if (!isNew && userId) {
      fetchUser(userId);
      loadPermissions();
    }
  }, [userId, isNew, fetchUser, loadPermissions]);

  useEffect(() => {
    if (currentUser && !isNew) {
      setFormData({
        ...currentUser,
        password: '', // Şifre alanını boş bırak
      });
    }
  }, [currentUser, isNew]);

  const handleToggleGlobalAdmin = () => {
    if (!userId || isSuperAdmin) return;
    setAdminToggleValue(!isGlobalAdmin);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Validation hatası varsa temizle
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

    if (!formData.username?.trim()) {
      errors.username = 'Kullanıcı adı zorunludur';
    }

    if (!formData.email?.trim()) {
      errors.email = 'E-posta zorunludur';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    if (isNew && !formData.password?.trim()) {
      errors.password = 'Şifre zorunludur';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    clearError();

    if (!validate()) {
      return;
    }

    if (isNew) {
      const data: CreateUserRequest = {
        username: formData.username!,
        email: formData.email!,
        password: formData.password!,
        name: formData.name || undefined,
        surname: formData.surname || undefined,
        department_name: formData.department_name || undefined,
        phone: formData.phone || undefined,
        foreign_id: formData.foreign_id || undefined,
        ad_user: formData.ad_user,
      };
      const user = await createUser(data);
      if (user) {
        navigate('/settings/users');
      }
    } else if (userId) {
      const data: UpdateUserRequest = {
        id: userId,
        username: formData.username,
        email: formData.email,
        name: formData.name || undefined,
        surname: formData.surname || undefined,
        department_name: formData.department_name || undefined,
        phone: formData.phone || undefined,
        foreign_id: formData.foreign_id || undefined,
        ad_user: formData.ad_user,
      };
      // Sadece şifre girilmişse ekle
      if (formData.password?.trim()) {
        data.password = formData.password;
      }
      const user = await updateUser(data);
      if (user) {
        // Admin yetkisi değişmişse kaydet
        if (adminToggleValue !== null && adminToggleValue !== isGlobalAdminFromApi) {
          try {
            if (adminToggleValue) {
              await permissionsApi.grantPermission(userId, null, 1);
            } else {
              await permissionsApi.revokePermission(userId, null, 1);
            }
          } catch {
            // ignore
          }
        }
        navigate('/settings/users');
      }
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
              onClick={() => navigate('/settings/users')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isNew ? 'Yeni Kullanıcı Oluştur' : formData.username || 'Kullanıcı Düzenle'}
              </h1>
              {!isNew && currentUser?.created_at && (
                <p className="text-sm text-gray-500">
                  Oluşturulma: {new Date(currentUser.created_at).toLocaleDateString('tr-TR')}
                </p>
              )}
            </div>
          </div>
          <Button onClick={handleSave} isLoading={isSaving} disabled={isNew && !formData.username}>
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
              {/* Kullanıcı Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kullanıcı Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    validationErrors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="kullanici_adi"
                />
                {validationErrors.username && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.username}</p>
                )}
              </div>

              {/* E-posta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    validationErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="kullanici@example.com"
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
                )}
              </div>

              {/* Şifre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre {isNew && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    validationErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={isNew ? 'Şifre giriniz' : 'Değiştirmek için yeni şifre giriniz'}
                />
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.password}</p>
                )}
                {!isNew && (
                  <p className="mt-1 text-xs text-gray-500">
                    Boş bırakırsanız şifre değişmez
                  </p>
                )}
              </div>

              <hr className="border-gray-200" />

              {/* Ad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ad"
                />
              </div>

              {/* Soyad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Soyad
                </label>
                <input
                  type="text"
                  value={formData.surname || ''}
                  onChange={(e) => handleChange('surname', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Soyad"
                />
              </div>

              {/* Departman */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departman
                </label>
                <input
                  type="text"
                  value={formData.department_name || ''}
                  onChange={(e) => handleChange('department_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Departman"
                />
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="+90 xxx xxx xx xx"
                />
              </div>

              {/* AD User */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ad_user"
                  checked={formData.ad_user || false}
                  onChange={(e) => handleChange('ad_user', e.target.checked)}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="ad_user" className="text-sm font-medium text-gray-700">
                  Active Directory Kullanıcısı
                </label>
              </div>
            </div>
          </div>

          {/* Yetki Yönetimi - sadece super admin düzenlerken göster */}
          {!isNew && userId && isCurrentUserSuperAdmin && !isSuperAdmin && (
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              {permissionsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-gray-900">Global Admin</p>
                      <p className="text-sm text-gray-500">
                        Tüm sisteme tam erişim yetkisi verir
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleGlobalAdmin}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isGlobalAdmin
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isGlobalAdmin ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserForm;
