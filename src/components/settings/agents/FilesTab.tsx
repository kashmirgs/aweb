import { useRef, useState } from 'react';
import { Upload, Trash2, FileText, FileSpreadsheet, File, AlertCircle } from 'lucide-react';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { ConfirmModal } from '../../common/Modal';
import { cn } from '../../../lib/utils';
import type { AgentFile } from '../../../types';

const SUPPORTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx'];

function validateFiles(files: FileList | File[]): { valid: File[]; invalid: string[] } {
  const valid: File[] = [];
  const invalid: string[] = [];

  Array.from(files).forEach(file => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (SUPPORTED_EXTENSIONS.includes(ext)) {
      valid.push(file);
    } else {
      invalid.push(file.name);
    }
  });

  return { valid, invalid };
}

interface FilesTabProps {
  files: AgentFile[];
  isLoading: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete: (fileId: number) => Promise<void>;
  onUploadComplete?: () => Promise<void>;
}

function getFileIcon(filename: string, fileType?: string) {
  const type = fileType?.toLowerCase() || filename?.toLowerCase() || '';
  if (type.includes('pdf')) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('xlsx') || type.includes('xls')) {
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  }
  return <File className="h-5 w-5 text-gray-500" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusBadge(status?: string) {
  if (!status) return null;
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus === 'ready' || normalizedStatus === 'completed') {
    return <Badge variant="success">Hazır</Badge>;
  }
  if (normalizedStatus === 'processing' || normalizedStatus === 'indexing') {
    return <Badge variant="warning">İşleniyor</Badge>;
  }
  if (normalizedStatus === 'pending' || normalizedStatus === 'waiting') {
    return <Badge variant="info">Bekliyor</Badge>;
  }
  if (normalizedStatus === 'error' || normalizedStatus === 'failed') {
    return <Badge variant="danger">Hata</Badge>;
  }
  return <Badge variant="default">{status}</Badge>;
}

export function FilesTab({ files, isLoading, onUpload, onDelete, onUploadComplete }: FilesTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<AgentFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFiles = async (fileList: FileList) => {
    const { valid, invalid } = validateFiles(fileList);

    if (invalid.length > 0) {
      setUploadError(`Şu dosyalar desteklenmediği için eklenemedi: ${invalid.join(', ')}`);
    }

    if (valid.length > 0) {
      setIsUploading(true);
      try {
        for (const file of valid) {
          await onUpload(file);
        }
        // Tüm dosyalar yüklendikten sonra indekslemeyi tetikle
        if (onUploadComplete) {
          await onUploadComplete();
        }
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      await handleFiles(fileList);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async () => {
    if (fileToDelete) {
      setIsDeleting(true);
      try {
        await onDelete(fileToDelete.id);
        setDeleteModalOpen(false);
        setFileToDelete(null);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Yüklü Dosyalar</h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
            multiple
            className="hidden"
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            isLoading={isUploading}
          >
            <Upload className="h-4 w-4" />
            Dosya Yükle
          </Button>
        </div>
      </div>

      {uploadError && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p>{uploadError}</p>
            <button
              onClick={() => setUploadError(null)}
              className="text-amber-600 hover:text-amber-700 underline mt-1"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {files.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "text-center py-12 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-gray-400"
          )}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {isDragging ? "Dosyaları buraya bırakın" : "Dosyaları sürükleyip bırakın"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            veya <span className="text-primary">dosya seçmek için tıklayın</span>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            PDF, DOCX, TXT, XLS, XLSX (Maks. 50MB)
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {getFileIcon(file.filename || file.name || '', file.file_type || file.type)}
                <div>
                  <p className="font-medium text-gray-900">{file.filename || file.name || 'Dosya'}</p>
                  <p className="text-sm text-gray-500">
                    {file.file_size ? formatFileSize(file.file_size) : (file.size ? formatFileSize(file.size) : '')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {getStatusBadge(file.status)}
                <button
                  onClick={() => {
                    setFileToDelete(file);
                    setDeleteModalOpen(true);
                  }}
                  className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title="Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setFileToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Dosyayı Sil"
        message={`"${fileToDelete?.filename || fileToDelete?.name || 'Dosya'}" dosyasını silmek istediğinizden emin misiniz?`}
        confirmText="Sil"
        cancelText="İptal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default FilesTab;
