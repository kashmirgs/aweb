import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { User } from 'lucide-react';
import apiClient from '../../api/client';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fallback?: string;
}

export function Avatar({
  src,
  alt = 'Avatar',
  size = 'md',
  className,
  fallback,
}: AvatarProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  // Fetch image through apiClient if src is an API path
  useEffect(() => {
    let isMounted = true;

    const fetchImage = async () => {
      if (!src) {
        setImageSrc(null);
        setHasError(false);
        return;
      }

      // If src is a relative API path, fetch through apiClient
      if (src.startsWith('/api/')) {
        try {
          const apiPath = src.replace('/api', '');
          const response = await apiClient.get(apiPath, {
            responseType: 'blob',
          });
          if (isMounted && response.data && response.data.size > 0) {
            const blobUrl = URL.createObjectURL(response.data);
            setImageSrc(blobUrl);
            setHasError(false);
          } else if (isMounted) {
            setHasError(true);
          }
        } catch {
          if (isMounted) {
            setHasError(true);
          }
        }
      } else {
        // For non-API URLs (e.g., blob URLs, external URLs), use directly
        setImageSrc(src);
        setHasError(false);
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      // Revoke blob URLs to prevent memory leaks
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src]);

  const showFallback = !imageSrc || hasError;

  if (!showFallback && imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={alt}
        className={cn(
          'rounded-full object-cover bg-gray-200',
          sizes[size],
          className
        )}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary flex items-center justify-center text-white font-medium',
        sizes[size],
        className
      )}
    >
      {fallback ? (
        fallback.slice(0, 2).toUpperCase()
      ) : (
        <User className="h-1/2 w-1/2" />
      )}
    </div>
  );
}

export default Avatar;
