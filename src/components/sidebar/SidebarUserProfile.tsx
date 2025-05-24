import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface UserProfileProps {
  userProfile: {
    name?: string;
    display_name?: string;
    picture?: string;
    nip05?: string;
    about?: string;
    created_at?: number;
  } | null;  // Mark as nullable
  isLoading: boolean;
}

const SidebarUserProfile = ({ userProfile, isLoading }: UserProfileProps) => {
  const navigate = useNavigate();
  const { npub } = useAuth();

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!userProfile) return 'U';
    if (userProfile.display_name || userProfile.name) {
      const name = (userProfile.display_name || userProfile.name || '').trim();
      if (name) {
        return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
      }
    }
    return 'U';
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (npub) {
      navigate(`/profile/${npub}`);
    }
  };

  // If still loading, show loading state
  if (isLoading) {
    return (
      <div 
        className="flex items-center gap-3 px-2 py-2 rounded-md cursor-wait"
        aria-label="Loading profile..."
      >
        <Avatar>
          <AvatarFallback className="animate-pulse">U</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="w-20 h-4 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-accent"
      aria-label="Your profile info"
      onClick={handleProfileClick}
    >
      <Avatar>
        {userProfile?.picture ? (
          <>
            <AvatarImage 
              src={userProfile.picture} 
              alt={userProfile.display_name || userProfile.name || 'User'} 
            />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </>
        ) : (
          <AvatarFallback>{getUserInitials()}</AvatarFallback>
        )}
      </Avatar>
      <div className="flex flex-col">
        <span className="font-medium text-sm truncate max-w-[140px]">
          {userProfile?.display_name || userProfile?.name || 'User'}
        </span>
        {userProfile?.nip05 && (
          <span className="text-xs text-muted-foreground truncate max-w-[140px] flex items-center gap-1">
            {userProfile.nip05}
            <CheckCircle2 className="h-3 w-3 text-primary" />
          </span>
        )}
      </div>
    </div>
  );
};

export default SidebarUserProfile;
