import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore, usePermissionStore } from '../../stores';
import { SettingsSidebar } from './SettingsSidebar';

export function SettingsLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { fetchPermissions, permissions, isLoading: permLoading } = usePermissionStore();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isAuthenticated && !permissions) {
      fetchPermissions();
    }
  }, [isAuthenticated, authLoading, permissions, fetchPermissions, navigate]);

  if (authLoading || permLoading || !permissions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <SettingsSidebar />
      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}

export default SettingsLayout;
