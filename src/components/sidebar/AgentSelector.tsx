import { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '../../stores';
import { Avatar } from '../common';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export function AgentSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { agents, selectedAgent, selectAgent, getAgentImageUrl } = useAgentStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (agents.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
          'bg-gray-100 hover:bg-gray-200 transition-colors',
          'text-left'
        )}
      >
        {selectedAgent && (
          <>
            <Avatar
              src={getAgentImageUrl(selectedAgent.id)}
              alt={selectedAgent.name}
              size="sm"
              fallback={selectedAgent.name}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark truncate">
                {selectedAgent.name}
              </p>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-gray-500 transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-64 overflow-y-auto">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => {
                selectAgent(agent);
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors',
                selectedAgent?.id === agent.id && 'bg-primary-50'
              )}
            >
              <Avatar
                src={getAgentImageUrl(agent.id)}
                alt={agent.name}
                size="sm"
                fallback={agent.name}
              />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-dark truncate">
                  {agent.name}
                </p>
                {agent.description && (
                  <p className="text-xs text-gray-500 truncate">
                    {agent.description}
                  </p>
                )}
              </div>
              {selectedAgent?.id === agent.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default AgentSelector;
