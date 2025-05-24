import { useState, useEffect, useMemo } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';
import { formatDistanceToNow } from 'date-fns';
import { toast } from "@/lib/utils/toast-replacement";
import { useNoteCardReplies } from './useNoteCardReplies';
import { useNoteReactions } from './useNoteReactions';
import { eventBus, EVENTS } from '@/lib/services/EventBus';

interface UseNoteCardProps {
  event: NostrEvent;
  profileData?: Record<string, any>;
}

/**
 * Consolidated hook that follows data manager > adapter > hook > component pattern
 * Centralizes all note card business logic and data operations
 */
export function useNoteCard({ event, profileData }: UseNoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Use existing hooks for reactions and replies (these follow proper pattern)
  const { replyCount } = useNoteCardReplies(event.id);
  const reactionHook = useNoteReactions(event.id);
  
  // Memoized computed values to avoid recalculation
  const computedData = useMemo(() => {
    if (!event) return null;
    
    // Format content with proper link/hashtag/mention parsing
    const formatContent = (content: string) => {
      let formattedContent = content
        // URLs
        .replace(
          /(https?:\/\/[^\s]+)/g, 
          '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>'
        )
        // Hashtags
        .replace(
          /#(\w+)/g, 
          '<a href="javascript:void(0)" class="text-primary hover:underline">#$1</a>'
        )
        // Mentions
        .replace(
          /@(\w+)/g, 
          '<a href="javascript:void(0)" class="text-primary hover:underline">@$1</a>'
        );
      
      return formattedContent;
    };
    
    // Extract hashtags from event tags
    const hashtags = event.tags
      ?.filter(tag => tag[0] === 't')
      ?.map(tag => tag[1]) || [];
    
    // Format timestamp
    const formattedTime = event.created_at 
      ? formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true }) 
      : '';
    
    // Get display name or shorten pubkey
    const displayName = profileData?.name || profileData?.display_name || 
      (event.pubkey ? `${event.pubkey.slice(0, 8)}...` : 'Unknown');
      
    // Get username from NIP-05 identifier
    const username = profileData?.nip05 
      ? profileData.nip05.includes('@') ? profileData.nip05 : `${profileData.nip05}`
      : null;
    
    // Content display logic
    const showFullContent = isExpanded || (event.content && event.content.length <= 300);
    const truncatedContent = event.content && event.content.length > 300
      ? event.content.substring(0, 300) + '...'
      : event.content;
    
    // Generate profile URL using adapter pattern
    const profileUrl = `/`;
    const postUrl = `/post/${event.id}`;
    
    return {
      formatContent,
      hashtags,
      formattedTime,
      displayName,
      username,
      showFullContent,
      truncatedContent,
      profileUrl,
      postUrl,
      formattedContent: formatContent(showFullContent ? event.content : truncatedContent)
    };
  }, [event, profileData, isExpanded]);
  
  // Actions that follow proper data flow
  const actions = useMemo(() => ({
    // Expand/collapse content
    toggleExpansion: () => setIsExpanded(!isExpanded),
    
    // Share action using proper service layer
    handleShare: async () => {
      const shareData = {
        title: 'Shared from BlockNoster',
        text: event.content.substring(0, 100) + '...',
        url: `${window.location.origin}/post/${event.id}`
      };
      
      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(shareData.url);
          toast.success('Link copied to clipboard');
        }
      } catch (error) {
        console.error('Error sharing:', error);
        toast.error('Failed to share');
      }
    },
    
    // Hashtag click handler using window event for now (can be improved with proper event bus)
    handleHashtagClick: (tag: string) => {
      window.dispatchEvent(new CustomEvent('set-hashtag', { detail: tag }));
    },
    
    // Reaction actions (delegate to existing hook)
    handleLike: reactionHook.handleLike,
    handleRepost: reactionHook.handleRepost,
  }), [event, isExpanded, reactionHook]);
  
  return {
    // Computed data
    ...computedData,
    
    // State
    isExpanded,
    
    // Reaction data
    replyCount,
    likeCount: reactionHook.likeCount,
    repostCount: reactionHook.repostCount,
    userHasLiked: reactionHook.userHasLiked,
    userHasReposted: reactionHook.userHasReposted,
    isLiking: reactionHook.isLiking,
    isReposting: reactionHook.isReposting,
    
    // Actions
    ...actions,
  };
} 