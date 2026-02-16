import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../sidebar';
import { Header } from './Header';
import { useAuthStore, useAgentStore, useChatStore, usePermissionStore } from '../../stores';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, checkAuth, user } = useAuthStore();
  const { fetchAgents } = useAgentStore();
  const { fetchConversations } = useChatStore();
  const { fetchPermissions, permissions } = usePermissionStore();

  const isSettingsPage = location.pathname.startsWith('/settings');

  // Check auth on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsChecking(true);
      const isValid = await checkAuth();
      setIsChecking(false);
      if (!isValid) {
        navigate('/login', { replace: true });
      }
    };
    initAuth();
  }, []);

  // Redirect to login when logged out
  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isChecking, navigate]);

  // Fetch agents and conversations on auth
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAgents();
      fetchConversations();
    }
  }, [isAuthenticated, user, fetchAgents, fetchConversations]);

  // Fetch permissions independently (no permissions in deps to avoid re-triggering fetchConversations)
  useEffect(() => {
    if (isAuthenticated && user && !permissions) {
      fetchPermissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  // Protect super admin only routes
  useEffect(() => {
    const superAdminRoutes = ['/settings/models', '/settings/users'];
    if (
      superAdminRoutes.some(route => location.pathname.startsWith(route)) &&
      permissions &&
      !permissions.is_super_admin
    ) {
      navigate('/settings/agents', { replace: true });
    }
  }, [location.pathname, permissions, navigate]);

  // Show loading only during initial auth check
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // If not authenticated after checking, don't render (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        mode={isSettingsPage ? 'settings' : 'chat'}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          hideAgentInfo={isSettingsPage}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
