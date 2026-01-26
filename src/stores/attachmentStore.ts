import { create } from 'zustand';
import type { FileAttachment, AllowedFileType, MessageAttachment } from '../types/attachment';
import { validateFile } from '../lib/fileValidation';
import { parseFile } from '../lib/fileParser';
import { calculateTokens, calculateMaxTokens, isWithinTokenLimit } from '../lib/tokenCalculator';

interface AttachmentState {
  attachments: FileAttachment[];
  isProcessing: boolean;
  error: string | null;

  addFiles: (files: FileList | File[]) => Promise<void>;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  getAttachedContent: () => string;
  getAttachmentMetadata: () => MessageAttachment[];
  getTotalTokens: () => number;
  validateTotalSize: (maxToken: number) => { valid: boolean; error?: string };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useAttachmentStore = create<AttachmentState>((set, get) => ({
  attachments: [],
  isProcessing: false,
  error: null,

  addFiles: async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    set({ isProcessing: true, error: null });

    for (const file of fileArray) {
      const validation = validateFile(file);

      if (!validation.valid) {
        set((_state) => ({ error: validation.error }));
        continue;
      }

      const attachment: FileAttachment = {
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        type: validation.fileType as AllowedFileType,
        status: 'pending',
      };

      // Add to state as pending
      set((state) => ({
        attachments: [...state.attachments, attachment],
      }));

      // Start parsing
      set((state) => ({
        attachments: state.attachments.map((a) =>
          a.id === attachment.id ? { ...a, status: 'parsing' as const } : a
        ),
      }));

      try {
        const extractedText = await parseFile(file, validation.fileType as AllowedFileType);
        const tokenCount = calculateTokens(extractedText);

        set((state) => ({
          attachments: state.attachments.map((a) =>
            a.id === attachment.id
              ? { ...a, status: 'ready' as const, extractedText, tokenCount }
              : a
          ),
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Dosya işlenemedi';
        set((state) => ({
          attachments: state.attachments.map((a) =>
            a.id === attachment.id
              ? { ...a, status: 'error' as const, error: errorMessage }
              : a
          ),
        }));
      }
    }

    set({ isProcessing: false });
  },

  removeAttachment: (id: string) => {
    set((state) => ({
      attachments: state.attachments.filter((a) => a.id !== id),
      error: null,
    }));
  },

  clearAttachments: () => {
    set({ attachments: [], error: null });
  },

  getAttachedContent: () => {
    const { attachments } = get();
    const readyAttachments = attachments.filter((a) => a.status === 'ready' && a.extractedText);

    if (readyAttachments.length === 0) return '';

    const content = readyAttachments
      .map((a) => `[Dosya: ${a.name}]\n${a.extractedText}`)
      .join('\n\n---\n\n');

    return `<!--ATTACHMENT_START-->\n${content}\n<!--ATTACHMENT_END-->`;
  },

  getAttachmentMetadata: () => {
    const { attachments } = get();
    return attachments
      .filter((a) => a.status === 'ready')
      .map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        tokenCount: a.tokenCount,
      }));
  },

  getTotalTokens: () => {
    const { attachments } = get();
    return attachments
      .filter((a) => a.status === 'ready' && a.tokenCount)
      .reduce((sum, a) => sum + (a.tokenCount || 0), 0);
  },

  validateTotalSize: (maxToken: number) => {
    const totalTokens = get().getTotalTokens();
    const maxAllowed = calculateMaxTokens(maxToken);

    if (!isWithinTokenLimit(totalTokens, maxToken)) {
      return {
        valid: false,
        error: `Token limiti aşıldı: ${totalTokens.toLocaleString()} / ${maxAllowed.toLocaleString()}`,
      };
    }

    return { valid: true };
  },
}));

export default useAttachmentStore;
