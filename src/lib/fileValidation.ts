import { ALLOWED_EXTENSIONS, MIME_TYPES, type AllowedFileType } from '../types/attachment';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
  fileType?: AllowedFileType;
}

export function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

export function isAllowedExtension(extension: string): extension is AllowedFileType {
  return ALLOWED_EXTENSIONS.includes(extension as AllowedFileType);
}

export function validateFile(file: File): ValidationResult {
  const extension = getFileExtension(file.name);

  // Check extension
  if (!isAllowedExtension(extension)) {
    return {
      valid: false,
      error: `Desteklenmeyen dosya tipi: .${extension}. Desteklenen tipler: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  // Check MIME type
  const allowedMimes = MIME_TYPES[extension];
  if (!allowedMimes.includes(file.type) && file.type !== '') {
    // Some browsers don't set MIME type, so allow empty
    return {
      valid: false,
      error: `Geçersiz dosya formatı: ${file.name}`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Dosya çok büyük: ${file.name}. Maksimum boyut: 50MB`,
    };
  }

  return {
    valid: true,
    fileType: extension,
  };
}

export function validateFiles(files: FileList | File[]): ValidationResult[] {
  return Array.from(files).map(validateFile);
}
