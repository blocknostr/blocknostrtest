import React, { useCallback, useMemo, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import NewNoteCard from '../note/NewNoteCard';
import { Loader2 } from 'lucide-react';
import { usePerformanceMonitor } from '@/lib/utils/performance';

// Import debug utilities in development
if (process.env.NODE_ENV === 'development') {
  import('@/lib/utils/performance-debug');
}

interface VirtualizedFeedProps {
  events: any[];
  profiles: Record<string, any>;
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
  height = 600
}) => {
  // Track performance
  const performanceTracker = usePerformanceMonitor('VirtualizedFeed');

  // Track performance when component mounts and events change
  useEffect(() => {
    performanceTracker.trackDOMNodes();
    performanceTracker.trackMemory();
    performanceTracker.trackImageLoading();
    
    // Log performance every 10 seconds in development
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        performanceTracker.logPerformance();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [events.length, performanceTracker]);

  // Calculate if an item is loaded
  const isItemLoaded = useCallback((index: number) => {
    return !!events[index];
  }, [events]);

  // Item count for infinite loader
  const itemCount = hasMore ? events.length + 1 : events.length;

  // Simple row renderer - Twitter-style stacked layout with constrained height
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const event = events[index];
    
    // Loading indicator for the last item when loading more
    if (!event) {
      return (
        <div style={style} className="flex items-center justify-center py-8">
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading more posts...
          </div>
        </div>
      );
    }

    return (
      <div style={style} className="border-b border-border/50 last:border-b-0">
        <div className="px-4 py-1 h-full overflow-hidden">
          <div className="h-[268px] overflow-hidden">
            <NewNoteCard 
              event={event}
              profileData={profiles[event.pubkey]}
              className="border-0 shadow-none bg-transparent hover:bg-muted/30 h-full"
            />
          </div>
        </div>
      </div>
    );
  }, [events, profiles]);

  // Memoize the list component
  const VirtualList = useMemo(() => (
    <InfiniteLoader
      isItemLoaded={isItemLoaded}
      itemCount={itemCount}
      loadMoreItems={onLoadMore}
      threshold={5}
    >
      {({ onItemsRendered, ref }) => (
        <List
          ref={ref}
          height={height}
          itemCount={itemCount}
          itemSize={280} // Reduced height due to minimal spacing
          onItemsRendered={onItemsRendered}
          overscanCount={2}
          className="react-window-list"
        >
          {Row}
        </List>
      )}
    </InfiniteLoader>
  ), [isItemLoaded, itemCount, onLoadMore, height, Row]);

  return (
    <div className="w-full">
      {VirtualList}
    </div>
  );
};

export default React.memo(VirtualizedFeed); 