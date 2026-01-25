import { Link } from 'react-router-dom';
import { Logo, Button } from '../common';
import { AgentSelector } from './AgentSelector';
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
          'fixed lg:static inset-y-0 left-0 z-50',
          'w-72 bg-white border-r border-gray-200',
          'flex flex-col',
          'transform transition-transform duration-300 lg:transform-none',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          !isOpen && 'lg:w-0 lg:overflow-hidden lg:border-0'
        )}
      >
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
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            >
              <PanelLeftClose className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Agent Selector */}
          <AgentSelector />

          {/* New Chat Button */}
          <Button
            onClick={handleNewChat}
            className="w-full mt-3"
            variant="primary"
            disabled={!selectedAgent}
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Conversations */}
        <ConversationList />
      </aside>

      {/* Toggle button when closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-4 top-4 z-30 p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors lg:static lg:m-4"
        >
          <PanelLeft className="h-5 w-5 text-gray-600" />
        </button>
      )}
    </>
  );
}

export default Sidebar;
