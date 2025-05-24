
import { 
  getMediaUrlsFromEvent, 
  getMediaItemsFromEvent,
  getFirstImageUrlFromEvent,
  isValidMediaUrl,
  isImageUrl,
  isVideoUrl,
  extractMediaUrls,
  extractFirstImageUrl
} from '../media-extraction';

describe('Media URL Extraction', () => {
  test('should extract image URLs from content', () => {
    const content = 'Check out this image: https://example.com/image.jpg and this one https://example.com/photo.png';
    
    const urls = extractMediaUrls(content);
    
    expect(urls).toContain('https://example.com/image.jpg');
    expect(urls).toContain('https://example.com/photo.png');
    expect(urls.length).toBe(2);
  });
  
  test('should extract URLs from image tags', () => {
    const content = 'Post with tags';
    const tags = [
      ['image', 'https://example.com/tagged-image.jpg'],
      ['img', 'https://example.com/another-image.png']
    ];
    
    const event = { content, tags, id: '123', pubkey: '456', kind: 1, created_at: 123, sig: '789' };
    const urls = getMediaUrlsFromEvent(event);
    
    expect(urls).toContain('https://example.com/tagged-image.jpg');
    expect(urls).toContain('https://example.com/another-image.png');
    expect(urls.length).toBe(2);
  });
  
  test('should combine URLs from content and tags without duplicates', () => {
    const content = 'Image in content: https://example.com/image.jpg';
    const tags = [
      ['image', 'https://example.com/image.jpg'], // Duplicate
      ['img', 'https://example.com/unique.png']
    ];
    
    const event = { content, tags, id: '123', pubkey: '456', kind: 1, created_at: 123, sig: '789' };
    const urls = getMediaUrlsFromEvent(event);
    
    expect(urls).toContain('https://example.com/image.jpg');
    expect(urls).toContain('https://example.com/unique.png');
    expect(urls.length).toBe(2); // No duplicates
  });
  
  test('getFirstImageUrlFromEvent should return the first image URL or null', () => {
    const contentWithImage = 'Here is an image: https://example.com/first.jpg and https://example.com/second.jpg';
    const contentWithoutImage = 'No image here';
    
    expect(extractFirstImageUrl(contentWithImage)).toBe('https://example.com/first.jpg');
    expect(extractFirstImageUrl(contentWithoutImage)).toBe(null);
    
    const event = { content: '', tags: [['image', 'https://example.com/tagged.jpg']], id: '123', pubkey: '456', kind: 1, created_at: 123, sig: '789' };
    expect(getFirstImageUrlFromEvent(event)).toBe('https://example.com/tagged.jpg');
  });
});

describe('Media URL Validation', () => {
  test('should validate image URLs', () => {
    expect(isImageUrl('https://example.com/image.jpg')).toBe(true);
    expect(isImageUrl('https://example.com/image.jpeg')).toBe(true);
    expect(isImageUrl('https://example.com/image.png')).toBe(true);
    expect(isImageUrl('https://example.com/image.gif')).toBe(true);
    expect(isImageUrl('https://example.com/image.webp')).toBe(true);
    expect(isImageUrl('not a url')).toBe(false);
  });
  
  test('should validate video URLs', () => {
    expect(isVideoUrl('https://example.com/video.mp4')).toBe(true);
    expect(isVideoUrl('https://example.com/video.webm')).toBe(true);
    expect(isVideoUrl('https://example.com/video.mov')).toBe(true);
    expect(isVideoUrl('https://example.com/image.jpg')).toBe(false);
    expect(isVideoUrl('not a url')).toBe(false);
  });
  
  test('should validate generic media URLs', () => {
    expect(isValidMediaUrl('https://example.com/image.jpg')).toBe(true);
    expect(isValidMediaUrl('https://example.com/video.mp4')).toBe(true);
    expect(isValidMediaUrl('https://example.com/document.txt')).toBe(true);
    expect(isValidMediaUrl('')).toBe(false);
    expect(isValidMediaUrl('not a url')).toBe(false);
  });
});
