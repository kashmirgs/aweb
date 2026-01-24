import { create } from 'zustand';
import type { Conversation, Message } from '../types';
import { conversationsApi, chatApi } from '../api';
import { useAgentStore } from './agentStore';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  streamingContent: string;
  error: string | null;

  fetchConversations: () => Promise<void>;
  selectConversation: (conversation: Conversation | null) => Promise<void>;
  createConversation: (title: string, botId: number) => Promise<Conversation | null>;
  deleteConversation: (id: number) => Promise<void>;
  sendMessage: (content: string, conversationId?: number) => Promise<void>;
  clearCurrentConversation: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  isSending: false,
  streamingContent: '',
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const conversations = await conversationsApi.list();
      // Sort by created_at descending
      conversations.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      set({ conversations, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch conversations';
      set({ error: message, isLoading: false });
    }
  },

  selectConversation: async (conversation) => {
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
      set({
        currentConversation: fullConversation,
        messages: sortedMessages,
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

  sendMessage: async (content: string, conversationId?: number) => {
    const { currentConversation } = get();
    const chatHistoryId = conversationId || currentConversation?.id;
    if (!chatHistoryId) {
      return;
    }

    // Get bot_id from current conversation or selected agent
    const selectedAgent = useAgentStore.getState().selectedAgent;
    const botId = currentConversation?.bot_id || selectedAgent?.id;

    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      sender_role: 'user',
      content,
      chat_history_id: chatHistoryId,
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isSending: true,
      streamingContent: '',
      error: null,
    }));

    let fullContent = '';

    await chatApi.sendMessage(
      {
        content,
        chat_history_id: chatHistoryId,
        bot_id: botId,
        streaming: true,
      },
      (chunk) => {
        fullContent += chunk;
        set({ streamingContent: fullContent });
      },
      () => {
        // Complete - add assistant message
        const assistantMessage: Message = {
          role: 'assistant',
          sender_role: 'assistant',
          content: fullContent,
          chat_history_id: chatHistoryId,
        };
        set((state) => ({
          messages: [...state.messages, assistantMessage],
          isSending: false,
          streamingContent: '',
        }));
      },
      (error) => {
        set({
          error: error.message,
          isSending: false,
          streamingContent: '',
        });
      }
    );
  },

  clearCurrentConversation: () => {
    set({ currentConversation: null, messages: [], streamingContent: '' });
  },
}));

export default useChatStore;
