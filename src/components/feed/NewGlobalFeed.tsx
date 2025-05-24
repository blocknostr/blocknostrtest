import React, { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { nostrService } from "@/lib/nostr";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import VirtualizedFeed from "./VirtualizedFeed";
import VirtualScrollDebug from "../debug/VirtualScrollDebug";
import { Loader2, AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackgroundRelayConnection } from "@/hooks/useBackgroundRelayConnection";
import type { NostrEvent } from '@/lib/nostr/types';
import type { ProfileData } from '../note/NewNoteCard';

interface NewGlobalFeedProps {
  activeHashtag?: string;
  onLoadingChange?: (isLoading: boolean) => void;
}

const NewGlobalFeed: React.FC<NewGlobalFeedProps> = ({ 
  activeHashtag,
  onLoadingChange 
}) => {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileData>>({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedHeight, setFeedHeight] = useState(600); // Add state for feed height
  const { preferences } = useUserPreferences();
  const initialLoadDone = useRef(false);
  const { isLoggedIn } = useAuth();
  const relayState = useBackgroundRelayConnection();

  // Get the hashtags to filter by - either the active hashtag, user preferences, or default ones
  const hashtags = useMemo(() => {
    const defaultGlobalTags = ["bitcoin", "alephium", "ergo"];
    return activeHashtag
      ? [activeHashtag]
      : (preferences.feedFilters?.globalFeedTags?.length
          ? preferences.feedFilters.globalFeedTags
          : defaultGlobalTags);
  }, [activeHashtag, preferences.feedFilters?.globalFeedTags]);

  // Memoized function to fetch profiles for events
  const fetchProfiles = useCallback(async (pubkeys: string[]) => {
    if (pubkeys.length === 0) return;
    
    const uniquePubkeys = [...new Set(pubkeys)].filter(p => !profiles[p]);
    if (uniquePubkeys.length === 0) return;

    try {
      const fetchedProfiles = await nostrService.getProfilesByPubkeys(uniquePubkeys);
      setProfiles(prev => ({ ...prev, ...fetchedProfiles }));
    } catch (error) {
      console.warn("Error fetching profiles:", error);
    }
  }, [profiles]);

  // Optimized helper to merge new events with existing ones
  const mergeEvents = useCallback((newEvents: NostrEvent[], currentEvents: NostrEvent[]) => {
    const eventMap = new Map(currentEvents.map(e => [e.id, e]));
    
    newEvents.forEach(newEvent => {
      if (!eventMap.has(newEvent.id)) {
        eventMap.set(newEvent.id, newEvent);
      }
    });
    
    // Convert back to array and sort by created_at (newest first)
    return Array.from(eventMap.values()).sort((a, b) => b.created_at - a.created_at);
  }, []);

  // Optimized load more events function
  const loadMoreEvents = useCallback(async () => {
    if (loadingMore || !hasMore || events.length === 0) return;
    
    setLoadingMore(true);
    
    try {
      // Get the oldest event timestamp
      const oldestEvent = events[events.length - 1];
      const until = oldestEvent.created_at - 1;
      
      // Create subscription for older hashtag events
      const filters = hashtags.map(tag => ({
        kinds: [1],
        "#t": [tag],
        until: until,
        limit: 20
      }));
      
      // Empty array to collect events
      const collectedEvents: NostrEvent[] = [];
      const collectedPubkeys: string[] = [];
      
      // Create subscription
      const subId = nostrService.subscribe(
        filters,
        (event) => {
          // Don't add duplicates or events newer than our oldest event
          if (
            !collectedEvents.some(e => e.id === event.id) &&
            !events.some(e => e.id === event.id) &&
            event.created_at < until
          ) {
            collectedEvents.push(event);
            if (event.pubkey) {
              collectedPubkeys.push(event.pubkey);
            }
          }
        }
      );
      
      // Wait for events to come in
      await new Promise(resolve => setTimeout(resolve, 2000)); // Reduced timeout
      
      // Unsubscribe after timeout
      nostrService.unsubscribe(subId);
      
      // Add new events to the list - use merge function
      if (collectedEvents.length > 0) {
        const sortedEvents = collectedEvents.sort((a, b) => b.created_at - a.created_at);
        setEvents(prev => mergeEvents(sortedEvents, prev));
        
        // Fetch profiles for all collected pubkeys
        if (collectedPubkeys.length > 0) {
          fetchProfiles(collectedPubkeys);
        }
      }
      
      setHasMore(collectedEvents.length >= 10);
    } catch (error) {
      console.error("Error loading more events:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, events, hashtags, mergeEvents, fetchProfiles]);

  // Fix useCallback dependency for loadEvents
  const loadEvents = useCallback(async () => {
    // Don't start loading if we don't have any relay connections
    if (!relayState.readyForFeeds) {
      if (relayState.isConnecting) {
        setLoading(true);
        if (onLoadingChange) onLoadingChange(true);
        return; // Wait for relays to connect
      } else if (relayState.error) {
        setError("Unable to connect to the network. Please check your internet connection.");
        return;
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (onLoadingChange) onLoadingChange(true);
      
      const wasEmpty = events.length === 0;
      const collectedEvents: NostrEvent[] = [];
      const collectedPubkeys: string[] = [];
      
      // Create hashtag filters
      const filters = hashtags.map(tag => ({
        kinds: [1],
        "#t": [tag],
        limit: 30 // Optimized limit
      }));
      
      // Create subscription for hashtag events
      const subId = nostrService.subscribe(
        filters,
        (event) => {
          // Only add new events (not duplicates)
          if (!collectedEvents.some(e => e.id === event.id) && 
              !events.some(e => e.id === event.id)) {
            collectedEvents.push(event);
            if (event.pubkey) {
              collectedPubkeys.push(event.pubkey);
            }
          }
        }
      );
      
      // Wait for events to come in - optimized timeout
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Update events if we got any
      if (collectedEvents.length > 0) {
        const sortedEvents = collectedEvents.sort((a, b) => b.created_at - a.created_at);
        setEvents(prev => wasEmpty ? sortedEvents : mergeEvents(sortedEvents, prev));
        
        // Fetch profiles for collected pubkeys
        if (collectedPubkeys.length > 0) {
          fetchProfiles(collectedPubkeys);
        }
        
        setHasMore(collectedEvents.length >= 10);
      }
      
      // Unsubscribe after timeout
      nostrService.unsubscribe(subId);
      
      initialLoadDone.current = true;
    } catch (error) {
      console.error("Error loading global feed:", error);
      if (relayState.connectedCount === 0) {
        setError("Not connected to any relays. Please check your internet connection.");
      } else {
        setError("Unable to load posts at the moment. Please try again.");
      }
    } finally {
      setLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  }, [hashtags, fetchProfiles, onLoadingChange, events, mergeEvents, relayState]);

  // Load events on initial render and when hashtags change
  useEffect(() => {
    if (relayState.readyForFeeds) {
      loadEvents();
    }
    
    // Listen for refetch events
    const handleRefetch = () => {
      loadEvents();
    };
    
    window.addEventListener('refetch-global-feed', handleRefetch);
    return () => {
      window.removeEventListener('refetch-global-feed', handleRefetch);
    };
  }, [hashtags, loadEvents, relayState.readyForFeeds]);

  // Auto-load feeds when relays become ready
  useEffect(() => {
    if (relayState.readyForFeeds && !initialLoadDone.current && events.length === 0) {
      console.log('[NewGlobalFeed] Relays ready, loading feed...');
      loadEvents();
    }
  }, [relayState.readyForFeeds, loadEvents, events.length]);

  // Calculate dynamic height for virtualized feed to match viewport and prevent page scroll
  const calculateFeedHeight = () => {
    const viewportHeight = window.innerHeight;
    const headerHeight = 56; // 3.5rem = 56px (sticky header)
    const bannerHeight = 64; // Estimate or get actual banner height in px
    // Adjust these if you have other fixed sections above/below the feed
    const otherFixedSections = bannerHeight; // e.g., banner, nav, etc.
    return viewportHeight - headerHeight - otherFixedSections;
  };

  useEffect(() => {
    const updateFeedHeight = () => {
      setFeedHeight(calculateFeedHeight());
      document.body.style.overflow = 'hidden';
    };
    updateFeedHeight();
    window.addEventListener('resize', updateFeedHeight);
    return () => {
      window.removeEventListener('resize', updateFeedHeight);
      document.body.style.overflow = '';
    };
  }, []);

  // Alias for infinite scroll
  const handleLoadMore = loadMoreEvents;

  // Show connecting state when relays are connecting
  if (relayState.isConnecting && events.length === 0) {
    return (
      <div className="py-8 flex justify-center">
        <div className="flex flex-col items-center">
          <Wifi className="h-8 w-8 text-primary mb-2 animate-pulse" />
          <p className="text-muted-foreground text-center">
            Connecting to network...
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {relayState.connectedCount} of {relayState.totalCount} relays connected
          </p>
        </div>
      </div>
    );
  }

  // Show loading state when no events and loading
  if (loading && events.length === 0) {
    return (
      <div className="py-8 flex justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">
            Loading posts with {activeHashtag ? `#${activeHashtag}` : hashtags.map(t => `#${t}`).join(", ")}
          </p>
        </div>
      </div>
    );
  }

  // Show improved error state
  if (error && events.length === 0) {
    return (
      <div className="py-8 text-center">
        {relayState.connectedCount === 0 ? (
          <WifiOff className="h-8 w-8 text-amber-500 mx-auto mb-2" />
        ) : (
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
        )}
        <p className="text-muted-foreground mb-2">{error}</p>
        {relayState.connectedCount === 0 && (
          <p className="text-xs text-muted-foreground mb-4">
            Check your internet connection and try again
          </p>
        )}
        <Button 
          variant="outline" 
          size="sm"
          onClick={relayState.connectedCount === 0 ? relayState.reconnect : loadEvents}
          className="mx-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {relayState.connectedCount === 0 ? 'Reconnect' : 'Try Again'}
        </Button>
      </div>
    );
  }

  // Show empty state when no events and not loading
  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {activeHashtag ? 
          `No posts found with #${activeHashtag} hashtag` :
          `No posts found with hashtags: ${hashtags.map(t => `#${t}`).join(", ")}`
        }
      </div>
    );
  }

  // Show virtualized events list
  return (
    <div className="w-full relative">
      <VirtualizedFeed
        events={events}
        profiles={profiles}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={handleLoadMore}
        height={feedHeight}
      />
      
      {/* Debug component - only shows in development */}
      <VirtualScrollDebug />
    </div>
  );
};

export default NewGlobalFeed;
