export function escapeMarkdown(text: string): string {
  return text.replace(/([\\`*_{}[\]()#+\-.!|])/g, '\\$1');
}

export function truncateLines(text: string | undefined, maxLines: number): { text: string; truncated: boolean; totalLines: number } {
  if (!text) return { text: '', truncated: false, totalLines: 0 };
  const lines = text.split(/\r?\n/);
  if (lines.length <= maxLines) {
    return { text, truncated: false, totalLines: lines.length };
  }
  return {
    text: lines.slice(0, maxLines).join('\n'),
    truncated: true,
    totalLines: lines.length,
  };
}

export function truncateText(text: string | undefined, maxChars: number): { text: string; truncated: boolean } {
  if (!text) return { text: '', truncated: false };
  if (text.length <= maxChars) return { text, truncated: false };
  return { text: `${text.slice(0, maxChars)}…`, truncated: true };
}

export function fenceCode(text: string): string {
  return '```\n' + text.replace(/```/g, '``\\`') + '\n```';
}
