import * as React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBasicProfile } from "@/hooks/useUnifiedProfile";
import { nostrService } from "@/lib/nostr";

/**
 * useSidebarProfile Hook - Now uses unified profile hook
 */
export function useSidebarProfile() {
  const { isLoggedIn, publicKey } = useAuth();
  
  // Convert publicKey to npub for the unified profile hook
  const npub = React.useMemo(() => {
    if (!publicKey) return undefined;
    try {
      // Use nostrService directly instead of profileAdapter
      return nostrService.getNpubFromHex(publicKey);
    } catch (error) {
      console.error("[useSidebarProfile] Error converting pubkey to npub:", error);
      return undefined;
    }
  }, [publicKey]);
  
  // Use basic profile hook for sidebar
  const [profileState] = useBasicProfile(npub, { 
    enableDebug: false,
    enableRetry: false,
    autoLoad: !!npub
  });

  // Extract profile and loading flag safely, initialize as null
  const userProfileData = 'profile' in profileState ? profileState.profile : null;
  const isLoadingProfile = 'loading' in profileState ? profileState.loading : true;

  return { 
    isLoggedIn, 
    userProfile: userProfileData, 
    isLoading: isLoadingProfile 
  };
}
