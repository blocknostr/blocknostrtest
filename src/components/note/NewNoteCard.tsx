import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { NostrEvent } from '@/lib/nostr';
import { MessageSquare, Heart, Repeat, Share, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNoteCard } from './hooks/useNoteCard';

interface NewNoteCardProps {
  event: NostrEvent;
  profileData?: Record<string, any>;
  className?: string;
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
  className 
}) => {
  // Use consolidated hook that follows proper data flow architecture
  const noteCard = useNoteCard({ event, profileData });
  
  if (!event || !event.id || !event.pubkey || !noteCard) return null;
  
  return (
    <div className="w-full h-full">
      <Card className={cn("overflow-hidden hover:bg-muted/20 transition-colors duration-200 h-full flex flex-col", className)}>
        <CardContent className="p-4 flex-1">
          <div className="flex gap-3 h-full">
            {/* Optimized Avatar section with lazy loading */}
            <div className="flex-shrink-0">
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
            <div className="flex-1 space-y-2 min-w-0 flex flex-col">
              {/* Header with name, username, time */}
              <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
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
              <div className="flex-1 overflow-hidden">
                <Link to={noteCard.postUrl} className="block">
                  <div 
                    className="whitespace-pre-wrap break-words text-sm leading-relaxed overflow-hidden"
                    style={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical' as any
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: noteCard.formattedContent
                    }}
                  />
                  
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
              
              {/* Hashtags section */}
              {noteCard.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 flex-shrink-0">
                  {noteCard.hashtags.slice(0, 2).map((tag, idx) => (
                    <Button 
                      key={idx}
                      variant="ghost" 
                      size="sm" 
                      className="text-primary h-6 px-2 py-0 text-xs"
                      onClick={() => noteCard.handleHashtagClick(tag)}
                    >
                      #{tag}
                    </Button>
                  ))}
                  {noteCard.hashtags.length > 2 && (
                    <span className="text-xs text-muted-foreground self-center">
                      +{noteCard.hashtags.length - 2} more
                    </span>
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
