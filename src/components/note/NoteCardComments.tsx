import { useState, useEffect } from 'react';
import { nostrService, NostrEvent } from '@/lib/nostr';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/utils/toast-replacement";
import { Trash2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Comment {
  id?: string;
  content: string;
  author: string;
  created_at: number;
}

interface NoteCardCommentsProps {
  eventId: string;
  pubkey: string;
  initialComments?: Comment[];
  initialCommentText?: string;
  replyUpdated?: number;
  onReplyAdded: () => void;
}

const NoteCardComments = ({ 
  eventId, 
  pubkey, 
  initialComments = [], 
  initialCommentText = "", 
  replyUpdated = 0,
  onReplyAdded 
}: NoteCardCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState(initialCommentText);
  const [replyToDelete, setReplyToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  
  // Update comment when initialCommentText changes
  useEffect(() => {
    if (initialCommentText) {
      setNewComment(initialCommentText);
    }
  }, [initialCommentText]);
  
  // Fetch replies when component mounts
  useEffect(() => {
    const fetchReplies = async () => {
      setIsLoading(true);
      
      // Subscribe to replies using #e tag filter
      const subId = nostrService.subscribe(
        [{
          kinds: [1], // Regular notes (kind 1)
          "#e": [eventId], // Filter by reference to parent event
          limit: 50
        }],
        (event) => {
          // Process each reply event
          const isReply = event.tags.some(tag => 
            tag[0] === 'e' && tag[1] === eventId && (tag[3] === 'reply' || !tag[3])
          );
          
          if (isReply) {
            // Add to comments if not already present
            setComments(prev => {
              // Check if we already have this comment
              if (prev.some(c => c.id === event.id)) {
                return prev;
              }
              
              const newComment = {
                id: event.id,
                content: event.content,
                author: event.pubkey || '',
                created_at: event.created_at
              };
              
              // Fetch profile data for the comment author
              if (event.pubkey) {
                fetchProfileData(event.pubkey);
              }
              
              // Add new comment and sort by creation time (newest first)
              return [...prev, newComment].sort((a, b) => b.created_at - a.created_at);
            });
          }
        }
      );
      
      setIsLoading(false);
      
      // Cleanup subscription
      return () => {
        nostrService.unsubscribe(subId);
      };
    };
    
    const fetchProfileData = (authorPubkey: string) => {
      // Only fetch if we don't already have it
      if (profiles[authorPubkey]) return;
      
      const metadataSubId = nostrService.subscribe(
        [{
          kinds: [0],
          authors: [authorPubkey],
          limit: 1
        }],
        (event) => {
          try {
            const metadata = JSON.parse(event.content);
            setProfiles(prev => ({
              ...prev,
              [authorPubkey]: metadata
            }));
          } catch (e) {
            console.error('Failed to parse profile metadata:', e);
          }
        }
      );
      
      // Cleanup subscription after a short time
      setTimeout(() => {
        nostrService.unsubscribe(metadataSubId);
      }, 5000);
    };
    
    fetchReplies();
  }, [eventId]);
  
  const handleSubmitComment = async () => {
    if (!newComment.trim() || commentSubmitting) return;
    
    try {
      setCommentSubmitting(true);
      
      // Create a reply event
      const replyEvent = await nostrService.publishEvent({
        kind: 1, // Note kind
        content: newComment,
        tags: [
          ['e', eventId || '', '', 'reply'], // Reference to parent with reply marker
          ['p', pubkey || ''] // Original author
        ]
      });
      
      // Add to local state only if we got a valid event ID back
      // This prevents duplicate comments
      if (replyEvent) {
        const newCommentObj = { 
          id: replyEvent,
          content: newComment, 
          author: nostrService.publicKey || '',
          created_at: Math.floor(Date.now() / 1000)
        };
        
        // Only add if it doesn't already exist
        setComments(prev => {
          if (prev.some(c => c.id === replyEvent)) {
            return prev;
          }
          return [newCommentObj, ...prev];
        });
        
        setNewComment("");
        onReplyAdded();
        toast.success("Comment posted");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setCommentSubmitting(false);
    }
  };
  
  const handleDeleteClick = (commentId: string | undefined) => {
    if (commentId) {
      setReplyToDelete(commentId);
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!replyToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // In Nostr, we don't actually delete comments but we can mark them as deleted
      await nostrService.publishEvent({
        kind: 5, // Deletion event
        content: "Reply deleted by author",
        tags: [
          ['e', replyToDelete] // Reference to deleted event
        ]
      });
      
      // Remove from local state
      setComments(prev => prev.filter(comment => comment.id !== replyToDelete));
      
      setReplyToDelete(null);
      setIsDeleting(false);
      toast.success("Reply deleted successfully");
      onReplyAdded(); // Notify parent component that comments have changed
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast.error("Failed to delete reply");
      setIsDeleting(false);
      setReplyToDelete(null);
    }
  };

  // Get a user's display name from their profile data
  const getUserDisplayInfo = (pubkey: string) => {
    const profile = profiles[pubkey];
    const npub = nostrService.getNpubFromHex(pubkey);
    const shortNpub = `${npub.substring(0, 6)}...${npub.substring(npub.length - 4)}`;
    
    return {
      name: profile?.name || profile?.display_name || shortNpub,
      picture: profile?.picture || '',
      shortNpub
    };
  };

  return (
    <>
      <div className="px-3 pb-2 pt-1">
        {nostrService.publicKey && (
          <div className="flex items-center gap-1.5 mb-2">
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarFallback className="text-[10px]">U</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex items-center bg-muted/40 rounded-full overflow-hidden pr-0.5">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[32px] max-h-[80px] resize-none flex-1 py-1 px-2 text-xs border-0 bg-transparent focus-visible:ring-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              <Button 
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || commentSubmitting}
                className="h-[28px] w-[28px] rounded-full"
                size="icon"
                variant="ghost"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          {isLoading && comments.length === 0 ? (
            <div className="text-xs text-center py-2 text-muted-foreground">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-xs text-center py-2 text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => {
              const { name, picture, shortNpub } = getUserDisplayInfo(comment.author);
              const isAuthor = comment.author === nostrService.publicKey;
              const timeAgo = formatDistanceToNow(
                new Date(comment.created_at * 1000),
                { addSuffix: true }
              );
              
              return (
                <div key={comment.id} className="flex items-start gap-1.5 group">
                  <div className="shrink-0">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={picture} />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                        {name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1">
                    <div className="bg-muted/30 p-1.5 rounded-lg">
                      <div className="flex items-baseline gap-1 mb-0.5">
                        <span className="font-medium text-[10px]">
                          {name}
                        </span>
                        <span className="text-[9px] text-muted-foreground">@{shortNpub}</span>
                        <span className="text-[9px] text-muted-foreground">·</span>
                        <span className="text-[9px] text-muted-foreground">{timeAgo}</span>
                      </div>
                      <p className="text-[11px] whitespace-pre-wrap break-words">{comment.content}</p>
                    </div>
                    
                    {isAuthor && comment.id && (
                      <div className="flex justify-end mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-50 hover:text-red-600 h-4 px-1 py-0 text-[9px]"
                          onClick={() => handleDeleteClick(comment.id)}
                        >
                          <Trash2 className="h-2 w-2 mr-0.5" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <AlertDialog open={!!replyToDelete} onOpenChange={(open) => !open && setReplyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reply</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your reply from the network.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default NoteCardComments;
