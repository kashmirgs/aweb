import { useState, useRef, useEffect, type KeyboardEvent, type FormEvent } from 'react';
import { useChatStore, useAgentStore } from '../../stores';
import { Send } from 'lucide-react';
import { cn } from '../../lib/utils';

export function MessageInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isSending, currentConversation, createConversation } = useChatStore();
  const { selectedAgent } = useAgentStore();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content || isSending || !selectedAgent) return;

    setInput('');

    // Create conversation if needed
    let conversationId = currentConversation?.id;
    if (!currentConversation) {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      const conversation = await createConversation(title, selectedAgent.id);
      if (!conversation) return;
      conversationId = conversation.id;
    }

    await sendMessage(content, conversationId);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isDisabled = !selectedAgent || isSending || !input.trim();

  return (
    <div className="border-t border-gray-200 bg-white px-4 md:px-8 py-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2 bg-gray-100 rounded-2xl p-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedAgent
                ? `Message ${selectedAgent.name}...`
                : 'Select an agent to start chatting'
            }
            disabled={!selectedAgent || isSending}
            className={cn(
              'flex-1 resize-none bg-transparent px-3 py-2',
              'focus:outline-none',
              'placeholder-gray-400',
              'min-h-[44px] max-h-[200px]',
              'disabled:cursor-not-allowed'
            )}
            rows={1}
          />
          <button
            type="submit"
            disabled={isDisabled}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              isDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary-600'
            )}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}

export default MessageInput;
