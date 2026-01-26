import { useRef } from 'react';
import { Upload, Trash2, FileText, FileSpreadsheet, File } from 'lucide-react';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { ConfirmModal } from '../../common/Modal';
import { useState } from 'react';
import type { AgentFile } from '../../../types';

interface FilesTabProps {
  files: AgentFile[];
  isLoading: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete: (fileId: number) => Promise<void>;
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

export function FilesTab({ files, isLoading, onUpload, onDelete }: FilesTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<AgentFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        await onUpload(file);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
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

      {files.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Henüz dosya yüklenmedi</p>
          <p className="text-sm text-gray-400 mt-1">
            PDF, DOCX, TXT, XLS, XLSX dosyaları yükleyebilirsiniz
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
