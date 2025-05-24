/**
 * Utility functions for detecting media URLs in text
 * Following NIP-94 recommendations for media content
 */

// Keep a cache of parsed URLs to avoid redundant regex operations
const urlParseCache = new Map<string, string[]>();

/**
 * Regular expressions for detecting different types of media URLs
 */
export const mediaRegex = {
  // Image URLs (jpg, jpeg, png, gif, webp)
  image: /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?)/gi,
  // Video URLs (mp4, webm, mov)
  video: /(https?:\/\/[^\s]+\.(mp4|webm|mov)(\?[^\s]*)?)/gi,
  // Audio URLs (mp3, wav, ogg)
  audio: /(https?:\/\/[^\s]+\.(mp3|wav|ogg)(\?[^\s]*)?)/gi,
  // General URLs - lower priority, used as fallback
  url: /(https?:\/\/[^\s]+)/gi
};

/**
 * Gets base URL without query parameters
 * Used for URL deduplication
 */
export const getBaseUrl = (url: string): string => {
  try {
    // Remove query parameters and hash
    return url.split('?')[0].split('#')[0];
  } catch (e) {
    return url;
  }
};

/**
 * Extracts media URLs from content text
 */
export const extractUrlsFromContent = (content: string): string[] => {
  if (!content) return [];

  // Check cache first
  const cacheKey = `media-${content}`;
  if (urlParseCache.has(cacheKey)) {
    return urlParseCache.get(cacheKey) || [];
  }

  const urls: string[] = [];
  const seenBaseUrls = new Set<string>();
  
  // Extract image URLs
  let match;
  const combinedRegex = new RegExp(
    mediaRegex.image.source + '|' + 
    mediaRegex.video.source + '|' + 
    mediaRegex.audio.source,
    'gi'
  );
  
  try {
    while ((match = combinedRegex.exec(content)) !== null) {
      if (match[0]) {
        const baseUrl = getBaseUrl(match[0]);
        
        // Only add if we haven't seen this base URL before
        if (!seenBaseUrls.has(baseUrl)) {
          urls.push(match[0]);
          seenBaseUrls.add(baseUrl);
        }
      }
    }
  } catch (error) {
    console.error("Error extracting URLs from content:", error);
  }
  
  // Store in cache
  urlParseCache.set(cacheKey, urls);
  
  return urls;
};

/**
 * Extracts all URLs from content text, including regular links
 */
export const extractAllUrls = (content: string): string[] => {
  if (!content) return [];
  
  // Check cache first
  const cacheKey = `all-${content}`;
  if (urlParseCache.has(cacheKey)) {
    return urlParseCache.get(cacheKey) || [];
  }
  
  const urls: string[] = [];
  const seenBaseUrls = new Set<string>();
  
  // First extract media URLs
  const mediaUrls = extractUrlsFromContent(content);
  mediaUrls.forEach(url => {
    const baseUrl = getBaseUrl(url);
    seenBaseUrls.add(baseUrl);
    urls.push(url);
  });
  
  // Then extract any remaining URLs
  try {
    mediaRegex.url.lastIndex = 0; // Reset the regex state
    let match;
    while ((match = mediaRegex.url.exec(content)) !== null) {
      const url = match[0];
      const baseUrl = getBaseUrl(url);
      
      // Only add if not already added as a media URL
      if (!seenBaseUrls.has(baseUrl)) {
        urls.push(url);
        seenBaseUrls.add(baseUrl);
      }
    }
  } catch (error) {
    console.error("Error extracting URLs from content:", error);
  }
  
  // Store in cache
  urlParseCache.set(cacheKey, urls);
  
  return urls;
};

/**
 * Checks if a URL is a media URL (image, video, audio)
 */
export const isMediaUrl = (url: string): boolean => {
  return !!(url.match(mediaRegex.image) || 
           url.match(mediaRegex.video) || 
           url.match(mediaRegex.audio));
};

/**
 * Extract non-media URLs for link previews
 * Returns an array of URLs that are not media files
 */
export const extractLinkPreviewUrls = (content: string): string[] => {
  if (!content) return [];
  
  // Get all URLs from content
  const allUrls = extractAllUrls(content);
  
  // Filter out media URLs to get only regular links for previews
  return allUrls.filter(url => !isMediaUrl(url));
};
