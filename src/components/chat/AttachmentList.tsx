import { X, FileText, Loader2 } from 'lucide-react';
import { useAttachmentStore } from '../../stores';
import { cn } from '../../lib/utils';
import { formatTokenCount, calculateMaxTokens } from '../../lib/tokenCalculator';

interface AttachmentListProps {
  maxToken?: number;
}

export function AttachmentList({ maxToken = 128000 }: AttachmentListProps) {
  const { attachments, removeAttachment, getTotalTokens, error } = useAttachmentStore();

  if (attachments.length === 0) return null;

  const totalTokens = getTotalTokens();
  const maxAllowed = calculateMaxTokens(maxToken);
  const percentage = Math.min((totalTokens / maxAllowed) * 100, 100);
  const isOverLimit = totalTokens > maxAllowed;

  return (
    <div className="mb-2 space-y-2">
      {/* Token usage bar */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>Token:</span>
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isOverLimit ? 'bg-red-500' : 'bg-primary'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={cn(isOverLimit && 'text-red-500')}>
          {formatTokenCount(totalTokens)} / {formatTokenCount(maxAllowed)}
        </span>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Attachment chips */}
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm',
              attachment.status === 'error'
                ? 'bg-red-50 text-red-700'
                : attachment.status === 'ready'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-gray-50 text-gray-500'
            )}
          >
            {attachment.status === 'parsing' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            <span
              className="max-w-[150px] truncate"
              title={attachment.tokenCount
                ? `~${formatTokenCount(attachment.tokenCount)}/${formatTokenCount(maxAllowed)} token`
                : attachment.error || undefined}
            >
              {attachment.name}
            </span>
            {attachment.status === 'ready' && attachment.tokenCount && (
              <span className="text-xs text-gray-400">
                ({formatTokenCount(attachment.tokenCount)})
              </span>
            )}
            <button
              type="button"
              onClick={() => removeAttachment(attachment.id)}
              className="ml-1 p-0.5 rounded hover:bg-gray-200 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AttachmentList;
