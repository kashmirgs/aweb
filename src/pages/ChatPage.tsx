import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChatContainer } from '../components/chat';
import { useAgentStore, useChatStore } from '../stores';

export function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedAgent, getAgentById, selectAgent, fetchAgents } = useAgentStore();
  const { currentConversation, selectConversation } = useChatStore();
  const conversations = useChatStore((state) => state.conversations);

  // Initialization guard - prevent multiple runs and premature redirects
  const initRef = useRef<{ attempted: boolean; inProgress: boolean }>({
    attempted: false,
    inProgress: false
  });

  // Route state'ten gelen bilgiler - değerleri stable tutmak için primitive olarak oku
  const routeAgentId = (location.state as { agentId?: number } | null)?.agentId;
  const routeConversationId = (location.state as { conversationId?: number } | null)?.conversationId;

  useEffect(() => {
    const initializeAgent = async () => {
      // Agent zaten seçiliyse, başka bir şey yapmaya gerek yok
      if (selectedAgent) {
        initRef.current.attempted = true;
        return;
      }

      // Zaten initialization yapılıyorsa, tekrar başlatma
      if (initRef.current.inProgress) {
        return;
      }

      initRef.current.inProgress = true;

      try {
        // 1. Route state'ten agent yüklemeyi dene
        if (routeAgentId) {
          let agent = getAgentById(routeAgentId);
          if (!agent) {
            await fetchAgents();
            agent = getAgentById(routeAgentId);
          }
          if (agent) {
            selectAgent(agent);

            // Conversation da yükle (eğer yoksa)
            if (!currentConversation && routeConversationId) {
              const conv = conversations.find(c => c.id === routeConversationId);
              if (conv) {
                await selectConversation(conv);
              }
            }
            initRef.current.attempted = true;
            initRef.current.inProgress = false;
            return;
          }
        }

        // 2. currentConversation'dan agent bulmayı dene
        if (currentConversation?.bot_id) {
          let agent = getAgentById(currentConversation.bot_id);
          if (!agent) {
            await fetchAgents();
            agent = getAgentById(currentConversation.bot_id);
          }
          if (agent) {
            selectAgent(agent);
            initRef.current.attempted = true;
            initRef.current.inProgress = false;
            return;
          }
        }

        // 3. Hiçbir şey bulunamadı - redirect yap
        initRef.current.attempted = true;
        initRef.current.inProgress = false;
        navigate('/', { replace: true });

      } catch (error) {
        console.error('ChatPage initialization failed:', error);
        initRef.current.inProgress = false;
        navigate('/', { replace: true });
      }
    };

    initializeAgent();
  }, [selectedAgent, currentConversation, routeAgentId, routeConversationId,
      getAgentById, selectAgent, fetchAgents, navigate, conversations, selectConversation]);

  // Agent yüklenirken loading göster
  if (!selectedAgent) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <ChatContainer />;
}

export default ChatPage;
