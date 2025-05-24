import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Share2, Heart, MessageCircle } from "lucide-react";
import NoteCard from "@/components/note/NoteCard";
import ArticleReader from "@/components/articles/ArticleReader";
import ArticleAuthorCard from "@/components/articles/ArticleAuthorCard";
import RelatedArticles from "@/components/articles/RelatedArticles";
import Sidebar from "@/components/Sidebar";
import BackButton from "@/components/navigation/BackButton";
import { adaptedNostrService as nostrAdapter } from "@/lib/nostr/nostr-adapter";
import { nostrService } from "@/lib/nostr";
import { NostrEvent } from "@/lib/nostr/types";
import { toast } from "@/lib/utils/toast-replacement";
// Toaster now imported globally
import { getTagValue } from "@/lib/nostr/utils/nip/nip10";
import { Separator } from "@/components/ui/separator";
import { EVENT_KINDS } from "@/lib/nostr/constants";
import { useFeedProfile } from "@/hooks/useUnifiedProfile";

export interface UnifiedContentViewerProps {
  contentType?: 'post' | 'article';
  layoutType?: 'sidebar' | 'container';
  showRelatedContent?: boolean;
  backPath?: string;
  backLabel?: string;
}

/**
 * Unified Content Viewer - Consolidates PostPage and ArticleViewPage
 * 
 * Features:
 * - Handles both posts (kind 1) and articles (kind 30023)
 * - Flexible layout (sidebar or container)
 * - Unified loading and error states
 * - Smart content detection based on event kind
 * - Optional related content suggestions
 * - Consistent interaction buttons (like, share, comment)
 * - Author information display
 * - Edit capabilities for authors
 */
const UnifiedContentViewer: React.FC<UnifiedContentViewerProps> = ({
  contentType,
  layoutType = 'auto',
  showRelatedContent = true,
  backPath,
  backLabel
}) => {
  const { id, eventId } = useParams<{ id?: string; eventId?: string }>();
  const navigate = useNavigate();
  
  // State management
  const [content, setContent] = useState<NostrEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  
  // Profile management
  const [, { fetchProfile, getProfile, profiles }] = useFeedProfile();
  
  // Computed values
  const contentId = id || eventId;
  const isLoggedIn = !!nostrAdapter.publicKey;
  const isAuthor = content ? content.pubkey === nostrAdapter.publicKey : false;
  
  // Content type detection
  const isArticle = content?.kind === EVENT_KINDS.ARTICLE || contentType === 'article';
  const isPost = content?.kind === EVENT_KINDS.TEXT_NOTE || contentType === 'post';
  
  // Layout detection
  const shouldUseSidebar = layoutType === 'sidebar' || (layoutType === 'auto' && isPost);
  const shouldUseContainer = layoutType === 'container' || (layoutType === 'auto' && isArticle);
  
  // Back navigation
  const getBackPath = () => {
    if (backPath) return backPath;
    if (isArticle) return '/articles';
    return '/';
  };
  
  const getBackLabel = () => {
    if (backLabel) return backLabel;
    if (isArticle) return 'Back to Articles';
    return 'Back';
  };

  // Content fetching logic
  const fetchContent = useCallback(async () => {
    if (!contentId) {
      setError("No content ID provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result: NostrEvent | null = null;

      // Try article first if contentType is specified as article
      if (contentType === 'article' || !contentType) {
        try {
          result = await nostrAdapter.getArticleById(contentId);
        } catch (err) {
          console.log("Not an article, trying as post...");
        }
      }

      // Try as regular post if article fetch failed or contentType is post
      if (!result && (contentType === 'post' || !contentType)) {
        try {
          const filters = [{ ids: [contentId] }];
          
          await new Promise<void>((resolve) => {
            const subId = nostrService.subscribe(
              filters,
              (event: NostrEvent) => {
                if (event && event.id === contentId) {
                  result = event;
                  nostrService.unsubscribe(subId);
                  resolve();
                }
              }
            );
            
            // Timeout after 5 seconds
            setTimeout(() => {
              nostrService.unsubscribe(subId);
              resolve();
            }, 5000);
          });
        } catch (err) {
          console.error("Error fetching post:", err);
        }
      }

      if (result) {
        setContent(result);
        
        // Fetch author profile
        if (result.pubkey) {
          await fetchProfile(result.pubkey);
        }
      } else {
        setError(isArticle ? "Article not found" : "Post not found");
      }
    } catch (err) {
      console.error("Error fetching content:", err);
      setError(isArticle ? "Failed to load article" : "Failed to load post");
      if (isPost) {
        toast.error("Failed to load post.");
      }
    } finally {
      setLoading(false);
    }
  }, [contentId, contentType, fetchProfile, isArticle, isPost]);

  // Load content on mount or ID change
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Interaction handlers
  const handleLike = async () => {
    if (!isLoggedIn) {
      toast.error(`You must be logged in to like ${isArticle ? 'articles' : 'posts'}`);
      return;
    }
    
    if (!content) return;
    
    try {
      await nostrAdapter.social.reactToEvent(content.id, "+");
      setLiked(true);
      toast.success(`${isArticle ? 'Article' : 'Post'} liked!`);
    } catch (error) {
      console.error("Failed to like content:", error);
      toast.error(`Failed to like ${isArticle ? 'article' : 'post'}`);
    }
  };
  
  const handleShare = () => {
    if (!content) return;
    
    try {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
    }
  };

  // Loading state
  if (loading) {
    const LoadingContent = () => (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse space-y-4 w-full">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );

    if (shouldUseSidebar) {
      return (
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <div className="flex-1 ml-0 md:ml-64 p-6">
            <BackButton fallbackPath={getBackPath()} />
            <div className="text-center mt-10">Loading {isArticle ? 'article' : 'post'}...</div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <LoadingContent />
        </div>
      );
    }
  }

  // Error state
  if (error || !content) {
    const ErrorContent = () => (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="mt-4">{error || `Failed to load ${isArticle ? 'article' : 'post'}`}</p>
        <Button asChild className="mt-4">
          <Link to={getBackPath()}>{getBackLabel()}</Link>
        </Button>
      </div>
    );

    if (shouldUseSidebar) {
      return (
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <div className="flex-1 ml-0 md:ml-64 p-6">
            <BackButton fallbackPath={getBackPath()} />
            <div className="mt-10">
              <ErrorContent />
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <ErrorContent />
        </div>
      );
    }
  }

  // Article metadata extraction
  const title = getTagValue(content, 'title') || "Untitled";
  const image = getTagValue(content, 'image');
  const summary = getTagValue(content, 'summary');
  const publishedAt = content.created_at * 1000;
  const hashtags = content.tags
    .filter(tag => tag[0] === 't')
    .map(tag => tag[1]);

  // Render content based on layout type
  if (shouldUseSidebar) {
    // Post layout with sidebar
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6">
          <BackButton fallbackPath={getBackPath()} />
          <NoteCard
            event={content}
            profileData={getProfile(content.pubkey)}
          />
          <Toaster position="bottom-right" />
        </div>
      </div>
    );
  } else {
    // Article layout with container
    return (
      <div className="container max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to={getBackPath()}>
              <ArrowLeft size={16} /> {getBackLabel()}
            </Link>
          </Button>
          {isAuthor && (
            <Button variant="outline" asChild>
              <Link to={`/articles/edit/${content.id}`} className="flex items-center gap-2">
                <Pencil size={16} />
                Edit
              </Link>
            </Button>
          )}
        </div>
        
        <div className="max-w-4xl mx-auto mt-8">
          {isArticle ? (
            <ArticleReader 
              article={content}
              title={title}
              image={image}
              publishedAt={publishedAt}
              hashtags={hashtags}
            />
          ) : (
            <NoteCard
              event={content}
              profileData={getProfile(content.pubkey)}
            />
          )}
          
          <div className="flex justify-between items-center mt-8 border-t border-b py-4">
            <div className="flex gap-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`flex items-center gap-2 ${liked ? 'text-red-500' : ''}`}
                onClick={handleLike}
              >
                <Heart size={18} className={liked ? 'fill-red-500' : ''} />
                Like
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={handleShare}
              >
                <Share2 size={18} />
                Share
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2"
              asChild
            >
              <Link to={`/post/${content.id}`}>
                <MessageCircle size={18} />
                Comments
              </Link>
            </Button>
          </div>
          
          <div className="my-8">
            <ArticleAuthorCard pubkey={content.pubkey} />
          </div>
          
          {showRelatedContent && isArticle && hashtags.length > 0 && (
            <>
              <Separator className="my-8" />
              <div className="mt-12">
                <h3 className="text-xl font-semibold mb-4">Related Articles</h3>
                <RelatedArticles hashtags={hashtags} excludeId={content.id} />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
};

export default UnifiedContentViewer; 