import { useNavigate } from 'react-router-dom';
import { useChatStore, useAgentStore } from '../../stores';
import { groupConversationsByDate, cn, truncate } from '../../lib/utils';
import { MessageSquare, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Conversation } from '../../types';

export function ConversationList() {
  const navigate = useNavigate();
  const {
    conversations,
    currentConversation,
    selectConversation,
    deleteConversation,
    isLoading,
  } = useChatStore();
  const { selectAgent, getAgentById, fetchAgents } = useAgentStore();
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const handleConversationClick = async (conversation: Conversation) => {
    // selectConversation fetches the full conversation with bot_id
    await selectConversation(conversation);

    // Get the full conversation from the store (includes bot_id from API)
    const fullConversation = useChatStore.getState().currentConversation;
    const botId = fullConversation?.bot_id || conversation.bot_id;

    if (!botId) {
      return;
    }

    // Find the corresponding agent
    let agent = getAgentById(botId);

    // If agent not found, agents might not be loaded yet - fetch and retry
    if (!agent) {
      await fetchAgents();
      agent = getAgentById(botId);
    }

    if (agent) {
      selectAgent(agent);
      // Route state ile navigate et - race condition'ı önlemek için
      navigate('/chat', {
        state: {
          conversationId: conversation.id,
          agentId: agent.id
        }
      });
    }
  };

  // Show all conversations (no agent filtering)
  const filteredConversations = conversations;

  const groupedConversations = groupConversationsByDate(filteredConversations);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (filteredConversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-4">
        <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm text-center">Henüz sohbet yok</p>
        <p className="text-xs text-center mt-1">
          Başlamak için yeni bir sohbet başlatın
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2">
      {groupedConversations.map((group) => (
        <div key={group.label} className="mb-4">
          <p className="text-xs font-medium text-gray-500 px-2 py-1">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((conversation) => (
              <div
                key={conversation.id}
                className="relative"
                onMouseEnter={() => setHoveredId(conversation.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <button
                  onClick={() => handleConversationClick(conversation)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-lg transition-colors',
                    'hover:bg-gray-100',
                    currentConversation?.id === conversation.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-dark'
                  )}
                >
                  <p className="text-sm truncate pr-6">
                    {truncate(conversation.title, 30)}
                  </p>
                </button>

                {hoveredId === conversation.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Bu sohbeti silmek istiyor musunuz?')) {
                        deleteConversation(conversation.id);
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                    title="Sohbeti sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ConversationList;
