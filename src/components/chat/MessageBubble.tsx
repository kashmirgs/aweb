import type { Message } from '../../types';
import { cn } from '../../lib/utils';
import { Avatar } from '../common';
import { useAgentStore } from '../../stores';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { useState } from 'react';

// Parse content to detect .assistantfinal marker and split thinking/response
const parseContent = (content: string) => {
  const marker = '.assistantfinal';
  const markerIndex = content.indexOf(marker);

  if (markerIndex === -1) {
    return { thinking: null, response: content };
  }

  return {
    thinking: content.slice(0, markerIndex).trim(),
    response: content.slice(markerIndex + marker.length).trim()
  };
};

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const { selectedAgent, getAgentImageUrl } = useAgentStore();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  const role = message.role || message.sender_role;
  const isUser = role === 'user';
  const { thinking, response } = isUser ? { thinking: null, response: message.content } : parseContent(message.content);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div
      className={cn(
        'flex gap-3 py-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <Avatar size="sm" fallback="U" />
        ) : (
          <Avatar
            src={selectedAgent ? getAgentImageUrl(selectedAgent.id) : undefined}
            alt={selectedAgent?.name}
            size="sm"
            fallback={selectedAgent?.name}
          />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex-1 max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-white rounded-tr-sm'
            : 'bg-gray-100 text-dark rounded-tl-sm'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className={cn('prose prose-sm max-w-none', !isUser && 'prose-gray')}>
            {/* Collapsible Thinking Section */}
            {thinking && (
              <div className="mb-3">
                <button
                  onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors mb-1"
                >
                  {isThinkingExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  <Brain className="h-3.5 w-3.5" />
                  <span>{isThinkingExpanded ? 'Hide thinking' : 'Show thinking'}</span>
                </button>
                {isThinkingExpanded && (
                  <div className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-sm text-gray-600 italic">
                    <ReactMarkdown
                      components={{
                        code({ node, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeString = String(children).replace(/\n$/, '');
                          const isInline = !match && !codeString.includes('\n');

                          if (isInline) {
                            return (
                              <code
                                className="bg-purple-100 px-1.5 py-0.5 rounded text-sm font-mono not-italic"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          }

                          return (
                            <div className="relative group not-italic">
                              <button
                                onClick={() => copyToClipboard(codeString)}
                                className="absolute right-2 top-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                                title="Copy code"
                              >
                                {copiedCode === codeString ? (
                                  <Check className="h-3.5 w-3.5 text-green-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5 text-gray-300" />
                                )}
                              </button>
                              <SyntaxHighlighter
                                style={oneDark}
                                language={match?.[1] || 'text'}
                                PreTag="div"
                                className="rounded-lg !my-2"
                              >
                                {codeString}
                              </SyntaxHighlighter>
                            </div>
                          );
                        },
                        p({ children }) {
                          return <p className="mb-2 last:mb-0">{children}</p>;
                        },
                        ul({ children }) {
                          return <ul className="list-disc pl-4 mb-2">{children}</ul>;
                        },
                        ol({ children }) {
                          return <ol className="list-decimal pl-4 mb-2">{children}</ol>;
                        },
                      }}
                    >
                      {thinking}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {/* Main Response */}
            <ReactMarkdown
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  const isInline = !match && !codeString.includes('\n');

                  if (isInline) {
                    return (
                      <code
                        className="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }

                  return (
                    <div className="relative group">
                      <button
                        onClick={() => copyToClipboard(codeString)}
                        className="absolute right-2 top-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Copy code"
                      >
                        {copiedCode === codeString ? (
                          <Check className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-gray-300" />
                        )}
                      </button>
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match?.[1] || 'text'}
                        PreTag="div"
                        className="rounded-lg !my-2"
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    </div>
                  );
                },
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="list-disc pl-4 mb-2">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal pl-4 mb-2">{children}</ol>;
                },
              }}
            >
              {response}
            </ReactMarkdown>
          </div>
        )}

        {/* Streaming indicator */}
        {isStreaming && (
          <span className="inline-block ml-1 animate-pulse">|</span>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
