import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import apiClient from '../../api/client';
import type { Agent } from '../../types';

interface AgentCardProps {
  agent: Agent;
  imageUrl: string;
  onClick: () => void;
}

export function AgentCard({ agent, imageUrl, onClick }: AgentCardProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchImage = async () => {
      try {
        const response = await apiClient.get(`/chatbot/${agent.id}/image`, {
          responseType: 'blob',
        });
        if (isMounted && response.data) {
          const blobUrl = URL.createObjectURL(response.data);
          setImageSrc(blobUrl);
        }
      } catch {
        if (isMounted) {
          setImageError(true);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [agent.id]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full h-24 flex items-center gap-4 p-4',
        'bg-white rounded-xl border border-gray-200',
        'shadow-sm hover:shadow-md transition-all duration-200',
        'hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'text-left'
      )}
    >
      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
        {!imageError && imageSrc ? (
          <img
            src={imageSrc}
            alt={agent.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-lg">
            {getInitials(agent.name)}
          </div>
        )}
      </div>
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
