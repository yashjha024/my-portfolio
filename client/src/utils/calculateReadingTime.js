/**
 * Calculate estimated reading time and word count for Markdown / Text content.
 * Average reading speed is ~200-220 words per minute.
 */
export const calculateReadingTime = (text = '') => {
  if (!text || typeof text !== 'string') {
    return { minutes: 1, words: 0, text: '1 min read' };
  }

  // Strip Markdown syntax (`#`, `*`, `[]()`, code block backticks)
  const cleanText = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/#+\s/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`>|-]/g, ' ')
    .trim();

  const words = cleanText.split(/\s+/).filter((word) => word.length > 0).length;
  const minutes = Math.max(1, Math.ceil(words / 210));

  return {
    minutes,
    words,
    text: `${minutes} min read`,
  };
};
