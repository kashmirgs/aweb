import type { SendMessageRequest } from '../types';
import { API_BASE_URL } from '../config/api';

export const chatApi = {
  async sendMessage(
    data: SendMessageRequest,
    onChunk: (delta: string, type: 'thinking' | 'content') => void,
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
      let buffer = '';

      const processJsonObjects = (text: string) => {
        buffer += text;
        // Extract complete JSON objects from buffer
        let startIndex = 0;
        while (startIndex < buffer.length) {
          const braceStart = buffer.indexOf('{', startIndex);
          if (braceStart === -1) break;

          // Try progressively larger substrings to find complete JSON
          let found = false;
          for (let endIndex = braceStart + 1; endIndex <= buffer.length; endIndex++) {
            if (buffer[endIndex - 1] !== '}') continue;
            const candidate = buffer.slice(braceStart, endIndex);
            try {
              const parsed = JSON.parse(candidate);
              if (parsed.delta !== undefined && parsed.type) {
                onChunk(parsed.delta, parsed.type);
              }
              startIndex = endIndex;
              found = true;
              break;
            } catch {
              // Not yet a complete JSON object, keep trying
            }
          }
          if (!found) {
            // Incomplete JSON at end of buffer - keep it
            buffer = buffer.slice(braceStart);
            return;
          }
        }
        buffer = '';
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onComplete();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });

        // Check if it's SSE format or raw JSON
        if (chunk.includes('data: ')) {
          // SSE format
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const sseData = line.slice(6);
              if (sseData === '[DONE]') {
                onComplete();
                return;
              }
              processJsonObjects(sseData);
            }
          }
        } else {
          // Raw streaming - parse JSON objects from chunk
          processJsonObjects(chunk);
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
