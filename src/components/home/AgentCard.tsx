import { Avatar } from '../common';
import { cn } from '../../lib/utils';
import type { Agent } from '../../types';

interface AgentCardProps {
  agent: Agent;
  imageUrl: string;
  onClick: () => void;
}

export function AgentCard({ agent, imageUrl, onClick }: AgentCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-4',
        'bg-white rounded-xl border border-gray-200',
        'shadow-sm hover:shadow-md transition-all duration-200',
        'hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'text-left'
      )}
    >
      <Avatar
        src={imageUrl}
        alt={agent.name}
        size="lg"
        fallback={agent.name}
        className="flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-dark truncate">
          {agent.name}
        </h3>
        {agent.description && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
            {agent.description}
          </p>
        )}
      </div>
    </button>
  );
}

export default AgentCard;
