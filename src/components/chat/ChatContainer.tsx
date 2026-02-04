import { useChatStore, useAgentStore } from '../../stores';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Avatar } from '../common';
import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ConversationStarter } from '../../types';

export function ChatContainer() {
  const { currentConversation, messages, isSending, streamingContent, sendMessage, createConversation } = useChatStore();
  const { selectedAgent, starters, getAgentImageUrl } = useAgentStore();

  // Show starters only when no conversation is active and no messages
  const hasActiveChat = currentConversation || messages.length > 0 || isSending || streamingContent;
  const showStarters = !hasActiveChat;

  const handleStarterClick = async (prompt: string) => {
    if (!selectedAgent) return;

    // Create conversation first if needed
    let conversationId = currentConversation?.id;
    if (!currentConversation) {
      const title = prompt.slice(0, 50) + (prompt.length > 50 ? '...' : '');
      const conversation = await createConversation(title, selectedAgent.id);
      if (!conversation) return;
      conversationId = conversation.id;
    }

    await sendMessage(prompt, conversationId);
  };

  // Centered layout for new chats
  if (showStarters) {
    return (
      <div className="h-full flex flex-col bg-white overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {!selectedAgent ? (
            // No agent selected
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 mx-auto">
                <Sparkles className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-2xl font-semibold text-dark mb-2">
                Merhaba,
              </h2>
              <p className="text-gray-500 max-w-md">
                Destek almak istediğiniz ajanı seçerek sohbete başlayın.
              </p>
            </div>
          ) : (
            // Agent selected - show centered content with MessageInput
            <>
              <div className="text-center mb-8">
                <Avatar
                  src={getAgentImageUrl(selectedAgent.id)}
                  alt={selectedAgent.name}
                  size="lg"
                  fallback={selectedAgent.name}
                  className="mx-auto mb-4 h-16 w-16"
                />
                <h2 className="text-xl font-semibold text-dark mb-2">
                  {selectedAgent.name}
                </h2>
                {selectedAgent.description && (
                  <p className="text-gray-500 max-w-md">{selectedAgent.description}</p>
                )}
              </div>

              {starters.length > 0 && (
                <div className="w-full max-w-2xl mb-8">
                  <p className="text-sm font-medium text-gray-500 mb-3 text-center">
                    Şunları sorabilirsiniz
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {starters.map((starter: ConversationStarter) => (
                      <button
                        key={starter.id}
                        onClick={() => handleStarterClick(starter.prompt)}
                        className={cn(
                          'p-2 rounded-xl border border-gray-200',
                          'hover:border-primary hover:bg-primary-50',
                          'transition-colors duration-200'
                        )}
                      >
                        <p className="text-xs text-dark line-clamp-2">{starter.title || starter.prompt}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Centered MessageInput */}
              <div className="w-full max-w-3xl">
                <MessageInput variant="centered" />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Normal layout with MessageInput at bottom
  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <MessageList />
      <MessageInput />
    </div>
  );
}

export default ChatContainer;
