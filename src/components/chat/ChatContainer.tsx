import { useChatStore } from '../../stores';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ConversationStarters } from './ConversationStarters';

export function ChatContainer() {
  const { currentConversation, messages } = useChatStore();

  const showStarters = !currentConversation || messages.length === 0;

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {showStarters ? <ConversationStarters /> : <MessageList />}
      <MessageInput />
    </div>
  );
}

export default ChatContainer;
