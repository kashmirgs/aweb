import { useEffect, useRef } from 'react';
import { useChatStore } from '../../stores';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../../types';

export function MessageList() {
  const { messages, streamingContent, isSending } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Filter out system messages (check both role and sender_role for API compatibility)
  const filteredMessages = messages.filter((m) => {
    const role = m.role || m.sender_role;
    return role !== 'system';
  });

  const displayMessages = [...filteredMessages];
  if (isSending && streamingContent) {
    const streamingMessage: Message = {
      role: 'assistant',
      content: streamingContent,
    };
    displayMessages.push(streamingMessage);
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        {displayMessages.map((message, index) => (
          <MessageBubble
            key={message.id || `msg-${index}`}
            message={message}
            isStreaming={
              isSending &&
              index === displayMessages.length - 1 &&
              (message.role === 'assistant' || message.sender_role === 'assistant')
            }
          />
        ))}

        {/* Loading indicator when waiting for first chunk */}
        {isSending && !streamingContent && (
          <div className="flex gap-3 py-4">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
            </div>
            <div className="flex-1 max-w-[80%] rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default MessageList;
