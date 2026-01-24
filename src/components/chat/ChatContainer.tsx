import { useChatStore } from '../../stores';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ConversationStarters } from './ConversationStarters';

export function ChatContainer() {
  const { currentConversation, messages, isSending, streamingContent } = useChatStore();

  // Show starters only when no conversation is active and no messages
  const hasActiveChat = currentConversation || messages.length > 0 || isSending || streamingContent;
  const showStarters = !hasActiveChat;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {showStarters ? <ConversationStarters /> : <MessageList />}
      <MessageInput />
    </div>
  );
}

export default ChatContainer;
