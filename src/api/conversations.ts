import apiClient from './client';
import type { Conversation, CreateConversationRequest, Message, MessageAttachment } from '../types';

// Extract file extension and determine type
function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const typeMap: Record<string, string> = {
    'pdf': 'pdf',
    'doc': 'docx',
    'docx': 'docx',
    'xls': 'xlsx',
    'xlsx': 'xlsx',
    'csv': 'csv',
    'txt': 'txt',
    'json': 'json',
    'md': 'md',
    'png': 'png',
    'jpg': 'jpg',
    'jpeg': 'jpg',
  };
  return typeMap[ext] || 'unknown';
}

// Parse attachments from content string (format: <!--ATTACHMENT_START-->[Dosya: filename]...<!--ATTACHMENT_END-->)
function parseAttachmentsFromContent(content: string): MessageAttachment[] {
  const attachments: MessageAttachment[] = [];

  // Match [Dosya: filename] pattern within ATTACHMENT markers
  const attachmentRegex = /<!--ATTACHMENT_START-->\s*\[Dosya:\s*([^\]]+)\]/g;
  let match;

  while ((match = attachmentRegex.exec(content)) !== null) {
    const filename = match[1].trim();
    if (filename) {
      attachments.push({
        id: crypto.randomUUID(),
        name: filename,
        type: getFileType(filename) as any,
      });
    }
  }

  return attachments;
}

// Normalize attachment from API response to frontend expected format
function normalizeAttachment(att: any): MessageAttachment | null {
  if (!att) return null;

  const name = att.name || att.filename || att.file_name || att.fileName;
  if (!name) return null; // Skip attachments without a name

  return {
    id: String(att.id || att.attachment_id || att.file_id || crypto.randomUUID()),
    name: name,
    type: att.type || att.file_type || att.fileType || att.mime_type || 'unknown',
    tokenCount: att.tokenCount || att.token_count || att.tokens
  };
}

// Normalize message attachments from API response
function normalizeMessageAttachments(message: any): Message {
  // First try to get attachments from dedicated fields
  const existingAttachments = message.attachments || message.files || message.attached_files;

  let attachments: MessageAttachment[] = [];

  if (Array.isArray(existingAttachments) && existingAttachments.length > 0) {
    // Use existing attachments array
    attachments = existingAttachments.map(normalizeAttachment).filter(Boolean) as MessageAttachment[];
  } else if (message.content && typeof message.content === 'string') {
    // Try to parse attachments from content string
    attachments = parseAttachmentsFromContent(message.content);
  }

  return {
    ...message,
    attachments: attachments.length > 0 ? attachments : undefined
  };
}

export const conversationsApi = {
  async list(): Promise<Conversation[]> {
    const response = await apiClient.get<Conversation[]>('/chat_history');
    return response.data;
  },

  async get(id: number): Promise<Conversation> {
    const response = await apiClient.get<Conversation>(`/chat_history/${id}`);
    const conversation = response.data;

    // Normalize message attachments from various API formats
    if (conversation.messages && Array.isArray(conversation.messages)) {
      conversation.messages = conversation.messages.map(normalizeMessageAttachments);
    }

    return conversation;
  },

  async create(data: CreateConversationRequest): Promise<Conversation> {
    const response = await apiClient.post<{ chat_history_id: number; title: string; bot_id?: number; created_at?: string }>('/chat_history', data);
    // API returns chat_history_id, map to id for consistency
    return {
      id: response.data.chat_history_id,
      title: response.data.title,
      bot_id: data.bot_id,
      created_at: response.data.created_at || new Date().toISOString(),
    };
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/chat_history/${id}`);
  },

  async update(id: number, data: Partial<CreateConversationRequest>): Promise<Conversation> {
    const response = await apiClient.patch<Conversation>(`/chat_history/${id}`, data);
    return response.data;
  },
};

export default conversationsApi;
