import { create } from 'zustand';
import type { Conversation, Message, MessageAttachment } from '../types';
import { conversationsApi, chatApi } from '../api';
import { useAgentStore } from './agentStore';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  streamingContent: string;
  streamingThinking: string;
  error: string | null;
  abortController: AbortController | null;
  streamingConversationId: number | null;
  savedPartialMessages: Record<number, Message>;

  fetchConversations: () => Promise<void>;
  selectConversation: (conversation: Conversation | null) => Promise<void>;
  createConversation: (title: string, botId: number) => Promise<Conversation | null>;
  deleteConversation: (id: number) => Promise<void>;
  sendMessage: (content: string, conversationId?: number, attachedContent?: string, attachments?: MessageAttachment[]) => Promise<void>;
  stopStreaming: () => void;
  clearCurrentConversation: () => void;
}

// Helper: move a conversation to the top of the list by updating its updated_at locally
function bumpConversation(conversations: Conversation[], id: number): Conversation[] {
  const now = new Date().toISOString();
  const updated = conversations.map((c) =>
    c.id === id ? { ...c, updated_at: now } : c
  );
  updated.sort((a, b) =>
    new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
  );
  return updated;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  isSending: false,
  streamingContent: '',
  streamingThinking: '',
  error: null,
  abortController: null,
  streamingConversationId: null,
  savedPartialMessages: {},

  fetchConversations: async () => {
    try {
      const conversations = await conversationsApi.list();
      // Sort by updated_at descending (fallback to created_at)
      conversations.sort((a, b) =>
        new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
      );
      set({ conversations });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch conversations';
      set({ error: message });
    }
  },

  selectConversation: async (conversation) => {
    // Don't abort — let the stream continue in background.
    // onComplete will save the finished message to savedPartialMessages
    // since currentConversation will have changed by then.

    if (!conversation) {
      set({ currentConversation: null, messages: [] });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const fullConversation = await conversationsApi.get(conversation.id);
      // Sort messages by id ascending (oldest first)
      const sortedMessages = (fullConversation.messages || []).sort((a, b) => {
        if (a.id && b.id) {
          return a.id - b.id;
        }
        if (a.created_at && b.created_at) {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return 0;
      });

      // After loading messages, check for saved partial
      const savedPartial = get().savedPartialMessages[conversation.id];
      const finalMessages = savedPartial ? [...sortedMessages, savedPartial] : sortedMessages;

      // Clean up the saved partial
      if (savedPartial) {
        set((state) => {
          const { [conversation.id]: _, ...rest } = state.savedPartialMessages;
          return { savedPartialMessages: rest };
        });
      }

      set({
        currentConversation: fullConversation,
        messages: finalMessages,
        isLoading: false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load conversation';
      set({ error: message, isLoading: false });
    }
  },

  createConversation: async (title: string, botId: number) => {
    try {
      const conversation = await conversationsApi.create({ title, bot_id: botId });
      set((state) => ({
        conversations: [conversation, ...state.conversations],
        currentConversation: conversation,
        messages: [],
      }));
      return conversation;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create conversation';
      set({ error: message });
      return null;
    }
  },

  deleteConversation: async (id: number) => {
    try {
      await conversationsApi.delete(id);
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        currentConversation:
          state.currentConversation?.id === id ? null : state.currentConversation,
        messages: state.currentConversation?.id === id ? [] : state.messages,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete conversation';
      set({ error: message });
    }
  },

  sendMessage: async (content: string, conversationId?: number, attachedContent?: string, attachments?: MessageAttachment[]) => {
    const { currentConversation, abortController: existingController, streamingContent, streamingThinking, streamingConversationId } = get();
    const chatHistoryId = conversationId || currentConversation?.id;
    if (!chatHistoryId) {
      return;
    }

    // Abort any existing stream before starting a new one
    if (existingController) {
      // Save partial content before aborting
      if ((streamingContent || streamingThinking) && streamingConversationId) {
        const partialMessage: Message = {
          role: 'assistant',
          sender_role: 'assistant',
          content: streamingContent,
          thinking: streamingThinking || undefined,
          chat_history_id: streamingConversationId,
        };
        // If still viewing same conversation, append to messages directly
        if (streamingConversationId === currentConversation?.id) {
          set((state) => ({ messages: [...state.messages, partialMessage] }));
        } else {
          // Save to cache for when user navigates back
          set((state) => ({
            savedPartialMessages: { ...state.savedPartialMessages, [streamingConversationId]: partialMessage },
          }));
        }
      }
      existingController.abort();
    }

    // Get bot_id from current conversation or selected agent
    const selectedAgent = useAgentStore.getState().selectedAgent;
    const botId = currentConversation?.bot_id || selectedAgent?.id;

    // Combine user message with attached content for LLM
    const contentForLLM = attachedContent
      ? `${attachedContent}\n\n---\n\n${content}`
      : content;

    // Add user message immediately (display version - without file content)
    const userMessage: Message = {
      role: 'user',
      sender_role: 'user',
      content,
      chat_history_id: chatHistoryId,
      attachments,
    };

    const abortController = new AbortController();

    set((state) => ({
      messages: [...state.messages, userMessage],
      isSending: true,
      streamingContent: '',
      streamingThinking: '',
      error: null,
      abortController,
      streamingConversationId: chatHistoryId,
    }));

    let fullContent = '';
    let fullThinking = '';

    await chatApi.sendMessage(
      {
        content: contentForLLM,
        chat_history_id: chatHistoryId,
        bot_id: botId,
        streaming: true,
      },
      (delta, type) => {
        // Ignore deltas if another stream has taken over
        if (get().streamingConversationId !== chatHistoryId) return;
        if (type === 'thinking') {
          fullThinking += delta;
          set({ streamingThinking: fullThinking });
        } else {
          fullContent += delta;
          set({ streamingContent: fullContent });
        }
      },
      () => {
        // Abort edilmiş ve artık aktif stream değilse, aborter zaten partial'ı kaydetti — skip
        if (abortController.signal.aborted && get().streamingConversationId !== chatHistoryId) return;

        const isStillActiveStream = get().streamingConversationId === chatHistoryId;
        // Complete - add assistant message if we have content
        if (fullContent || fullThinking) {
          const assistantMessage: Message = {
            role: 'assistant',
            sender_role: 'assistant',
            content: fullContent,
            thinking: fullThinking || undefined,
            chat_history_id: chatHistoryId,
          };
          set((state) => {
            const stillHere = state.currentConversation?.id === chatHistoryId;
            return {
              messages: stillHere ? [...state.messages, assistantMessage] : state.messages,
              savedPartialMessages: stillHere
                ? state.savedPartialMessages
                : { ...state.savedPartialMessages, [chatHistoryId]: assistantMessage },
              // Only reset streaming state if this is still the active stream
              ...(isStillActiveStream ? {
                isSending: false,
                streamingContent: '',
                streamingThinking: '',
                abortController: null,
                streamingConversationId: null,
              } : {}),
              conversations: bumpConversation(state.conversations, chatHistoryId),
            };
          });
        } else if (isStillActiveStream) {
          set({
            isSending: false,
            streamingContent: '',
            streamingThinking: '',
            abortController: null,
            streamingConversationId: null,
          });
        }
      },
      (error) => {
        // Only reset streaming state if this is still the active stream
        // (another sendMessage may have already started a new stream)
        if (get().streamingConversationId !== chatHistoryId) return;
        set({
          error: error.message,
          isSending: false,
          streamingContent: '',
          streamingThinking: '',
          abortController: null,
          streamingConversationId: null,
        });
      },
      abortController.signal
    );
  },

  stopStreaming: () => {
    const { abortController, streamingContent, streamingThinking, messages, streamingConversationId, currentConversation } = get();
    if (abortController) {
      abortController.abort();
    }
    if ((streamingContent || streamingThinking) && streamingConversationId === currentConversation?.id) {
      const assistantMessage: Message = {
        role: 'assistant',
        sender_role: 'assistant',
        content: streamingContent,
        thinking: streamingThinking || undefined,
        chat_history_id: streamingConversationId,
      };
      set({
        messages: [...messages, assistantMessage],
        isSending: false,
        streamingContent: '',
        streamingThinking: '',
        abortController: null,
        streamingConversationId: null,
      });
    } else {
      set({
        isSending: false,
        streamingContent: '',
        streamingThinking: '',
        abortController: null,
        streamingConversationId: null,
      });
    }
  },

  clearCurrentConversation: () => {
    const { abortController, streamingContent, streamingThinking, streamingConversationId } = get();
    // Aktif stream varsa partial mesajı kaydet ve abort et
    if (abortController) {
      if ((streamingContent || streamingThinking) && streamingConversationId) {
        const partialMessage: Message = {
          role: 'assistant',
          sender_role: 'assistant',
          content: streamingContent,
          thinking: streamingThinking || undefined,
          chat_history_id: streamingConversationId,
        };
        set((state) => ({
          savedPartialMessages: { ...state.savedPartialMessages, [streamingConversationId]: partialMessage },
        }));
      }
      abortController.abort();
    }
    set({
      currentConversation: null,
      messages: [],
      isSending: false,
      streamingContent: '',
      streamingThinking: '',
      streamingConversationId: null,
      abortController: null,
    });
  },
}));

export default useChatStore;
