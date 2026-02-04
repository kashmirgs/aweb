import { useAgentStore, useChatStore } from '../../stores';
import { Avatar } from '../common';
import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ConversationStarter } from '../../types';

export function ConversationStarters() {
  const { selectedAgent, starters, getAgentImageUrl } = useAgentStore();
  const { sendMessage, createConversation, currentConversation } = useChatStore();

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

  if (!selectedAgent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-dark mb-2">
          UpperMind'e Hoş Geldiniz
        </h2>
        <p className="text-gray-500 max-w-md">
          Sohbete başlamak için kenar çubuğundan bir AI ajanı seçin
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
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
        <div className="w-full max-w-2xl">
          <p className="text-sm font-medium text-gray-500 mb-3 text-center">
            Şunları sorabilirsiniz
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {starters.map((starter: ConversationStarter) => (
              <button
                key={starter.id}
                onClick={() => handleStarterClick(starter.prompt)}
                className={cn(
                  'p-4 rounded-xl border border-gray-200',
                  'text-left hover:border-primary hover:bg-primary-50',
                  'transition-colors duration-200'
                )}
              >
                <p className="text-sm text-dark line-clamp-2">{starter.prompt}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConversationStarters;
