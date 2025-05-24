import React from "react";
import { useParams } from "react-router-dom";
import { useProfile } from "@/hooks/useUnifiedProfile";
import { useAuth } from "@/hooks/useAuth";
import { nostrService } from "@/lib/nostr";
import { profileAdapter } from "@/lib/adapters/ProfileAdapter";
import UnifiedPageHeader from "@/components/navigation/UnifiedPageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { Card } from "@/components/ui/card";
import { StatsDisplay } from "@/components/note/actions";
import FollowButton from "@/components/FollowButton";

interface ProfileStats {
  likeCount: number;
  repostCount: number;
  replyCount: number;
  zapCount: number;
  zapAmount: number;
  followerCount: number;
  followingCount: number;
  postCount: number;
}

export default function ProfilePage() {
  const { npub } = useParams();
  const { publicKey: myPublicKey } = useAuth();

  // Convert myPublicKey to npub
  const myNpub = React.useMemo(() => {
    try {
      return myPublicKey ? profileAdapter.convertHexToNpub(myPublicKey) : undefined;
    } catch (error) {
      console.error("[ProfilePage] Error converting pubkey to npub:", error);
      return undefined;
    }
  }, [myPublicKey]);

  // Convert current profile's npub to hex pubkey
  const publicKey = React.useMemo(() => {
    try {
      return profileAdapter.convertNpubToHex(npub || myNpub);
    } catch (error) {
      console.error("[ProfilePage] Error converting pubkey to npub:", error);
      return undefined;
    }
  }, [npub, myNpub]);

  const effectiveNpub = npub || myNpub;

  // Load profile and related data
  const [profileState, profileActions] = useProfile(effectiveNpub, { 
    autoLoad: !!effectiveNpub,
    mode: 'single'
  });

  const [editOpen, setEditOpen] = React.useState(false);
  
  // Stats state
  const [stats, setStats] = React.useState<ProfileStats>({
    likeCount: 0,
    repostCount: 0,
    replyCount: 0,
    zapCount: 0,
    zapAmount: 0,
    followerCount: 0,
    followingCount: 0,
    postCount: 0
  });

  // Load stats when profile changes
  React.useEffect(() => {
    const fetchStats = async () => {
      if (!publicKey) return;
      
      try {
        // Get reaction counts from the social manager
        const reactionCounts = await nostrService.socialManager.getReactionCounts(publicKey);
        
        // Get follower/following counts
        const [following, followers] = await Promise.all([
          nostrService.data.getFollowing(publicKey),
          nostrService.getFollowers(publicKey)
        ]);
        
        // Get post count by querying user's posts
        const posts = await nostrService.queryEvents([{
          kinds: [1],
          authors: [publicKey],
          limit: 100
        }]);

        setStats({
          ...reactionCounts,
          followerCount: followers?.length || 0,
          followingCount: following?.length || 0,
          postCount: posts?.length || 0
        });
      } catch (error) {
        console.error("Error loading profile stats:", error);
      }
    };
    
    fetchStats();
  }, [publicKey]);

  // Get profile data from the profile state
  const profile = 'profile' in profileState ? profileState.profile : null;
  const loading = 'loading' in profileState ? profileState.loading : false;
  const isOwnProfile = 'isOwnProfile' in profileState ? profileState.isOwnProfile : false;

  const getDisplayName = () => {
    if (!profile) return "User";
    return profile.display_name || profile.name || "User";
  };

  const getAvatarFallback = () => {
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <UnifiedPageHeader title="Profile" variant="page" />
      <div className="flex flex-col items-center gap-4 mt-8">
        <Avatar className="w-24 h-24">
          {loading ? (
            <AvatarFallback className="animate-pulse text-3xl">{getAvatarFallback()}</AvatarFallback>
          ) : (
            <>
              <AvatarImage src={profile?.picture} alt={getDisplayName()} />
              <AvatarFallback className="text-3xl">{getAvatarFallback()}</AvatarFallback>
            </>
          )}
        </Avatar>
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">{getDisplayName()}</h2>
          {!isOwnProfile && effectiveNpub && publicKey && (
            <FollowButton 
              pubkey={publicKey}
              variant="default"
              size="default"
            />
          )}
        </div>
        {profile?.nip05 && (
          <div className="text-sm text-muted-foreground">{profile.nip05}</div>
        )}
        {profile?.about && (
          <p className="text-center text-base text-muted-foreground max-w-md">{profile.about}</p>
        )}
        {profile?.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline mt-2"
          >
            {profile.website}
          </a>
        )}
        {isOwnProfile && (
          <button
            onClick={() => setEditOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Edit Profile
          </button>
        )}

        <Card className="w-full mt-4">
          <StatsDisplay {...stats} />
        </Card>
      </div>

      {isOwnProfile && profile && (
        <EditProfileModal
          profile={profile}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </div>
  );
}
