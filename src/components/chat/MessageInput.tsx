import { useState, useRef, useEffect, type KeyboardEvent, type FormEvent } from 'react';
import { useChatStore, useAgentStore, useAttachmentStore } from '../../stores';
import { Send, Square } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FileAttachmentButton } from './FileAttachmentButton';
import { AttachmentList } from './AttachmentList';

interface MessageInputProps {
  variant?: 'default' | 'centered';
}

export function MessageInput({ variant = 'default' }: MessageInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isSending, currentConversation, createConversation, stopStreaming } = useChatStore();
  const { selectedAgent } = useAgentStore();
  const {
    attachments,
    getAttachedContent,
    getAttachmentMetadata,
    clearAttachments,
    validateTotalSize,
    isProcessing,
    error: _attachmentError,
  } = useAttachmentStore();

  const maxToken = selectedAgent?.llm_settings?.max_token || 128000;

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

    // Validate token limit
    const validation = validateTotalSize(maxToken);
    if (!validation.valid) {
      return;
    }

    // Check if any attachment is still processing
    const hasProcessing = attachments.some((a) => a.status === 'parsing' || a.status === 'pending');
    if (hasProcessing) {
      return;
    }

    setInput('');

    // Get attachment data before clearing
    const attachedContent = getAttachedContent();
    const attachmentMetadata = getAttachmentMetadata();

    // Clear attachments after getting data
    clearAttachments();

    // Create conversation if needed
    let conversationId = currentConversation?.id;
    if (!currentConversation) {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      const conversation = await createConversation(title, selectedAgent.id);
      if (!conversation) return;
      conversationId = conversation.id;
    }

    await sendMessage(
      content,
      conversationId,
      attachedContent || undefined,
      attachmentMetadata.length > 0 ? attachmentMetadata : undefined
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasReadyAttachments = attachments.some((a) => a.status === 'ready');
  const isDisabled = !selectedAgent || isSending || (!input.trim() && !hasReadyAttachments) || isProcessing;
  const tokenValidation = validateTotalSize(maxToken);

  return (
    <div className={cn(
      'bg-white px-4 md:px-8 py-4',
      variant === 'default' && 'border-t border-gray-200'
    )}>
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        {/* Attachment list */}
        <AttachmentList maxToken={maxToken} />

        {/* Token error */}
        {!tokenValidation.valid && (
          <p className="text-xs text-red-500 mb-2">{tokenValidation.error}</p>
        )}

        <div className="relative flex items-center gap-2 bg-gray-100 rounded-2xl p-2">
          {/* Attachment button */}
          <FileAttachmentButton disabled={!selectedAgent || isSending} />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedAgent
                ? `${selectedAgent.name} ile sohbet edin...`
                : 'Sohbete başlamak için bir ajan seçin'
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
            type={isSending ? 'button' : 'submit'}
            onClick={isSending ? stopStreaming : undefined}
            disabled={!isSending && isDisabled}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              isSending
                ? 'bg-primary text-white hover:bg-primary-600'
                : isDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-600'
            )}
          >
            {isSending ? (
              <Square className="h-5 w-5" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          {selectedAgent?.warning_message || 'Göndermek için Enter, yeni satır için Shift+Enter'}
        </p>
      </form>
    </div>
  );
}

export default MessageInput;
