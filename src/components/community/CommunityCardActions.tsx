import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Link as LinkIcon } from "lucide-react";
import { toast } from "@/lib/utils/toast-replacement";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";
import LeaveCommunityButton from "./LeaveCommunityButton";

interface CommunityCardActionsProps {
  community: {
    id: string;
    name: string;
    description: string;
    image: string;
    creator: string;
    createdAt: number;
    members: string[];
    uniqueId: string;
  };
  isMember: boolean;
  isCreator: boolean;
  currentUserPubkey: string | null;
}

const CommunityCardActions = ({ 
  community, 
  isMember, 
  isCreator, 
  currentUserPubkey 
}: CommunityCardActionsProps) => {
  const [showInviteLink, setShowInviteLink] = useState(false);
  const navigate = useNavigate();

  const handleJoinClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentUserPubkey) {
      toast.warning("Login required", {
        description: "You must be logged in to join a community"
      });
      return;
    }
    
    try {
      // Get the existing community data and members
      const updatedMembers = [...community.members, currentUserPubkey];
      
      // Create an updated community event with the current user added as a member
      const communityData = {
        name: community.name,
        description: community.description,
        image: community.image,
        creator: community.creator,
        createdAt: community.createdAt
      };
      
      const event = {
        kind: 34550,
        content: JSON.stringify(communityData),
        tags: [
          ['d', community.uniqueId],
          ...updatedMembers.map(member => ['p', member])
        ]
      };
      
      await nostrService.publishEvent(event);
      toast.success(`Joined ${community.name}!`, {
        description: "You can now participate in this community"
      });
    } catch (error) {
      console.error("Error joining community:", error);
      toast.error("Failed to join community", {
        description: "Please try again or check your connection"
      });
    }
  };

  const handleLeaveClick = () => {
    if (!currentUserPubkey) {
      toast.warning("Login required", {
        description: "You must be logged in to leave a community"
      });
      return;
    }
    
    try {
      // Remove the current user from members
      const updatedMembers = community.members.filter(member => member !== currentUserPubkey);
      
      // Create an updated community event without the current user
      const communityData = {
        name: community.name,
        description: community.description,
        image: community.image,
        creator: community.creator,
        createdAt: community.createdAt
      };
      
      const event = {
        kind: 34550,
        content: JSON.stringify(communityData),
        tags: [
          ['d', community.uniqueId],
          ...updatedMembers.map(member => ['p', member])
        ]
      };
      
      // Handle the promise internally
      nostrService.publishEvent(event)
        .then((publishResult) => {
          if (publishResult) {
            toast.success(`Left ${community.name}`, {
              description: "You are no longer a member of this community"
            });
          } else {
            toast.error("Failed to leave the community", {
              description: "Something went wrong. Please try again."
            });
          }
        })
        .catch((error) => {
          console.error("Error leaving community:", error);
          toast.error("Failed to leave community", {
            description: "An error occurred. Please try again."
          });
        });
    } catch (error) {
      console.error("Error leaving community:", error);
      toast.error("Failed to leave community", {
        description: "An error occurred. Please try again."
      });
    }
  };

  const shareInviteLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const inviteUrl = `${window.location.origin}/communities/${community.id}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl)
        .then(() => {
          toast.success("Invite link copied!", {
            description: "You can now share it with others",
            action: {
              label: "View Community",
              onClick: () => navigate(`/communities/${community.id}`),
            }
          });
          setShowInviteLink(true);
          setTimeout(() => setShowInviteLink(false), 3000);
        })
        .catch(err => {
          console.error("Failed to copy:", err);
          toast.error("Failed to copy invite link", {
            description: "Please try again or copy manually"
          });
        });
    } else {
      // Fallback
      toast.warning("Copy not supported", {
        description: "Your browser doesn't support automatic copying"
      });
    }
  };

  const navigateToCommunity = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/communities/${community.id}`);
  };

  return (
    <div className="w-full">
      <div className="flex w-full gap-2">
        {!isMember && !isCreator && currentUserPubkey && (
          <Button 
            variant="outline" 
            className="flex-1 flex items-center gap-2" 
            onClick={handleJoinClick}
          >
            <UserPlus className="h-4 w-4" />
            Join
          </Button>
        )}
        {(isMember || isCreator) && (
          <>
            {/* Show view button - now full width */}
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={navigateToCommunity}
            >
              View
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={shareInviteLink}
              title="Share invite link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      {showInviteLink && (
        <div className="px-3 pb-3 text-xs text-muted-foreground">
          Invite link copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default CommunityCardActions;
