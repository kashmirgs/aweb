import { Link } from 'react-router-dom';
import { Logo, Button } from '../common';
import { ConversationList } from './ConversationList';
import { useChatStore, useAgentStore } from '../../stores';
import { Plus, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { clearCurrentConversation } = useChatStore();
  const { selectedAgent } = useAgentStore();

  const handleNewChat = () => {
    clearCurrentConversation();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'h-full z-50 flex-shrink-0',
          'bg-white border-r border-gray-200',
          'flex flex-col',
          'transition-all duration-300 ease-in-out',
          isOpen ? 'w-72' : 'w-0 overflow-hidden border-0'
        )}
      >
        <div className="w-72 h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <Link
                to="/"
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="p-1.5 bg-dark rounded-lg">
                  <Logo variant="light" className="h-5" />
                </div>
              </Link>
              <button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Close sidebar"
              >
                <PanelLeftClose className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* New Chat Button */}
            <Button
              onClick={handleNewChat}
              className="w-full"
              variant="primary"
              disabled={!selectedAgent}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>

          {/* Conversations */}
          <ConversationList />
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
