// Legacy re-export for backward compatibility
// This hook has been consolidated into useProfileData
// @deprecated Use useProfileData with includePosts: true instead

export { useProfileData as useProfilePosts } from '../useProfileData';

// For components that still use the old API
import { useProfileData } from '../useProfileData';

export default function useProfilePosts({ hexPubkey, limit = 50 }: { hexPubkey?: string; limit?: number }) {
  const result = useProfileData({
    hexPubkey,
    includePosts: true,
    includeMedia: true,
    includeReplies: false,
    includeReposts: false,
    includeReactions: false,
    includeRelations: false,
    includeRelays: false,
    limit
  });

  return {
    events: result.posts,
    media: result.media,
    loading: result.postsLoading,
    error: result.postsError,
    hasEvents: result.posts.length > 0,
    refetch: result.refreshData
  };
}
