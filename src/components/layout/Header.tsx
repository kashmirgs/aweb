import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAgentStore, usePermissionStore } from '../../stores';
import { Avatar } from '../common';
import { LogOut, ChevronDown, PanelLeft, Settings, UserCircle } from 'lucide-react';
import { ProfileModal } from '../profile';

interface HeaderProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  hideAgentInfo?: boolean;
}

export function Header({ sidebarOpen = true, onToggleSidebar, hideAgentInfo = false }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { selectedAgent, getAgentImageUrl } = useAgentStore();
  const { clearPermissions } = usePermissionStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4">
      {/* Left section with toggle and agent */}
      <div className="flex items-center gap-3">
        {/* Toggle button when sidebar is closed */}
        {!sidebarOpen && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Open sidebar"
          >
            <PanelLeft className="h-5 w-5 text-gray-600" />
          </button>
        )}

        {/* Current Agent - hidden on settings pages */}
        {!hideAgentInfo && selectedAgent && (
          <>
            <Avatar
              src={getAgentImageUrl(selectedAgent.id)}
              alt={selectedAgent.name}
              size="sm"
              fallback={selectedAgent.name}
            />
            <div>
              <h2 className="font-semibold text-dark">{selectedAgent.name}</h2>
              {selectedAgent.description && (
                <p className="text-xs text-gray-500 line-clamp-1 max-w-md">
                  {selectedAgent.description}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* User Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Avatar
            size="sm"
            fallback={user?.username || user?.name}
          />
          <span className="text-sm font-medium text-dark hidden sm:block">
            {user?.name || user?.username}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-dark">
                {user?.name || user?.username}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsProfileOpen(true);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <UserCircle className="h-4 w-4" />
              Profilim
            </button>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                navigate('/settings');
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Ayarlar
            </button>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                clearPermissions();
                logout();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Çıkış Yap
            </button>
          </div>
        )}
      </div>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </header>
  );
}

export default Header;
