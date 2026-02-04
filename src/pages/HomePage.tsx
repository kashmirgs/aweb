import { useNavigate } from 'react-router-dom';
import { AgentCard } from '../components/home';
import { useAuthStore, useAgentStore } from '../stores';
import type { Agent } from '../types';

export function HomePage() {
  const navigate = useNavigate();
  useAuthStore();
  const { agents, selectAgent, getAgentImageUrl } = useAgentStore();

  // Filter to show only interactive agents
  const interactiveAgents = agents.filter((agent: Agent) => agent.interactive !== false);

  const handleAgentClick = (agent: Agent) => {
    selectAgent(agent);
    navigate('/chat');
  };

  return (
    <div className="flex-1 flex flex-col items-center p-6 overflow-auto">
      <div className="w-full max-w-2xl my-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-dark mb-2">
            Merhaba,
          </h1>
          <p className="text-gray-500">
            Destek almak istediğiniz ajanı seçerek sohbete başlayın.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {interactiveAgents.map((agent: Agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              imageUrl={getAgentImageUrl(agent.id)}
              onClick={() => handleAgentClick(agent)}
            />
          ))}
        </div>

        {interactiveAgents.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>Şu anda kullanılabilir ajan yok.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
