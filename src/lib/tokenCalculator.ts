const CHARS_PER_TOKEN = 4;
const BUFFER_TOKENS = 10240; // 10KB buffer

export function calculateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function calculateMaxTokens(maxToken: number): number {
  return Math.max(0, maxToken - BUFFER_TOKENS);
}

export function isWithinTokenLimit(
  totalTokens: number,
  maxToken: number
): boolean {
  return totalTokens <= calculateMaxTokens(maxToken);
}

export function formatTokenCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
