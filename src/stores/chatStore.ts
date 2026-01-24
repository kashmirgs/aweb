import { create } from 'zustand';
import type { Conversation, Message } from '../types';
import { conversationsApi, chatApi } from '../api';

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
  sendMessage: (content: string) => Promise<void>;
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
      set({
        currentConversation: fullConversation,
        messages: fullConversation.messages || [],
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

  sendMessage: async (content: string) => {
    const { currentConversation } = get();
    if (!currentConversation) return;

    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      content,
      chat_history_id: currentConversation.id,
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
        chat_history_id: currentConversation.id,
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
          content: fullContent,
          chat_history_id: currentConversation.id,
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
