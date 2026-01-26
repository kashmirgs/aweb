import { useRef } from 'react';
import { Paperclip } from 'lucide-react';
import { useAttachmentStore } from '../../stores';
import { ALLOWED_EXTENSIONS } from '../../types/attachment';
import { cn } from '../../lib/utils';

interface FileAttachmentButtonProps {
  disabled?: boolean;
}

export function FileAttachmentButton({ disabled }: FileAttachmentButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addFiles, isProcessing } = useAttachmentStore();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await addFiles(files);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const acceptTypes = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',');

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptTypes}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={cn(
          'p-2 rounded-lg transition-colors',
          disabled || isProcessing
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
        )}
        title="Dosya ekle"
      >
        <Paperclip className="h-5 w-5" />
      </button>
    </>
  );
}

export default FileAttachmentButton;
