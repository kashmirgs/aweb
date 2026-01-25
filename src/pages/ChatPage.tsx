import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatContainer } from '../components/chat';
import { useAgentStore } from '../stores';

export function ChatPage() {
  const navigate = useNavigate();
  const selectedAgent = useAgentStore((state) => state.selectedAgent);

  useEffect(() => {
    if (!selectedAgent) {
      navigate('/');
    }
  }, [selectedAgent, navigate]);

  if (!selectedAgent) {
    return null;
  }

  return <ChatContainer />;
}

export default ChatPage;
