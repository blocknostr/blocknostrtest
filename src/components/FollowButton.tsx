
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";
import { User, UserCheck, Loader2 } from "lucide-react";
import { toast } from "@/lib/utils/toast-replacement";

interface FollowButtonProps {
  pubkey: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const FollowButton = ({ pubkey, className, variant = "default", size = "sm" }: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentUserPubkey = nostrService.publicKey;
  
  useEffect(() => {
    // Check if user is already following this pubkey according to NIP-02
    if (pubkey && currentUserPubkey) {
      // Fixed: Instead of directly using isFollowing, get the current boolean value
      const checkFollowing = async () => {
        try {
          const following = await nostrService.isFollowing(pubkey);
          setIsFollowing(following);
        } catch (error) {
          console.error("Error checking following status:", error);
        }
      };
      
      checkFollowing();
    }
  }, [pubkey, currentUserPubkey]);
  
  const handleFollowToggle = async () => {
    if (!currentUserPubkey) {
      toast.error("You need to be logged in to follow users");
      return;
    }
    
    setLoading(true);
    
    try {
      if (isFollowing) {
        // Unfollow according to NIP-02
        const success = await nostrService.unfollowUser(pubkey);
        if (success) {
          setIsFollowing(false); // Fixed: Use direct boolean instead of the Promise
          toast.success("Unfollowed user");
        } else {
          toast.error("Failed to unfollow user");
        }
      } else {
        // Follow according to NIP-02
        const success = await nostrService.followUser(pubkey);
        if (success) {
          setIsFollowing(true); // Fixed: Use direct boolean instead of the Promise
          toast.success("Following user");
        } else {
          toast.error("Failed to follow user");
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  // Don't show follow button for yourself
  if (!currentUserPubkey || currentUserPubkey === pubkey) {
    return null;
  }
  
  return (
    <Button
      variant={isFollowing ? "outline" : variant}
      size={size}
      className={className}
      onClick={handleFollowToggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="h-4 w-4 mr-2" />
          Following
        </>
      ) : (
        <>
          <User className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
};

export default FollowButton;
