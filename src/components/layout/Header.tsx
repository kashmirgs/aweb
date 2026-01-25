import { useState, useRef, useEffect } from 'react';
import { useAuthStore, useAgentStore } from '../../stores';
import { Avatar } from '../common';
import { LogOut, ChevronDown, PanelLeft } from 'lucide-react';

interface HeaderProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ sidebarOpen = true, onToggleSidebar }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();
  const { selectedAgent, getAgentImageUrl } = useAgentStore();

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

        {/* Current Agent */}
        {selectedAgent && (
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
                logout();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
