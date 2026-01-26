export interface FileAttachment {
  id: string;
  file: File;
  name: string;
  size: number;
  type: AllowedFileType;
  status: 'pending' | 'parsing' | 'ready' | 'error';
  extractedText?: string;
  tokenCount?: number;
  error?: string;
}

export type AllowedFileType = 'pdf' | 'docx' | 'doc' | 'txt' | 'xls' | 'xlsx';

export const ALLOWED_EXTENSIONS: AllowedFileType[] = ['pdf', 'docx', 'doc', 'txt', 'xls', 'xlsx'];

export const MIME_TYPES: Record<AllowedFileType, string[]> = {
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  doc: ['application/msword'],
  txt: ['text/plain'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

export interface MessageAttachment {
  id: string;
  name: string;
  type: AllowedFileType;
  tokenCount?: number;
}
