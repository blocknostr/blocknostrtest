import React from 'react';
import NewNoteCard from '../note/NewNoteCard';
import { Loader2 } from 'lucide-react';
import type { NostrEvent } from '@/lib/nostr';
import type { ProfileData } from '../note/NewNoteCard';
import styles from './VirtualizedFeed.module.css';

interface VirtualizedFeedProps {
  events: NostrEvent[];
  profiles: Record<string, ProfileData>;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  height?: number;
}

const VirtualizedFeed: React.FC<VirtualizedFeedProps> = ({
  events,
  profiles,
  hasMore,
  loadingMore,
  onLoadMore,
  height,
}) => {
  // Infinite scroll: load more when scrolled near bottom
  const feedRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handleScroll = () => {
      if (!feedRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
      if (scrollHeight - scrollTop - clientHeight < 400 && hasMore && !loadingMore) {
        onLoadMore();
      }
    };
    const node = feedRef.current;
    if (node) node.addEventListener('scroll', handleScroll);
    return () => {
      if (node) node.removeEventListener('scroll', handleScroll);
    };
  }, [hasMore, loadingMore, onLoadMore]);

  // Utility to map height to a class
  function getHeightClass(height?: number) {
    if (!height) return '';
    if (height >= window.innerHeight - 10) return styles.height100vh;
    if (height >= 900) return styles.height900;
    if (height >= 800) return styles.height800;
    if (height >= 700) return styles.height700;
    return styles.height600;
  }

  return (
    <div
      ref={feedRef}
      className={styles.virtualizedFeed + (height ? ' ' + getHeightClass(height) : '')}
      data-testid="virtualized-feed"
    >
      {events.map((event) => (
        <NewNoteCard
          key={event.id}
          event={event}
          profileData={profiles[event.pubkey]}
          className="bg-card border border-border shadow-sm hover:bg-muted/10 transition-colors duration-150"
        />
      ))}
      {loadingMore && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};

export default React.memo(VirtualizedFeed);