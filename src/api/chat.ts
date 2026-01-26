import type { SendMessageRequest } from '../types';
import { API_BASE_URL } from '../config/api';

export const chatApi = {
  async sendMessage(
    data: SendMessageRequest,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          streaming: true,
        }),
        signal: abortSignal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onComplete();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });

        // Check if it's SSE format or raw text
        if (chunk.startsWith('data: ')) {
          // SSE format
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                onComplete();
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  onChunk(parsed.content);
                }
              } catch {
                if (data.trim()) {
                  onChunk(data);
                }
              }
            }
          }
        } else {
          // Raw text streaming - send chunk directly
          if (chunk) {
            onChunk(chunk);
          }
        }
      }
    } catch (error) {
      // Don't report abort as an error
      if (error instanceof Error && error.name === 'AbortError') {
        onComplete();
        return;
      }
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  },

  async sendMessageNonStreaming(data: SendMessageRequest): Promise<{ content: string }> {
    const token = localStorage.getItem('access_token');

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...data,
        streaming: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};

export default chatApi;
