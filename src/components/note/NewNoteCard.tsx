import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { NostrEvent } from '@/lib/nostr';
import { MessageSquare, Heart, Repeat, Share, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNoteCard } from './hooks/useNoteCard';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

export interface ProfileData {
  picture?: string;
  displayName?: string;
  username?: string;
  // Add other expected fields here as needed
  [key: string]: unknown;
}

interface NewNoteCardProps {
  event: NostrEvent;
  profileData?: ProfileData;
  className?: string;
  onMediaLoad?: () => void;
}

// Lazy loading avatar component
const LazyAvatar: React.FC<{
  src?: string;
  alt: string;
  fallback: string;
  className?: string;
}> = React.memo(({ src, alt, fallback, className }) => {
  const [isInView, setIsInView] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Start loading 50px before entering viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef}>
      <Avatar className={className}>
        {isInView && src ? (
          <AvatarImage 
            src={src} 
            alt={alt}
            onLoad={() => setImageLoaded(true)}
            style={{ 
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.2s ease-in-out'
            }}
          />
        ) : null}
        <AvatarFallback>
          {fallback}
        </AvatarFallback>
      </Avatar>
    </div>
  );
});

LazyAvatar.displayName = 'LazyAvatar';

const NewNoteCard: React.FC<NewNoteCardProps> = ({ 
  event, 
  profileData,
  className,
  onMediaLoad
}) => {
  // Use consolidated hook that follows proper data flow architecture
  const noteCard = useNoteCard({ event, profileData });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mediaLoaded, setMediaLoaded] = useState<number>(0);
  const totalMedia = noteCard.mediaUrls ? noteCard.mediaUrls.filter((url: string) => url.match(/\.(jpeg|jpg|png|gif|webp|mp4|webm|ogg|mov|m4v|avi)$/i)).length : 0;

  useEffect(() => {
    if (totalMedia > 0 && mediaLoaded === totalMedia) {
      if (onMediaLoad) onMediaLoad();
    }
    // Also call after a short delay to catch late layout changes
    if (onMediaLoad) {
      const timeout = setTimeout(() => onMediaLoad(), 500);
      return () => clearTimeout(timeout);
    }
  }, [mediaLoaded, totalMedia, onMediaLoad]);

  // Helper to style hashtags in content as badges
  function styleHashtagsInContent(html: string) {
    // Regex to match hashtags (not inside HTML tags)
    return html.replace(/(^|\s)(#\w+)/g, (match, pre, tag) => {
      return `${pre}<span class='inline-block bg-blue-900/20 dark:bg-blue-400/10 text-blue-600 dark:text-blue-300 font-semibold rounded-full px-2 py-0.5 text-xs mx-0.5 align-middle'>${tag}</span>`;
    });
  }

  if (!event || !event.id || !event.pubkey || !noteCard) return null;
  
  // Deduplicate hashtags for display
  const uniqueHashtags = Array.from(new Set(noteCard.hashtags));

  // Find hashtags that are NOT already present in the formatted content (case-insensitive)
  const hashtagsInContent = new Set();
  if (noteCard.formattedContent) {
    const matches = noteCard.formattedContent.match(/#(\w+)/g);
    if (matches) {
      matches.forEach(tag => hashtagsInContent.add(tag.replace('#', '').toLowerCase()));
    }
  }
  const hashtagsToShow = uniqueHashtags.filter(tag => !hashtagsInContent.has(tag.toLowerCase()));

  return (
    <div className="w-full">
      <Card className={cn("overflow-visible transition-colors duration-200 flex flex-col", className)}>
        <CardContent className="p-4 flex flex-col">
          <div className="flex gap-3">
            {/* Optimized Avatar section with lazy loading */}
            <div>
              <Link to={noteCard.profileUrl}>
                <LazyAvatar
                  src={profileData?.picture}
                  alt={noteCard.displayName}
                  fallback={noteCard.displayName.charAt(0).toUpperCase()}
                  className="h-10 w-10"
                />
              </Link>
            </div>
            {/* Content section */}
            <div className="space-y-2 min-w-0 flex flex-col">
              {/* Header with name, username, time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Link to={noteCard.profileUrl} className="font-medium hover:underline truncate">
                    {noteCard.displayName}
                  </Link>
                  {noteCard.username && (
                    <span className="text-muted-foreground text-sm hidden sm:inline truncate">
                      {noteCard.username}
                    </span>
                  )}
                  <span className="text-muted-foreground text-sm flex-shrink-0">
                    · {noteCard.formattedTime}
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              {/* Post content - flexible height */}
              <div>
                <Link to={noteCard.postUrl} className="block">
                  <div 
                    className="whitespace-pre-wrap break-words text-sm leading-relaxed mb-2 -webkit-box"
                    dangerouslySetInnerHTML={{ 
                      __html: styleHashtagsInContent(noteCard.formattedContent)
                    }}
                  />
                  {/* Media section: render images, videos, YouTube, Twitter, SoundCloud if present */}
                  {noteCard.mediaUrls && noteCard.mediaUrls.length > 0 && (
                    <>
                      <div className="mt-3 flex flex-wrap gap-3">
                        {noteCard.mediaUrls.map((url: string, idx: number) => {
                          if (url.match(/\.(jpeg|jpg|png|gif|webp)$/i)) {
                            return (
                              <img
                                key={idx}
                                src={url}
                                alt="media"
                                className="rounded-xl w-full max-h-[500px] object-contain bg-black/10 p-2 shadow border border-border cursor-pointer"
                                loading="lazy"
                                onLoad={() => {
                                  setMediaLoaded((c) => c + 1);
                                  if (onMediaLoad) onMediaLoad();
                                }}
                                onClick={() => {
                                  setLightboxIndex(idx);
                                  setLightboxOpen(true);
                                }}
                              />
                            );
                          }
                          else if (url.match(/\.(mp4|webm|ogg|mov|m4v|avi)$/i)) {
                            return (
                              <video
                                key={idx}
                                src={url}
                                controls
                                autoPlay
                                muted
                                playsInline
                                className="rounded-xl w-full max-h-[500px] object-contain bg-black/10 p-2 shadow border border-border"
                                preload="none"
                                onLoadedData={() => {
                                  setMediaLoaded((c) => c + 1);
                                  if (onMediaLoad) onMediaLoad();
                                }}
                              />
                            );
                          } else if (url.match(/(youtube.com|youtu.be)/i)) {
                            // Basic YouTube embed
                            const videoId = url.match(/(?:v=|youtu.be\/)([\w-]+)/)?.[1];
                            if (videoId) {
                              return (
                                <div key={idx} className="w-full aspect-video rounded-xl overflow-hidden shadow border border-border bg-background flex justify-center items-center">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title="YouTube video"
                                  />
                                </div>
                              );
                            }
                          } else if (url.match(/twitter.com\/[\w]+\/status\//i)) {
                            // Twitter embed
                            return (
                              <blockquote key={idx} className="twitter-tweet w-full rounded-xl bg-background border border-border shadow p-2">
                                <a href={url} target="_blank" rel="noopener noreferrer">View on Twitter</a>
                              </blockquote>
                            );
                          } else if (url.match(/soundcloud.com\//i)) {
                            // SoundCloud embed
                            return (
                              <div key={idx} className="w-full rounded-xl overflow-hidden shadow border border-border bg-background flex justify-center items-center">
                                <iframe
                                  width="100%"
                                  height="120"
                                  scrolling="no"
                                  frameBorder="no"
                                  allow="autoplay"
                                  src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=false`}
                                  title="SoundCloud audio"
                                />
                              </div>
                            );
                          }
                          // Fallback: show as link
                          return (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-500 underline break-all hover:text-blue-600">
                              {url}
                            </a>
                          );
                        })}
                      </div>
                      {/* Lightbox for images */}
                      <Lightbox
                        open={lightboxOpen}
                        close={() => setLightboxOpen(false)}
                        slides={noteCard.mediaUrls.filter((url: string) => url.match(/\.(jpeg|jpg|png|gif|webp)$/i)).map((url: string) => ({ src: url }))}
                        index={lightboxIndex}
                        on={{ view: ({ index }) => setLightboxIndex(index) }}
                      />
                    </>
                  )}
                  {/* End media section */}
                  {!noteCard.showFullContent && noteCard.formattedContent.length > 280 && (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        noteCard.toggleExpansion();
                      }}
                      className="text-primary text-sm hover:underline mt-1"
                    >
                      Show more
                    </button>
                  )}
                </Link>
              </div>
              {/* Hashtags section - always below content and media, never inline */}
              {hashtagsToShow.length > 0 && (
                <div className="block w-full mt-5 pt-3 border-t border-border">
                  <div className="flex flex-row flex-wrap gap-2 w-full">
                    {hashtagsToShow.slice(0, 2).map((tag, idx) => (
                      <span
                        key={tag}
                        onClick={() => noteCard.handleHashtagClick(tag)}
                        className="inline-block bg-blue-900/20 dark:bg-blue-400/10 text-blue-600 dark:text-blue-300 font-semibold rounded-full px-3 py-1 text-xs hover:bg-blue-900/40 hover:text-blue-400 transition-colors border border-blue-400/20 shadow-sm cursor-pointer select-none"
                        role="button"
                        tabIndex={0}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  {hashtagsToShow.length > 2 && (
                    <div className="block w-full mt-1">
                      <span className="text-xs text-muted-foreground self-center">
                        +{hashtagsToShow.length - 2} more
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        {/* Action buttons */}
        <CardFooter className="px-4 pb-3 pt-2 flex justify-between flex-shrink-0">
          <div className="flex items-center space-x-6">
            {/* Comment button */}
            <Link to={noteCard.postUrl} className="flex items-center space-x-1 group">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full group-hover:bg-blue-50 group-hover:text-blue-500">
                <MessageSquare className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground group-hover:text-blue-500">
                {noteCard.replyCount > 0 && noteCard.replyCount}
              </span>
            </Link>
            
            {/* Repost button */}
            <div className="flex items-center space-x-1 group">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-8 w-8 rounded-full group-hover:bg-green-50 group-hover:text-green-500",
                  noteCard.userHasReposted && "text-green-500"
                )}
                onClick={noteCard.handleRepost}
                disabled={noteCard.isReposting}
              >
                <Repeat className="h-4 w-4" />
              </Button>
              <span className={cn(
                "text-xs text-muted-foreground group-hover:text-green-500",
                noteCard.userHasReposted && "text-green-500"
              )}>
                {noteCard.repostCount > 0 && noteCard.repostCount}
              </span>
            </div>
            
            {/* Like button */}
            <div className="flex items-center space-x-1 group">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-8 w-8 rounded-full group-hover:bg-pink-50 group-hover:text-pink-500",
                  noteCard.userHasLiked && "text-pink-500"
                )}
                onClick={noteCard.handleLike}
                disabled={noteCard.isLiking}
              >
                <Heart className={cn("h-4 w-4", noteCard.userHasLiked && "fill-current")} />
              </Button>
              <span className={cn(
                "text-xs text-muted-foreground group-hover:text-pink-500",
                noteCard.userHasLiked && "text-pink-500"
              )}>
                {noteCard.likeCount > 0 && noteCard.likeCount}
              </span>
            </div>
          </div>
          
          {/* Share button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-500"
            onClick={noteCard.handleShare}
          >
            <Share className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// Memoize the component with custom comparison
export default React.memo(NewNoteCard, (prevProps, nextProps) => {
  // Only re-render if event ID changes or profile data changes
  return prevProps.event.id === nextProps.event.id && 
         prevProps.profileData === nextProps.profileData &&
         prevProps.className === nextProps.className;
});
