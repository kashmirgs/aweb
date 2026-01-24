import { cn } from '../../lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export function Logo({ className, variant = 'dark' }: LogoProps) {
  return (
    <img
      src="/logo.svg"
      alt="UpperMind"
      className={cn(
        'h-8 w-auto',
        variant === 'light' && 'filter brightness-0 invert',
        className
      )}
    />
  );
}

export default Logo;
