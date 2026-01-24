import { cn } from '../../lib/utils';
import { User } from 'lucide-react';

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
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          'rounded-full object-cover bg-gray-200',
          sizes[size],
          className
        )}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
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
