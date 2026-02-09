import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuthStore } from '../../stores';
import { authApi } from '../../api';
import { UserCircle, KeyRound, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      if (error.response.status === 401) return 'Mevcut şifre hatalı.';
      return error.response.data?.detail || error.response.data?.message || 'Bir hata oluştu';
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Beklenmeyen bir hata oluştu';
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, setUser } = useAuthStore();

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [phone, setPhone] = useState('');

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setSurname(user.surname || '');
      setEmail(user.email || '');
      setDepartmentName(user.department_name || '');
      setPhone(user.phone || '');
      setProfileSuccess('');
      setProfileError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
      setPasswordSuccess('');
      setPasswordError('');
    }
  }, [isOpen, user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const updatedUser = await authApi.updateProfile({
        id: user.id,
        email,
        name,
        surname,
        department_name: departmentName,
        phone,
      });
      setUser(updatedUser);
      setProfileSuccess('Profil bilgileri güncellendi.');
    } catch (error) {
      setProfileError(getErrorMessage(error));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Mevcut şifre alanı zorunludur.');
      return;
    }

    if (!newPassword) {
      setPasswordError('Yeni şifre alanı zorunludur.');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('Yeni şifre en az 4 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Yeni şifreler eşleşmiyor.');
      return;
    }

    setPasswordLoading(true);

    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Şifre başarıyla değiştirildi.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(getErrorMessage(error));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profilim" size="lg">
      <div className="space-y-6">
        {/* Profile Info Section */}
        <form onSubmit={handleProfileSave}>
          <div className="flex items-center gap-2 mb-4">
            <UserCircle className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Profil Bilgileri</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
              <input
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departman</label>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>

          {profileSuccess && (
            <p className="mt-3 text-sm text-green-600">{profileSuccess}</p>
          )}
          {profileError && (
            <p className="mt-3 text-sm text-red-600">{profileError}</p>
          )}

          <div className="mt-4 flex justify-end">
            <Button type="submit" isLoading={profileLoading} size="sm">
              Kaydet
            </Button>
          </div>
        </form>

        <hr className="border-gray-200" />

        {/* Password Change Section - Collapsible */}
        <div>
          <button
            type="button"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="w-full flex items-center justify-between py-1 group"
          >
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Şifre Değiştir</h3>
            </div>
            {showPasswordSection ? (
              <ChevronUp className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            )}
          </button>

          {showPasswordSection && (
            <form onSubmit={handlePasswordChange} className="mt-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mevcut Şifre</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Şifre</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Şifre (Tekrar)</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>

              {passwordSuccess && (
                <p className="mt-3 text-sm text-green-600">{passwordSuccess}</p>
              )}
              {passwordError && (
                <p className="mt-3 text-sm text-red-600">{passwordError}</p>
              )}

              <div className="mt-4 flex justify-end">
                <Button type="submit" isLoading={passwordLoading} size="sm">
                  Şifreyi Değiştir
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default ProfileModal;
