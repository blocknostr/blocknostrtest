import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useUnifiedProfile';
import { profileAdapter } from '@/lib/adapters/ProfileAdapter';

/**
 * NoteFormAvatar Component - Now uses unified profile hook
 */
export function NoteFormAvatar() {
  const { publicKey } = useAuth();
  
  // Convert publicKey to npub for the unified profile hook
  const npub = useMemo(() => {
    if (!publicKey) return undefined;
    try {
      return profileAdapter.convertHexToNpub(publicKey);
    } catch (error) {
      console.error("[NoteFormAvatar] Error converting pubkey to npub:", error);
      return undefined;
    }
  }, [publicKey]);
  
  // Use unified profile hook
  const [profileState] = useProfile(npub, { 
    enableDebug: false,
    autoLoad: !!npub
  });
  
  const profile = (profileState as any).profile;

  const getDisplayName = () => {
    if (!profile) return 'User';
    return profile.display_name || profile.name || 'User';
  };

  const getAvatarFallback = () => {
    const name = getDisplayName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <Avatar className="h-10 w-10">
      <AvatarImage 
        src={profile?.picture} 
        alt={getDisplayName()}
      />
      <AvatarFallback className="bg-primary text-primary-foreground">
        {getAvatarFallback()}
      </AvatarFallback>
    </Avatar>
  );
}
