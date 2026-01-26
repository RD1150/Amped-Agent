/**
 * Utility functions for cleaning and formatting LLM-generated posts
 */

/**
 * Cleans markdown syntax from post content
 * - Removes **bold** markers
 * - Removes ## headers
 * - Fixes escaped hashtags (\# → #)
 * - Preserves line breaks
 */
export function cleanMarkdown(text: string): string {
  return text
    // Remove bold markers
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove header markers
    .replace(/^##+ /gm, '')
    // Fix escaped hashtags
    .replace(/\\#/g, '#')
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Parses LLM output that contains multiple post variations
 * Returns array of individual posts
 */
export function parsePostVariations(content: string): string[] {
  const variations: string[] = [];
  
  // Split by variation markers (e.g., "## 1.", "## 2.", etc.)
  const parts = content.split(/^##+ \d+\./gm);
  
  // If no variations found, return the whole content as one post
  if (parts.length <= 1) {
    return [cleanMarkdown(content)];
  }
  
  // Skip the first part (usually intro text) and process variations
  for (let i = 1; i < parts.length; i++) {
    const variation = parts[i].trim();
    if (variation) {
      variations.push(cleanMarkdown(variation));
    }
  }
  
  return variations.length > 0 ? variations : [cleanMarkdown(content)];
}

/**
 * Extracts the first clean post from LLM output
 */
export function getFirstPost(content: string): string {
  const variations = parsePostVariations(content);
  return variations[0] || cleanMarkdown(content);
}

/**
 * Formats post for display with proper line breaks
 */
export function formatPostForDisplay(post: string): string {
  return post
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n\n');
}
