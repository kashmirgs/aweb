import type { Message } from '../../types';
import { cn } from '../../lib/utils';
import { Avatar } from '../common';
import { useAgentStore } from '../../stores';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, ChevronDown, ChevronRight, Brain, FileText } from 'lucide-react';
import { useState } from 'react';

// Parse content to detect thinking/response split
// New format: message.thinking field is set directly
// Old format: assistantfinal marker in content string (backward compat)
const parseContent = (message: Message) => {
  // New format: thinking field is set separately
  if (message.thinking) {
    const { cleanContent, fileReferences } = extractFileReferences(message.content);
    return { thinking: message.thinking, response: cleanContent, fileReferences };
  }

  // Old format: assistantfinal marker in content
  const marker = 'assistantfinal';
  const markerIndex = message.content.indexOf(marker);

  if (markerIndex === -1) {
    const { cleanContent, fileReferences } = extractFileReferences(message.content);
    return { thinking: null, response: cleanContent, fileReferences };
  }

  const rawResponse = message.content.slice(markerIndex + marker.length).trim();
  const { cleanContent, fileReferences } = extractFileReferences(rawResponse);
  return {
    thinking: message.content.slice(0, markerIndex).trim(),
    response: cleanContent,
    fileReferences
  };
};

// Strip attachment content from user messages for display
const stripAttachmentContent = (content: string): string => {
  const pattern = /<!--ATTACHMENT_START-->[\s\S]*?<!--ATTACHMENT_END-->\n*---\n*/g;
  return content.replace(pattern, '').trim();
};

// Extract file references from assistant response
const extractFileReferences = (content: string): { cleanContent: string; fileReferences: string[] } => {
  const refs: string[] = [];
  const cleanContent = content.replace(/<filename='([^']+)'>/g, (_, name) => {
    refs.push(name);
    return '';
  });
  return { cleanContent: cleanContent.trim(), fileReferences: refs };
};

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  isStreamingThinking?: boolean;
}

export function MessageBubble({ message, isStreaming, isStreamingThinking }: MessageBubbleProps) {
  const { selectedAgent, getAgentImageUrl } = useAgentStore();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  const role = message.role || message.sender_role;
  const isUser = role === 'user';
  const { thinking, response, fileReferences } = isUser ? { thinking: null, response: message.content, fileReferences: [] as string[] } : parseContent(message);

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
          <div>
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {message.attachments.map((attachment) => (
                  <span
                    key={attachment.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded text-xs"
                  >
                    <FileText className="h-3 w-3" />
                    {attachment.name}
                  </span>
                ))}
              </div>
            )}
            <p className="whitespace-pre-wrap">{stripAttachmentContent(message.content)}</p>
          </div>
        ) : (
          <div className={cn('prose prose-sm max-w-none', !isUser && 'prose-gray')}>
            {/* Streaming Thinking Indicator */}
            {isStreamingThinking && thinking && (
              <div>
                <button
                  onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
                  className="flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors mb-1"
                >
                  {isThinkingExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  <Brain className="h-3.5 w-3.5 animate-pulse" />
                  <span>Düşünüyor...</span>
                </button>
                {isThinkingExpanded && (
                  <div className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-sm text-gray-600 italic">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {thinking}
                    </ReactMarkdown>
                    <span className="inline-block ml-1 animate-pulse text-purple-400">|</span>
                  </div>
                )}
              </div>
            )}

            {/* Collapsible Thinking Section (completed) */}
            {thinking && !isStreamingThinking && (
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
                  <span>{isThinkingExpanded ? 'Düşünce sürecini gizle' : 'Düşünce sürecini göster'}</span>
                </button>
                {isThinkingExpanded && (
                  <div className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-sm text-gray-600 italic">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
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
                        table({ children }) {
                          return (
                            <div className="overflow-x-auto my-3">
                              <table className="min-w-full border-collapse border border-gray-300 text-sm">
                                {children}
                              </table>
                            </div>
                          );
                        },
                        thead({ children }) {
                          return <thead className="bg-gray-100">{children}</thead>;
                        },
                        tbody({ children }) {
                          return <tbody className="divide-y divide-gray-200">{children}</tbody>;
                        },
                        tr({ children }) {
                          return <tr className="hover:bg-gray-50">{children}</tr>;
                        },
                        th({ children }) {
                          return (
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                              {children}
                            </th>
                          );
                        },
                        td({ children }) {
                          return (
                            <td className="border border-gray-300 px-3 py-2">
                              {children}
                            </td>
                          );
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
              remarkPlugins={[remarkGfm]}
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
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-3">
                      <table className="min-w-full border-collapse border border-gray-300 text-sm">
                        {children}
                      </table>
                    </div>
                  );
                },
                thead({ children }) {
                  return <thead className="bg-gray-100">{children}</thead>;
                },
                tbody({ children }) {
                  return <tbody className="divide-y divide-gray-200">{children}</tbody>;
                },
                tr({ children }) {
                  return <tr className="hover:bg-gray-50">{children}</tr>;
                },
                th({ children }) {
                  return (
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return (
                    <td className="border border-gray-300 px-3 py-2">
                      {children}
                    </td>
                  );
                },
              }}
            >
              {response}
            </ReactMarkdown>

            {/* File References */}
            {fileReferences.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500 font-medium">Kaynaklar</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {fileReferences.map((filename, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 rounded text-xs text-gray-700">
                      <FileText className="h-3 w-3" />
                      {filename}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
