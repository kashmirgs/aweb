import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

export function groupConversationsByDate<T extends { created_at: string }>(
  conversations: T[]
): { label: string; items: T[] }[] {
  const groups: { [key: string]: T[] } = {};

  conversations.forEach((conv) => {
    const label = formatDate(conv.created_at);
    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(conv);
  });

  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}
